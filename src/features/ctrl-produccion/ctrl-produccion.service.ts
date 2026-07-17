import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigCtrlProduccion, ConfigCtrlProduccionDocument } from './schemas/config-ctrl-produccion.schema';
import { RegistroProduccion, RegistroProduccionDocument } from './schemas/registro-produccion.schema';
import { SaveConfigCtrlProduccionDto } from './dto/config-ctrl-produccion.dto';
import { GuardarRegistroDto } from './dto/registro-produccion.dto';

@Injectable()
export class CtrlProduccionService {
  constructor(
    @InjectModel(ConfigCtrlProduccion.name)
    private readonly configModel: Model<ConfigCtrlProduccionDocument>,
    @InjectModel(RegistroProduccion.name)
    private readonly registroModel: Model<RegistroProduccionDocument>,
  ) {}

  // ── Configuración ──────────────────────────────────────────────
  // Cada semana tiene su propio documento (identificado por companyId +
  // semanaInicio, el Lunes de esa semana en formato "YYYY-MM-DD"). Antes
  // había un único documento por empresa que se sobrescribía siempre.
  async getConfig(companyId: string, semanaInicio: string): Promise<ConfigCtrlProduccionDocument | null> {
    const doc = await this.configModel.findOne({ companyId, semanaInicio }).exec();
    if (doc) return doc;

    // Migración única: si esta empresa todavía no tiene NINGÚN documento
    // con semanaInicio (o sea, no se ha migrado desde el modelo viejo de
    // "un solo documento"), adoptamos ese documento viejo como si fuera
    // el de la semana pedida, en vez de perder esos datos.
    const yaMigrado = await this.configModel.exists({ companyId, semanaInicio: { $exists: true, $ne: null } });
    if (!yaMigrado) {
      const legado = await this.configModel.findOne({ companyId, semanaInicio: { $exists: false } }).exec();
      if (legado) {
        legado.semanaInicio = semanaInicio;
        await legado.save();
        return legado;
      }
    }
    return null;
  }

  async saveConfig(companyId: string, dto: SaveConfigCtrlProduccionDto): Promise<ConfigCtrlProduccionDocument> {
    const existing = await this.configModel.findOne({ companyId, semanaInicio: dto.semanaInicio }).exec();
    if (existing) {
      existing.actividades = dto.actividades as any;
      existing.proyectosOtros = dto.proyectosOtros as any;
      return existing.save();
    }
    return new this.configModel({ companyId, ...dto }).save();
  }

  // Trae todos los documentos de semana que se superponen con el rango
  // [desde, hasta] -- una semana "cuenta" si su Lunes cae hasta 6 días
  // antes de "desde" (para no perder los últimos días de una semana que
  // empezó justo antes del rango pedido).
  async getConfigsPorRango(companyId: string, desde: string, hasta: string): Promise<ConfigCtrlProduccionDocument[]> {
    const desdeDate = new Date(`${desde}T00:00:00`);
    desdeDate.setDate(desdeDate.getDate() - 6);
    const desdeMenos6 = desdeDate.toISOString().split('T')[0];
    return this.configModel
      .find({ companyId, semanaInicio: { $gte: desdeMenos6, $lte: hasta } })
      .exec();
  }

  // ── Registros de ejecución ─────────────────────────────────────
  async getRegistrosPorFecha(companyId: string, fecha: string): Promise<RegistroProduccionDocument[]> {
    return this.registroModel.find({ companyId, fecha }).exec();
  }

  async getRegistrosPorRango(companyId: string, desde: string, hasta: string): Promise<RegistroProduccionDocument[]> {
    return this.registroModel.find({ companyId, fecha: { $gte: desde, $lte: hasta } }).exec();
  }

  async guardarRegistro(companyId: string, dto: GuardarRegistroDto): Promise<RegistroProduccionDocument> {
    // La hora de inicio identifica la sesión: así, reiniciar una actividad ya
    // completada el mismo día (nueva horaInicio) crea un registro nuevo en vez
    // de sobrescribir la sesión anterior.
    const existing = await this.registroModel.findOne({
      companyId,
      actividadId: dto.actividadId,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
    }).exec();

    const duracionMinutos = this.calcularDuracionMinutos(dto.horaInicio, dto.horaFin);
    const datos = duracionMinutos !== undefined ? { ...dto, duracionMinutos } : dto;

    if (existing) {
      Object.assign(existing, datos);
      return existing.save();
    }

    return new this.registroModel({ companyId, ...datos }).save();
  }

  private calcularDuracionMinutos(horaInicio?: string, horaFin?: string): number | undefined {
    if (!horaInicio || !horaFin) return undefined;

    const [h1, m1, s1] = horaInicio.split(':').map(Number);
    const [h2, m2, s2] = horaFin.split(':').map(Number);
    const segundos1 = h1 * 3600 + m1 * 60 + (s1 || 0);
    const segundos2 = h2 * 3600 + m2 * 60 + (s2 || 0);
    const diferencia = segundos2 - segundos1;

    return diferencia > 0 ? Math.round(diferencia / 60) : 0;
  }
}
