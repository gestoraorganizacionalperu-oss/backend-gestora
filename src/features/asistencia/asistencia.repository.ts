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

  async getTrabajadores(companyId: string): Promise<Trabajador[]> {
    return this.trabajadorModel.find({ empresa_id: companyId }).lean();
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
    // El _id de Trabajador es un entero simple (ej. 2), no un ObjectId --
    // findByIdAndUpdate asume ObjectId por defecto y falla al convertir un
    // string tipo "2". Usamos la colección nativa para evitar ese cast.
    await this.trabajadorModel.collection.updateOne(
      { _id: Number(id) } as any,
      { $set: data },
    );
    return this.trabajadorModel.collection.findOne({ _id: Number(id) } as any) as any;
  }

  async updatePuestoTrabajador(id: string, puestoId: string | null): Promise<Trabajador | null> {
    await this.trabajadorModel.collection.updateOne(
      { _id: Number(id) } as any,
      { $set: { puesto: puestoId } },
    );
    return this.trabajadorModel.collection.findOne({ _id: Number(id) } as any) as any;
  }

  async getConfigByEmpresa(empresaId: string): Promise<AsistenciaConfig | null> {
    return this.configModel.findOne({ empresa_id: empresaId }).lean();
  }

  // ── Homologación Usuario <-> Trabajador ────────────────────────────

  async buscarTrabajadorPorDocumento(nroDoc: string, empresaId: string): Promise<Trabajador | null> {
    return this.trabajadorModel.findOne({ nro_doc: nroDoc, empresa_id: empresaId }).lean();
  }

  // El _id de `trabajador` es un entero legado (no ObjectId, ver nota en
  // updateHorarioTrabajador más arriba). No existe un contador dedicado,
  // así que el siguiente ID disponible se calcula tomando el _id numérico
  // más alto que exista hoy y sumando 1. Con pocos documentos (decenas,
  // no miles) esto es seguro; si la colección creciera mucho convendría
  // migrar a un contador atómico dedicado para evitar colisiones bajo
  // creación concurrente.
  private async siguienteIdTrabajador(): Promise<number> {
    const ultimo = await this.trabajadorModel.collection
      .find({}, { projection: { _id: 1 } })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const maximoActual = ultimo.length > 0 && typeof ultimo[0]._id === 'number' ? ultimo[0]._id : 0;
    return maximoActual + 1;
  }

  async crearTrabajador(data: {
    nombres: string;
    nro_doc: string;
    empresa_id: string;
    puesto?: string | null;
    tipo_doc?: number;
  }): Promise<Trabajador> {
    const nuevoId = await this.siguienteIdTrabajador();
    const documento = {
      _id: nuevoId,
      nombres: data.nombres,
      nro_doc: data.nro_doc,
      empresa_id: data.empresa_id,
      puesto: data.puesto ?? null,
      tipo_doc: data.tipo_doc ?? 1,
      hora_ingreso: '',
      hora_salida: '',
    };
    await this.trabajadorModel.collection.insertOne(documento as any);
    return documento as any;
  }

  async createConfig(data: Partial<AsistenciaConfig>): Promise<AsistenciaConfig> {
    const created = new this.configModel(data);
    return created.save();
  }

  async updateConfig(empresaId: string, data: Partial<AsistenciaConfig>): Promise<AsistenciaConfig | null> {
    return this.configModel.findOneAndUpdate({ empresa_id: empresaId }, data, { new: true }).lean();
  }
}
