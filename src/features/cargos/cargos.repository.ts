import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cargo, CargoDocument } from '../../common/schemas/cargo.schema.js';

@Injectable()
export class CargosRepository {
  private readonly logger = new Logger(CargosRepository.name);

  constructor(
    @InjectModel(Cargo.name) private cargoModel: Model<CargoDocument>,
  ) {}

  async create(cargoData: Partial<Cargo>): Promise<CargoDocument> {
    const newCargo = new this.cargoModel(cargoData);
    console.log("zzzzzzzzzzzzzzzzzzzzz",newCargo)
    try {
      return await newCargo.save();
    } catch (error) {
      this.logger.error(`Error al crear el cargo: ${error.message}`, error.stack);
      // Código de error de MongoDB para clave duplicada.
      if (error.code === 11000) {
        throw new ConflictException('Ya existe un cargo con esas propiedades únicas (ej. nombre).');
      }
      throw new InternalServerErrorException('Ocurrió un error al guardar el cargo en la base de datos.');
    }
  }

  async findAllByCompany(companyId: string): Promise<CargoDocument[]> {
    // Corrección: Añadimos el filtro para devolver solo los cargos activos.
    return this.cargoModel.find({ CompanyId: companyId, IsActive: 1 }).exec();
  }

  async findById(id: string, companyId: string): Promise<CargoDocument | null> {
    return this.cargoModel.findOne({ _id: id, CompanyId: companyId }).exec();
  }

  async update(id: string, companyId: string, cargoUpdates: Partial<Cargo>): Promise<CargoDocument | null> {
    return this.cargoModel.findOneAndUpdate({ _id: id, CompanyId: companyId }, { $set: cargoUpdates }, { new: true }).exec();
  }

  async remove(id: string, companyId: string): Promise<any> {
    return this.cargoModel.deleteOne({ _id: id, CompanyId: companyId }).exec();
  }
}