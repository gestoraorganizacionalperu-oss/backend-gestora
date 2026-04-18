import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Trabajador, TrabajadorDocument } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaDocument } from '../../common/schemas/asistencia.schema.js';

@Injectable()
export class ZktecoWebhookService {
  private readonly logger = new Logger(ZktecoWebhookService.name);
  private readonly verificationToken: string;
  private readonly encryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Trabajador.name) private trabajadorModel: Model<TrabajadorDocument>,
    @InjectModel(Asistencia.name) private asistenciaModel: Model<AsistenciaDocument>,
  ) {
    this.verificationToken = this.configService.get<string>('ZKTECO_VERIFICATION_TOKEN') ?? '';
    this.encryptionKey = this.configService.get<string>('ZKTECO_ENCRYPTION_KEY') ?? '';
  }

  /**
   * Verifica la firma HMAC-SHA256 enviada por ZKBio Zlink en la cabecera.
   * Retorna true si la firma es válida o si no hay firma (modo sin cifrado).
   */
  verifySignature(payload: string, signature: string | undefined): boolean {
    if (!signature || !this.verificationToken) return true;
    const expected = createHmac('sha256', this.verificationToken)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }

  /**
   * Genera la respuesta al challenge de verificación de ZKBio Zlink.
   * ZKBio Zlink envía un GET con ?echostr=XXX o challenge=XXX
   * y espera recibir el mismo valor de vuelta (con HMAC si hay encryption key).
   */
  buildChallengeResponse(echostr: string): string {
    if (!this.encryptionKey) return echostr;
    return createHmac('sha256', this.encryptionKey).update(echostr).digest('hex');
  }

  /**
   * Procesa el payload de evento enviado por ZKBio Zlink.
   * El formato puede variar según la versión del servidor Zlink.
   * Soporta los formatos más comunes de attendance event.
   */
  async processEvent(payload: any): Promise<{ processed: number }> {
    this.logger.log(`Evento recibido: ${JSON.stringify(payload)}`);

    // Formato 1: evento directo con tipo "att.record" o "realtime.att"
    if (payload?.event_type && payload?.data) {
      return this.handleEventData(payload.data);
    }

    // Formato 2: lista de eventos
    if (Array.isArray(payload)) {
      let total = 0;
      for (const item of payload) {
        const result = await this.processEvent(item);
        total += result.processed;
      }
      return { processed: total };
    }

    // Formato 3: wrapper con "events" array
    if (payload?.events && Array.isArray(payload.events)) {
      let total = 0;
      for (const event of payload.events) {
        const result = await this.processEvent(event);
        total += result.processed;
      }
      return { processed: total };
    }

    // Formato 4: registro directo con pin/emp_code y punch_time
    if (payload?.pin || payload?.emp_code || payload?.userId) {
      return this.handleEventData(payload);
    }

    this.logger.warn(`Formato de evento desconocido: ${JSON.stringify(payload)}`);
    return { processed: 0 };
  }

  private async handleEventData(data: any): Promise<{ processed: number }> {
    if (!data) return { processed: 0 };

    // Extraer campos normalizando distintos nombres de campo posibles
    const pin: string =
      data.pin ?? data.emp_code ?? data.userId ?? data.user_id ?? data.PersonID ?? '';
    const punchTime: string =
      data.punch_time ?? data.time ?? data.datetime ?? data.recordTime ?? data.AttTime ?? '';
    // 0 = entrada, 1 = salida (varía por firmware)
    const punchState: number =
      parseInt(data.punch_state ?? data.status ?? data.AttState ?? '0', 10);

    if (!pin || !punchTime) {
      this.logger.warn(`Datos incompletos en evento: pin=${pin}, time=${punchTime}`);
      return { processed: 0 };
    }

    try {
      await this.saveAttendance(pin, punchTime, punchState);
      return { processed: 1 };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error guardando asistencia PIN=${pin}: ${msg}`);
      return { processed: 0 };
    }
  }

  private async saveAttendance(pin: string, datetime: string, state: number): Promise<void> {
    const trabajador = await this.trabajadorModel.findOne({ nro_doc: pin }).lean();

    if (!trabajador) {
      this.logger.warn(`Trabajador no encontrado con DNI/PIN=${pin}`);
      return;
    }

    // Normaliza el datetime — puede venir como "2026-04-17T08:30:00" o "2026-04-17 08:30:00"
    const normalized = datetime.replace('T', ' ');
    const [datePart, timePart] = normalized.split(' ');
    const fecha = datePart;
    const hora = (timePart ?? '00:00').substring(0, 5);

    const trabajadorId = (trabajador as any)._id.toString();
    const existente = await this.asistenciaModel.findOne({ trabajador_id: trabajadorId, fecha });

    if (state === 0) {
      // ENTRADA
      if (existente) {
        this.logger.warn(`Entrada ya registrada para DNI=${pin} en fecha=${fecha}`);
        return;
      }

      const data: Record<string, unknown> = {
        trabajador_id: trabajadorId,
        nombre: trabajador.nombres,
        dni: trabajador.nro_doc,
        fecha,
        entrada: hora,
        horario_esperado: trabajador.hora_ingreso ?? '',
        empresa_id: trabajador.empresa_id,
        tardanza: false,
        minutos_tardanza: 0,
      };

      if (trabajador.hora_ingreso) {
        const [hEsp, mEsp] = trabajador.hora_ingreso.split(':').map(Number);
        const [hReal, mReal] = hora.split(':').map(Number);
        const diff = hReal * 60 + mReal - (hEsp * 60 + mEsp);
        if (diff > 0) {
          data.tardanza = true;
          data.minutos_tardanza = diff;
        }
      }

      await new this.asistenciaModel(data).save();
      this.logger.log(`ENTRADA via Zlink → ${trabajador.nombres} (${pin}) a las ${hora}`);
    } else if (state === 1) {
      // SALIDA
      if (!existente) {
        this.logger.warn(`Sin entrada previa para salida de DNI=${pin} en fecha=${fecha}`);
        return;
      }
      await this.asistenciaModel.findByIdAndUpdate(
        (existente as any)._id,
        { salida: hora },
        { new: true },
      );
      this.logger.log(`SALIDA via Zlink → ${trabajador.nombres} (${pin}) a las ${hora}`);
    } else {
      this.logger.debug(`State ${state} ignorado para PIN=${pin} (0=entrada, 1=salida)`);
    }
  }
}
