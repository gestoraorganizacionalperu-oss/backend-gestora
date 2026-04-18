import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { MaestrosRepository } from './maestros.repository';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Ubicacion } from 'src/common/schemas/ubicacion.schema';
import { Area } from 'src/common/schemas/area.schema';
import { Connection, Model, Types } from 'mongoose';
import { UpdateUbicacionDto } from './dto/update-ubicaciones-areas.dto';

@Injectable()
export class MaestrosService {
  constructor(
    private readonly maestrosRepository: MaestrosRepository,
    @InjectModel(Ubicacion.name) private readonly ubicacionModel: Model<Ubicacion>,
    @InjectModel(Area.name) private readonly areaModel: Model<Area>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getPerfiles() {
    return this.maestrosRepository.findPerfiles();
  }

  async getTipoDocumentos() {
    return this.maestrosRepository.findTipoDocumentos();
  }

  async getAreas(companyId: string) {
    return this.maestrosRepository.findActiveAreasByCompany(companyId);
  }

  async getUbicacionesYAreas(companyId: string) {
    const ubicaciones = await this.maestrosRepository.findActiveUbicacionesByCompany(companyId);
    const areas = await this.maestrosRepository.findActiveAreasByCompany(companyId);
    // Agrupamos las áreas por UbicacionId para una búsqueda rápida
    const areasByUbicacion = areas.reduce((acc, area) => {
      const ubicacionId = area.UbicacionId.toString();
      if (!acc[ubicacionId]) {
        acc[ubicacionId] = [];
      }
      acc[ubicacionId].push({
        id: area._id,
        nombre: area.Nombre,
        Codigo: area.Codigo,
        isActive: area.IsActive,
      });
      return acc;
    }, {});

    // Combinamos los resultados
    const resultado = ubicaciones.map(ubicacion => {
      const ubicacionId = ubicacion._id.toString();
      return {
        id: ubicacionId,
        nombre: ubicacion.Nombre,
        isActive: ubicacion.IsActive,
        areas: areasByUbicacion[ubicacionId] || [],
      };
    });

    return resultado;
  }

    async updateUbicacionesYAreas(
      companyId: string,
      userId: string,
      payload: any[],
    ) {
      const session = await this.connection.startSession();
      session.startTransaction();
  
      try {
        // Procesar Upsert (Crear o Actualizar) basado en el payload
        for (const ubiData of payload) {
          let currentUbicacionId: Types.ObjectId;
  
          if (ubiData.id) {
            // --- Actualizar Ubicación Existente ---
            currentUbicacionId = new Types.ObjectId(ubiData.id);

            // Validación: Si se intenta desactivar, verificar dependencia en 'puestos'
            if (ubiData.isActive === false) {
              const puestoRelacionado = await this.connection.db!
                .collection('puestos')
                .findOne({
                  $or: [
                    { UbicacionId: ubiData.id },
                    { UbicacionId: new Types.ObjectId(ubiData.id) },
                  ],
                });

              if (puestoRelacionado) {
                throw new BadRequestException(
                  `No se puede desactivar la ubicación "${ubiData.nombre}" porque está siendo usada en uno o más puestos.`,
                );
              }
            }

            const updateFields: any = {
              Nombre: ubiData.nombre,
              UpdatedBy: new Types.ObjectId(userId),
              UpdatedAt: new Date(),
            };
            if (ubiData.isActive !== undefined) updateFields.IsActive = ubiData.isActive;

            await this.ubicacionModel.updateOne(
              { _id: currentUbicacionId },
              {
                $set: updateFields,
              },
              { session },
            );
          } else {
            // --- Crear Nueva Ubicación ---
            const newUbi = new this.ubicacionModel({
              Nombre: ubiData.nombre,
              CompanyId: new Types.ObjectId(companyId),
              IsActive: ubiData.isActive !== undefined ? ubiData.isActive : true,
              CreatedBy: new Types.ObjectId(userId),
              UpdatedBy: new Types.ObjectId(userId),
            });
            await newUbi.save({ session });
            currentUbicacionId = newUbi._id;
          }
  
          // Procesar Áreas de esta ubicación
          if (ubiData.areas && ubiData.areas.length > 0) {
            for (const areaData of ubiData.areas) {
              // Capturamos el código (Codigo o codigo) asegurando que se lea del payload
              const codigoInput = areaData.Codigo || areaData.codigo;

              if (areaData.id) {
                // --- Actualizar Área Existente ---
                const areaId = new Types.ObjectId(areaData.id);

                // Validación: Si se intenta desactivar, verificar dependencia en 'puestos'
                if (areaData.isActive === false) {
                  const puestoRelacionado = await this.connection.db!
                    .collection('puestos')
                    .findOne({
                      $or: [
                        { AreaId: areaData.id },
                        { AreaId: new Types.ObjectId(areaData.id) },
                      ],
                    });

                  if (puestoRelacionado) {
                    throw new BadRequestException(
                      `No se puede desactivar el área "${areaData.nombre}" porque está siendo usada en uno o más puestos.`,
                    );
                  }
                }

                const updateAreaFields: any = {
                  Nombre: areaData.nombre,
                  UbicacionId: currentUbicacionId, // Asegura consistencia
                  UpdatedBy: new Types.ObjectId(userId),
                  UpdatedAt: new Date(),
                };
                
                // Actualizamos el código si viene en la petición
                if (codigoInput) updateAreaFields.Codigo = codigoInput;
                
                if (areaData.isActive !== undefined) updateAreaFields.IsActive = areaData.isActive;

                await this.areaModel.updateOne(
                  { _id: areaId },
                  { $set: updateAreaFields },
                  { session, strict: false },
                );
              } else {
                // --- Crear Nueva Área ---
                const codigoFinal = codigoInput || areaData.nombre.substring(0, 2).toUpperCase();
                
                const newArea = new this.areaModel({
                  Nombre: areaData.nombre,
                  UbicacionId: currentUbicacionId,
                  CompanyId: new Types.ObjectId(companyId),
                  IsActive: areaData.isActive !== undefined ? areaData.isActive : true,
                  CreatedBy: new Types.ObjectId(userId),
                  UpdatedBy: new Types.ObjectId(userId),
                });

                if (codigoFinal) {
                  newArea.set('Codigo', codigoFinal, { strict: false });
                }

                await newArea.save({ session });
              }
            }
          }
        }
  
        await session.commitTransaction();
        return { message: 'Ubicaciones y áreas actualizadas correctamente.' };
      } catch (error) {
        await session.abortTransaction();
        if (error instanceof BadRequestException) {
          throw error;
        }
        console.error('Error actualizando maestros:', error);
        throw new InternalServerErrorException('Error al actualizar ubicaciones y áreas.');
      } finally {
        session.endSession();
      }
    }
}