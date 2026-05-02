import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HorarioTrabajador, HorarioTrabajadorDocument } from '../schemas/horario-trabajador.schema';

@Injectable()
export class HorarioTrabajadorService {
  constructor(
    @InjectModel(HorarioTrabajador.name)
    private readonly horarioTrabajadorModel: Model<HorarioTrabajadorDocument>,
  ) {}

  async createOrUpdateHorario(data: Partial<HorarioTrabajador>): Promise<HorarioTrabajador> {
    return this.horarioTrabajadorModel.findOneAndUpdate(
      { trabajadorId: data.trabajadorId },
      { $set: data },
      { upsert: true, new: true },
    );
  }

  async getHorarioByTrabajador(trabajadorId: string): Promise<HorarioTrabajador | null> {
    return this.horarioTrabajadorModel.findOne({ trabajadorId });
  }

  async getAllHorarios(): Promise<HorarioTrabajador[]> {
    return this.horarioTrabajadorModel.find();
  }
}
