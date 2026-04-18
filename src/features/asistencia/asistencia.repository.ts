import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trabajador, TrabajadorDocument } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaDocument } from '../../common/schemas/asistencia.schema.js';
import { AsistenciaConfig, AsistenciaConfigDocument } from '../../common/schemas/asistencia-config.schema.js';

@Injectable()
export class AsistenciaRepository {
  constructor(
    @InjectModel(Trabajador.name) private trabajadorModel: Model<TrabajadorDocument>,
    @InjectModel(Asistencia.name) private asistenciaModel: Model<AsistenciaDocument>,
    @InjectModel(AsistenciaConfig.name) private configModel: Model<AsistenciaConfigDocument>,
  ) {}

  async getTrabajadores(): Promise<Trabajador[]> {
    return this.trabajadorModel.find().lean();
  }

  async getTodasAsistencias(companyId: string): Promise<Asistencia[]> {
    return this.asistenciaModel.find({ empresa_id: companyId }).lean();
  }

  async getAsistenciasByFecha(companyId: string, fecha: string): Promise<Asistencia[]> {
    return this.asistenciaModel.find({ empresa_id: companyId, fecha }).lean();
  }

  async findAsistencia(trabajadorId: string, fecha: string): Promise<AsistenciaDocument | null> {
    return this.asistenciaModel.findOne({ trabajador_id: trabajadorId, fecha });
  }

  async createAsistencia(data: Partial<Asistencia>): Promise<Asistencia> {
    const created = new this.asistenciaModel(data);
    return created.save();
  }

  async updateAsistencia(id: string, data: Partial<Asistencia>): Promise<Asistencia | null> {
    return this.asistenciaModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async updateHorarioTrabajador(id: string, data: { horario_ingreso?: string; hora_salida?: string }): Promise<Trabajador | null> {
    return this.trabajadorModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async getConfigByEmpresa(empresaId: string): Promise<AsistenciaConfig | null> {
    return this.configModel.findOne({ empresa_id: empresaId }).lean();
  }

  async createConfig(data: Partial<AsistenciaConfig>): Promise<AsistenciaConfig> {
    const created = new this.configModel(data);
    return created.save();
  }

  async updateConfig(empresaId: string, data: Partial<AsistenciaConfig>): Promise<AsistenciaConfig | null> {
    return this.configModel.findOneAndUpdate({ empresa_id: empresaId }, data, { new: true }).lean();
  }
}
