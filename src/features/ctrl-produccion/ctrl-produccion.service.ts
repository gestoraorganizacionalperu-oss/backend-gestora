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
  async getConfig(companyId: string): Promise<ConfigCtrlProduccionDocument | null> {
    return this.configModel.findOne({ companyId }).exec();
  }

  async saveConfig(companyId: string, dto: SaveConfigCtrlProduccionDto): Promise<ConfigCtrlProduccionDocument> {
    const existing = await this.configModel.findOne({ companyId }).exec();
    if (existing) {
      existing.actividades = dto.actividades as any;
      existing.proyectoOtro = dto.proyectoOtro as any;
      return existing.save();
    }
    return new this.configModel({ companyId, ...dto }).save();
  }

  // ── Registros de ejecución ─────────────────────────────────────
  async getRegistrosPorFecha(companyId: string, fecha: string): Promise<RegistroProduccionDocument[]> {
    return this.registroModel.find({ companyId, fecha }).exec();
  }

  async guardarRegistro(companyId: string, dto: GuardarRegistroDto): Promise<RegistroProduccionDocument> {
    const existing = await this.registroModel.findOne({
      companyId,
      actividadId: dto.actividadId,
      fecha: dto.fecha,
    }).exec();

    if (existing) {
      Object.assign(existing, dto);
      return existing.save();
    }

    return new this.registroModel({ companyId, ...dto }).save();
  }
}
