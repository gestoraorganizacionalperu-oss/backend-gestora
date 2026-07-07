import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PuestosRepository } from './puestos.repository.js';
import { CreatePuestoDto } from './dto/create-puesto.dto.js';
import { UpdatePuestoDto } from './dto/update-puesto.dto.js';
import { Puesto } from '../../common/schemas/puesto.schema.js';
import { User } from '../../common/schemas/user.schema.js';

@Injectable()
export class PuestosService {
  constructor(
    private puestosRepository: PuestosRepository,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(companyId: string, userId: string, createPuestoDto: CreatePuestoDto) {
    const puestoData = {
      Nombre: createPuestoDto.name,
      Descripcion: createPuestoDto.description,
      CargoId: createPuestoDto.cargoId,
      CompanyId: companyId,
      IsActive: true,
      CreatedBy: userId,
      AreaId: createPuestoDto.areaId,
      UbicacionId: createPuestoDto.locationId,
      puestoParentId: createPuestoDto.puestoParentId ? new Types.ObjectId(createPuestoDto.puestoParentId) : null,

      // Mapeo de Requisitos: Convertimos un array de strings a un array de objetos
      requisitos: createPuestoDto.technicalRequirements?.map((req, index) => ({
        Id: index + 1, // O una lógica de ID más robusta
        Requisito: req,
      })) || [],

    } as Partial<Puesto>;
    return this.puestosRepository.create(puestoData);
  }

  async findAll(companyId: string, cargoId?: string) {
    const filters = { CompanyId: companyId, IsActive: true };
    if (cargoId) {
      filters['CargoId'] = cargoId;
    }
    return this.puestosRepository.findAll(filters);
  }

  async findAllMof(companyId: string, userId: string) {
    const user = await this.userModel.findById(userId).select('ProfileId').lean();
    let filterUserId: string | undefined = undefined;
    const PERFILES_SIN_FILTRO = [1, 2];
    if (user && !PERFILES_SIN_FILTRO.includes(user.ProfileId)) {
      filterUserId = userId;
    }
    return this.puestosRepository.findAllMof(companyId, filterUserId);
  }

  async findPuestoMofDetail(puestoId: string, companyId: string) {
    const puestoDetail = await this.puestosRepository.findPuestoMofDetail(puestoId, companyId);
    if (!puestoDetail) {
      throw new NotFoundException(`Puesto con ID #${puestoId} no encontrado.`);
    }
    return puestoDetail;
  }

  async findMofMasivo(puestoIds: string[], companyId: string) {
    return this.puestosRepository.findMofMasivo(puestoIds, companyId);
  }

  async findOne(puestoId: string, companyId: string) {
    const puesto = await this.puestosRepository.findOne(puestoId, companyId);
    if (!puesto) {
      throw new NotFoundException(`Puesto con ID #${puestoId} no encontrado.`);
    }
    return puesto;
  }

  async update(puestoId: string, companyId: string, userId: string, updatePuestoDto: UpdatePuestoDto) {
    const puestoUpdates = {
      ...(updatePuestoDto.name && { Nombre: updatePuestoDto.name }),
      ...(updatePuestoDto.description && { Descripcion: updatePuestoDto.description }),
      ...(updatePuestoDto.locationId && { UbicacionId: updatePuestoDto.locationId }),
      ...(updatePuestoDto.areaId && { AreaId: updatePuestoDto.areaId }),
      ...(updatePuestoDto.cargoId && { CargoId: updatePuestoDto.cargoId }),
      UpdatedBy: userId,
    };

    if (updatePuestoDto.puestoParentId !== undefined) {
      if (updatePuestoDto.puestoParentId) {
        if (updatePuestoDto.puestoParentId === puestoId) {
          throw new ConflictException('Un puesto no puede ser su propio padre.');
        }
        if (await this.detectarCiclo(puestoId, updatePuestoDto.puestoParentId, companyId)) {
          throw new ConflictException('La relacion de puesto Padre está generando dependencia ciclica, no se proceso la actualización');
        }
      }
      (puestoUpdates as any).puestoParentId = updatePuestoDto.puestoParentId
        ? new Types.ObjectId(updatePuestoDto.puestoParentId)
        : null;
    }

    // Si se envían nuevos requisitos técnicos, se reemplaza el arreglo completo.
    if (updatePuestoDto.technicalRequirements) {
      puestoUpdates['requisitos'] = updatePuestoDto.technicalRequirements.map((req, index) => ({
        Id: index + 1,
        Requisito: req,
      }));
    }

    const updatedPuesto = await this.puestosRepository.update(puestoId, companyId, puestoUpdates as Partial<Puesto>);
    if (!updatedPuesto) {
      throw new NotFoundException(`Puesto con ID #${puestoId} no encontrado para actualizar.`);
    }
    return updatedPuesto;
  }

  async remove(puestoId: string, companyId: string, userId: string) {
    // Implementación de borrado lógico
    const updatedPuesto = await this.puestosRepository.update(puestoId, companyId, { IsActive: false, UpdatedBy: userId });
    if (!updatedPuesto) {
      throw new NotFoundException(`Puesto con ID #${puestoId} no encontrado para eliminar.`);
    }
    return { message: `Puesto con ID #${puestoId} ha sido desactivado.` };
  }

  async removeByCargoId(cargoId: string, companyId: string, userId: string) {
    return this.puestosRepository.deactivateByCargoId(cargoId, companyId, userId);
  }

  async removeUserFromPuesto(puestoId: string, userId: string, companyId: string) {
    return this.puestosRepository.removeResponsible(puestoId, userId, companyId);
  }

  async addUserToPuesto(puestoId: string, user: { id: string; name: string; email: string }, companyId: string) {
    const result = await this.puestosRepository.addResponsible(puestoId, { UsuarioId: user.id, Name: user.name, Email: user.email }, companyId);
    if (!result) {
      throw new NotFoundException(`El puesto con ID ${puestoId} no existe o no pertenece a la empresa.`);
    }
    return result;
  }

  private async detectarCiclo(puestoId: string, nuevoPadreId: string, companyId: string): Promise<boolean> {
    let currentId = nuevoPadreId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === puestoId) return true;
      if (visited.has(currentId)) break; // Evitar bucles infinitos si ya existen datos corruptos
      visited.add(currentId);

      const puesto = await this.puestosRepository.findOne(currentId, companyId);
      if (!puesto || !puesto.puestoParentId) break;

      currentId = puesto.puestoParentId.toString();
    }
    return false;
  }
}