import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Puesto, PuestoDocument } from '../../common/schemas/puesto.schema.js';
import { Macroproceso, MacroprocesoDocument } from '../../common/schemas/matrizprocesos.schema.js';

@Injectable()
export class PuestosRepository {
  constructor(
    @InjectModel(Puesto.name) private puestoModel: Model<PuestoDocument>,
    @InjectModel(Macroproceso.name) private macroprocesoModel: Model<MacroprocesoDocument>,
  ) {}

  async create(puestoData: Partial<Puesto>): Promise<PuestoDocument> {
    const newPuesto = new this.puestoModel(puestoData);
    return newPuesto.save();
  }

  async findAll(filters: Record<string, any>): Promise<PuestoDocument[]> {
    return this.puestoModel.find(filters).exec();
  }

  async findPuestoMofDetail(puestoId: string, companyId: string): Promise<any> {
    // 1. Obtener datos del puesto y cargo
    const puestoResult = await this.puestoModel.aggregate([
      { $match: { _id: new Types.ObjectId(puestoId), CompanyId: companyId, IsActive: true } },
      {
        $lookup: {
          from: 'cargos',
          let: { cargoId: '$CargoId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$cargoId' }] } } },
          ],
          as: 'cargoInfo',
        },
      },
      { $unwind: { path: '$cargoInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          Nombre: 1,
          CargoId: 1,
          NombreCargo: '$cargoInfo.Nombre',
          requisitos: 1,
        },
      },
    ]).exec();

    if (!puestoResult || puestoResult.length === 0) return null;
    const puesto = puestoResult[0];

    // 2. Buscar actividades en Macroprocesos
    const macroprocesos = await this.macroprocesoModel.find({ CompanyId: companyId, IsActive: true }).lean();
    const actividadesMap = new Map<string, any>();

    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.procesos) traverse(node.procesos);
        if (node.subprocesos) traverse(node.subprocesos);
        if (node.actividades) {
          node.actividades.forEach((actividad: any) => {
            if (actividad.descripciones) {
              actividad.descripciones.forEach((desc: any) => {
                if (desc.puestos && desc.puestos.some((p: any) => p.id && p.id.toString() === puestoId)) {
                  // Usamos el ID de la actividad como clave para evitar duplicados
                  if (!actividadesMap.has(actividad._id.toString())) {
                    actividadesMap.set(actividad._id.toString(), {
                      id: actividad._id,
                      nombre: actividad.nombre,
                      descripcion: desc.texto, // Descripción donde se encontró el puesto
                    });
                  }
                }
              });
            }
          });
        }
      });
    };

    traverse(macroprocesos);

    return {
      _id: puesto._id,
      Nombre: puesto.Nombre,
      CargoId: puesto.CargoId,
      NombreCargo: puesto.NombreCargo,
      requisitos: puesto.requisitos ? puesto.requisitos.map((r: any) => r.Requisito) : [],
      actividades: Array.from(actividadesMap.values()),
    };
  }

  async findMofMasivo(puestoIds: string[], companyId: string): Promise<any[]> {
    const objectIds = puestoIds.map((id) => new Types.ObjectId(id));

    // 1. Obtener datos de los puestos, cargo y area
    const puestos = await this.puestoModel.aggregate([
      { $match: { _id: { $in: objectIds }, CompanyId: companyId, IsActive: true } },
      {
        $lookup: {
          from: 'cargos',
          let: { cargoId: '$CargoId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$cargoId' }] } } },
          ],
          as: 'cargoInfo',
        },
      },
      { $unwind: { path: '$cargoInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'areas',
          let: { areaId: '$AreaId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$areaId' }] } } },
          ],
          as: 'areaInfo',
        },
      },
      { $unwind: { path: '$areaInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'puestos',
          let: { pid: '$puestoParentId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$pid'] } } },
          ],
          as: 'parentInfo',
        },
      },
      { $unwind: { path: '$parentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          Nombre: 1,
          CargoId: 1,
          NombreCargo: '$cargoInfo.Nombre',
          AreaId: 1,
          NombreArea: '$areaInfo.Nombre',
          requisitos: 1,
          puestoPadre: { $ifNull: ['$parentInfo.Nombre', 'ninguno'] },
          cantidadResponsables: { $size: { $ifNull: ['$responsibles', []] } },
        },
      },
    ]).exec();

    if (!puestos || puestos.length === 0) return [];

    // 2. Buscar actividades en Macroprocesos
    const macroprocesos = await this.macroprocesoModel.find({ CompanyId: companyId, IsActive: true }).lean();
    
    // Mapa para agrupar actividades por puesto. Clave: PuestoID, Valor: Map<ActividadID, ActividadData>
    const puestosActividadesMap = new Map<string, Map<string, any>>();
    
    // Inicializar mapa
    puestos.forEach(p => {
        puestosActividadesMap.set(p._id.toString(), new Map());
    });

    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.procesos) traverse(node.procesos);
        if (node.subprocesos) traverse(node.subprocesos);
        if (node.actividades) {
          node.actividades.forEach((actividad: any) => {
            if (actividad.descripciones) {
              actividad.descripciones.forEach((desc: any) => {
                if (desc.puestos && Array.isArray(desc.puestos)) {
                  desc.puestos.forEach((pRef: any) => {
                    if (pRef.id) {
                      const pIdStr = pRef.id.toString();
                      // Si el puesto está en nuestra lista de interés
                      if (puestosActividadesMap.has(pIdStr)) {
                        const actividadesMap = puestosActividadesMap.get(pIdStr);
                        if (actividadesMap && !actividadesMap.has(actividad._id.toString())) {
                          actividadesMap.set(actividad._id.toString(), {
                            id: actividad._id,
                            nombre: actividad.nombre,
                            descripcion: desc.texto
                          });
                        }
                      }
                    }
                  }
                  );
                }
              });
            }
          });
        }
      });
    };



    traverse(macroprocesos);

    // 3. Construir respuesta
    return puestos.map(p => ({
      _id: p._id,
      Nombre: p.Nombre,
      CargoId: p.CargoId,
      NombreCargo: p.NombreCargo,
      AreaId: p.AreaId,
      NombreArea: p.NombreArea,
      requisitos: p.requisitos ? p.requisitos.map((r: any) => r.Requisito) : [],
      actividades: Array.from(puestosActividadesMap.get(p._id.toString())?.values() || []),
      cantidadResponsables: p.cantidadResponsables || 0,
      puestoPadre: p.puestoPadre,
    }));
  }

  async findAllMof(companyId: string, userId?: string): Promise<any[]> {
    // 1. Obtener todos los macroprocesos de la empresa
    const macroprocesos = await this.macroprocesoModel.find({ CompanyId: companyId, IsActive: true }).lean();

    // 2. Extraer recursivamente los IDs de los puestos referenciados
    const puestoIds = new Set<string>();

    const traverse = (obj: any) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      if (typeof obj === 'object') {
        // Si encontramos un array de puestos, extraemos los IDs
        if (obj.puestos && Array.isArray(obj.puestos)) {
          obj.puestos.forEach((p: any) => {
            if (p.id) puestoIds.add(p.id.toString());
          });
        }
        // Continuamos bajando por la estructura conocida
        ['procesos', 'subprocesos', 'actividades', 'descripciones'].forEach(key => {
          if (obj[key]) traverse(obj[key]);
        });
      }
    };

    traverse(macroprocesos);
    const ids = Array.from(puestoIds).map(id => new Types.ObjectId(id));

    const matchQuery: any = { CompanyId: companyId, IsActive: true, _id: { $in: ids } };
    if (userId) {
      matchQuery['responsibles.UsuarioId'] = userId;
    }

    return this.puestoModel.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'cargos',
          let: { cargoId: '$CargoId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$cargoId' }] },
              },
            },
          ],
          as: 'cargoInfo',
        },
      },
      {
        $unwind: {
          path: '$cargoInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          Nombre: 1,
          CargoId: 1,
          NombreCargo: '$cargoInfo.Nombre',
        },
      },
    ]).exec();
  }

  async findOne(puestoId: string, companyId: string): Promise<PuestoDocument | null> {
    return this.puestoModel.findOne({ _id: puestoId, CompanyId: companyId, IsActive: true }).exec();
  }

  async update(puestoId: string, companyId: string, puestoUpdates: Partial<Puesto>): Promise<PuestoDocument | null> {
    return this.puestoModel.findOneAndUpdate({ _id: puestoId, CompanyId: companyId }, { $set: puestoUpdates }, { new: true }).exec();
  }

  async remove(puestoId: string, companyId: string): Promise<any> {
    return this.puestoModel.deleteOne({ _id: puestoId, CompanyId: companyId }).exec();
  }

  async deactivateByCargoId(cargoId: string, companyId: string, userId: string): Promise<void> {
    await this.puestoModel.updateMany(
      { CargoId: cargoId, CompanyId: companyId },
      { $set: { IsActive: false, UpdatedBy: userId } }
    ).exec();
  }

  async removeResponsible(puestoId: string, userId: string, companyId: string): Promise<any> {
    return this.puestoModel.updateOne(
      { _id: new Types.ObjectId(puestoId), CompanyId: companyId },
      { $pull: { responsibles: { UsuarioId: userId } } }
    ).exec();
  }

  async addResponsible(puestoId: string, responsibleData: { UsuarioId: string; Name: string; Email: string }, companyId: string): Promise<any> {
    const puesto = await this.puestoModel.findOne({ _id: new Types.ObjectId(puestoId), CompanyId: companyId }).lean();
    if (!puesto) return null;

    const currentResponsibles = puesto.responsibles || [];
    // Calcular el siguiente ID (max Id + 1)
    const maxId = currentResponsibles.reduce((max: number, item: any) => (item.Id > max ? item.Id : max), 0);
    
    const newResponsible = {
      Id: maxId + 1,
      ...responsibleData
    };

    return this.puestoModel.updateOne(
      { _id: new Types.ObjectId(puestoId), CompanyId: companyId },
      { $push: { responsibles: newResponsible } }
    ).exec();
  }
}