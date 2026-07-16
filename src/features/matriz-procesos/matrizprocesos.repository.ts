import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { MacroprocesoDto } from './dto/matrizprocesos.dto.js';
import {
  Macroproceso,
  MacroprocesoDocument,
} from '../../common/schemas/matrizprocesos.schema.js';

@Injectable()
export class MatrizProcesosRepository {
  constructor(
    @InjectModel(Macroproceso.name)
    private readonly macroprocesoModel: Model<MacroprocesoDocument>,
  ) {}

  async findByCompanyId(companyId: string): Promise<Macroproceso[]> {
    // Antes había un .populate() aquí para traer el Nombre del Puesto
    // referenciado en 'puestos.id'. Se quitó porque, al cruzar 5 niveles
    // de arreglos anidados (procesos.subprocesos.actividades.descripciones.
    // puestos.id), Mongoose reconstruía mal el objeto lean y terminaba
    // descartando campos hermanos como trabajadorId. El frontend ya
    // resuelve el nombre del Puesto por su cuenta (puestosMap), así que
    // no hace falta que el backend lo populate.
    return this.macroprocesoModel
      .find({ CompanyId: companyId, IsActive: true })
      .lean();
  }

  async updateMatriz(
    companyId: string,
    userId: string,
    matrizDto: MacroprocesoDto[],
  ): Promise<void> {
    const session = await this.macroprocesoModel.db.startSession();
    session.startTransaction();
    try {
      const incomingIds = matrizDto.map((m) => m._id).filter((id) => id);

      await this.macroprocesoModel.updateMany(
        { CompanyId: companyId, _id: { $nin: incomingIds } },
        { $set: { IsActive: false, UpdatedBy: userId } },
        { session },
      );

      for (const macro of matrizDto) {
        const payload = {
          ...macro,
          CompanyId: companyId,
          IsActive: true,
          UpdatedBy: userId,
          CreatedBy: userId,
        };
        await this.macroprocesoModel.updateOne(
          { _id: macro._id || new Types.ObjectId() },
          payload,
          { upsert: true, session },
        );
      }

      await session.commitTransaction();
    } finally {
      session.endSession();
    }
  }
}
