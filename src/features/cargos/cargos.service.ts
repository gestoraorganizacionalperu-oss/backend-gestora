import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CargosRepository } from './cargos.repository.js';
import { CreateCargoDto } from './dto/create-cargo.dto.js';
import { UpdateCargoDto } from './dto/update-cargo.dto.js';
import { PuestosService } from '../puestos/puestos.service.js';

@Injectable()
export class CargosService {
  constructor(
    private cargosRepository: CargosRepository,
    private puestosService: PuestosService,
  ) {}

  async create(createCargoDto: CreateCargoDto, companyId: string, userId: string) {
    const cargoData = {
      Nombre: createCargoDto.name,
      Descripcion: createCargoDto.description,
      ParentId: createCargoDto.parentId,
      // Level: createCargoDto.level,
      CompanyId: companyId,
      IsActive: true, // Por defecto, un nuevo cargo está activo
      CreatedBy: userId, // Guardamos quién lo creó
    }
    return this.cargosRepository.create(cargoData);
  }

  async findAll(companyId: string) {
    return this.cargosRepository.findAllByCompany(companyId);
  }

  async findOne(id: string, companyId: string) {
    const cargo = await this.cargosRepository.findById(id, companyId);
    if (!cargo) {
      throw new NotFoundException(`Cargo con ID #${id} no encontrado.`);
    }
    return cargo;
  }

  async update(id: string, updateCargoDto: UpdateCargoDto, companyId: string, userId: string) {
    if (updateCargoDto.parentId) {
      if (updateCargoDto.parentId === id) {
        throw new ConflictException('Un cargo no puede ser su propio padre.');
      }
      if (await this.detectarCiclo(id, updateCargoDto.parentId, companyId)) {
        throw new ConflictException('La relacion de Cargo Padre está generando dependencia ciclica, no se proceso la actualización');
      }
    }

    const cargoUpdates = {
      ...(updateCargoDto.name && { Nombre: updateCargoDto.name }),
      ...(updateCargoDto.description && { Descripcion: updateCargoDto.description }),
      ...(updateCargoDto.parentId !== undefined && { ParentId: updateCargoDto.parentId }),
      // ...(updateCargoDto.level !== undefined && { Level: updateCargoDto.level }),
      UpdatedBy: userId, // Añadimos el ID del usuario que modifica
    };

    const updatedCargo = await this.cargosRepository.update(id, companyId, cargoUpdates);
    if (!updatedCargo) {
      throw new NotFoundException(`Cargo con ID #${id} no encontrado para actualizar.`);
    }
    return updatedCargo;
  }

  async remove(id: string, companyId: string, userId: string) {
    // Corrección: Implementamos la eliminación lógica en lugar de la física.
    // Actualizamos el campo IsActive a 0.
    const updatedCargo = await this.cargosRepository.update(id, companyId, { IsActive: false, UpdatedBy: userId });

    if (!updatedCargo) {
      throw new NotFoundException(`Cargo con ID #${id} no encontrado para eliminar.`);
    }

    // Desactivar también los puestos asociados a este cargo
    await this.puestosService.removeByCargoId(id, companyId, userId);

    return { message: `Cargo con ID #${id} y sus puestos asociados han sido desactivados (eliminación lógica).` };
  }

  private async detectarCiclo(cargoId: string, nuevoPadreId: string, companyId: string): Promise<boolean> {
    let currentId = nuevoPadreId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === cargoId) return true;
      if (visited.has(currentId)) break; // Evitar bucles infinitos si ya existen datos corruptos
      visited.add(currentId);

      const cargo = await this.cargosRepository.findById(currentId, companyId);
      if (!cargo || !cargo.ParentId) break;

      currentId = cargo.ParentId;
    }
    return false;
  }
}