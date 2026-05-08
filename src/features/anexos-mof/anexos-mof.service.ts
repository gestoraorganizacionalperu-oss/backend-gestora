import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnexoMof } from './anexos-mof.schema';

@Injectable()
export class AnexosMofService {
  constructor(
    @InjectModel(AnexoMof.name) private anexoModel: Model<AnexoMof>,
  ) {}

  async create(data: Partial<AnexoMof>) {
    return this.anexoModel.create(data);
  }

  async findByDocumento(documentoId: string) {
    return this.anexoModel.find({ documentoId: new Types.ObjectId(documentoId) });
  }

  async findById(id: string) {
    return this.anexoModel.findById(id);
  }

  async delete(id: string) {
    return this.anexoModel.findByIdAndDelete(id);
  }
}
