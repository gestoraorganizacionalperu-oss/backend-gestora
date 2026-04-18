import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trabajador, TrabajadorDocument } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaDocument } from '../../common/schemas/asistencia.schema.js';

export interface ZktecoDeviceStatus {
  sn: string;
  lastSeen: Date;
  online: boolean;
}

@Injectable()
export class ZktecoService {
  private readonly logger = new Logger(ZktecoService.name);
  private readonly deviceStatus = new Map<string, ZktecoDeviceStatus>();
  // Umbral: dispositivo se considera offline si no hace heartbeat en 2 minutos
  private readonly OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

  constructor(
    @InjectModel(Trabajador.name) private trabajadorModel: Model<TrabajadorDocument>,
    @InjectModel(Asistencia.name) private asistenciaModel: Model<AsistenciaDocument>,
  ) {}

  /**
   * Genera la respuesta de configuración que el dispositivo ZKTeco espera
   * en el primer GET /iclock/cdata
   */
  getDeviceConfig(sn: string): string {
    this.logger.log(`Dispositivo ZKTeco conectado: SN=${sn}`);
    this.updateHeartbeat(sn);
    return [
      `GET OPTION FROM:${sn}`,
      'ATTStampFmt=yyyy-MM-dd HH:mm:ss',
      'OPERATTStampFmt=yyyy-MM-dd HH:mm:ss',
      'ATTLOGStamp=0',
      'OPERLOGStamp=0',
      'ATTPHOTOStamp=0',
      'ErrorDelay=30',
      'Delay=10',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TransFlag=1111000000',
      'Realtime=1',
      'Encrypt=0',
    ].join('\n');
  }

  /**
   * Actualiza la marca de tiempo del último heartbeat del dispositivo
   */
  updateHeartbeat(sn: string): void {
    this.deviceStatus.set(sn, { sn, lastSeen: new Date(), online: true });
  }

  /**
   * Devuelve el estado de todos los dispositivos registrados
   */
  getAllDeviceStatus(): ZktecoDeviceStatus[] {
    const now = Date.now();
    return Array.from(this.deviceStatus.values()).map((d) => ({
      ...d,
      online: now - d.lastSeen.getTime() < this.OFFLINE_THRESHOLD_MS,
    }));
  }

  /**
   * Procesa los registros de asistencia enviados por el dispositivo.
   * Formato ADMS por línea: PIN\tDatetime\tStatus\tVerify\tWorkCode\tR1\tR2
   *   - Status 0 = Entrada, Status 1 = Salida
   *   - PIN = nro_doc (DNI) del trabajador registrado en el dispositivo
   */
  async processAttendanceLogs(sn: string, rawBody: string): Promise<number> {
    const lines = rawBody.trim().split('\n').filter((l) => l.trim().length > 0);
    let processed = 0;

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const pin = parts[0].trim();
      const datetime = parts[1].trim().replace('+', ' ');
      const status = parseInt(parts[2] ?? '0', 10);

      try {
        await this.processRecord(pin, datetime, status);
        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error procesando registro PIN=${pin}: ${message}`);
      }
    }

    this.logger.log(
      `SN=${sn} → Procesados ${processed}/${lines.length} registros de asistencia`,
    );
    return processed;
  }

  private async processRecord(pin: string, datetime: string, status: number): Promise<void> {
    const trabajador = await this.trabajadorModel.findOne({ nro_doc: pin }).lean();

    if (!trabajador) {
      this.logger.warn(`No se encontró trabajador con DNI/PIN=${pin} en la base de datos`);
      return;
    }

    const [datePart, timePart] = datetime.split(' ');
    const fecha = datePart; // "YYYY-MM-DD"
    const hora = timePart?.substring(0, 5) ?? '00:00'; // "HH:MM"

    const trabajadorId = (trabajador as any)._id.toString();
    const existente = await this.asistenciaModel.findOne({ trabajador_id: trabajadorId, fecha });

    if (status === 0) {
      // ENTRADA
      if (existente) {
        this.logger.warn(`Entrada ya registrada para DN=${pin} en fecha=${fecha}`);
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
      this.logger.log(`ENTRADA registrada → ${trabajador.nombres} a las ${hora}`);
    } else if (status === 1) {
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
      this.logger.log(`SALIDA registrada → ${trabajador.nombres} a las ${hora}`);
    } else {
      this.logger.debug(`Status ${status} ignorado para PIN=${pin} (solo se procesan 0=entrada y 1=salida)`);
    }
  }
}
