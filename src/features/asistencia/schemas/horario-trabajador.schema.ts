import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HorarioTrabajadorDocument = HorarioTrabajador & Document;

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export class HorarioDia {
  @Prop({ required: true })
  entrada: string; // formato HH:mm

  @Prop({ required: true })
  salida: string; // formato HH:mm
}

@Schema({ collection: 'horarios_trabajador', timestamps: true })
export class HorarioTrabajador {
  @Prop({ required: true })
  trabajadorId: string;

  @Prop({
    type: Object,
    required: true,
    default: {},
  })
  horarios: Partial<Record<DiaSemana, HorarioDia>>;

  @Prop({ default: 30 })
  toleranciaMinutos: number;

  @Prop({ default: 120 })
  toleranciaMensualMax: number;
}

export const HorarioTrabajadorSchema = SchemaFactory.createForClass(HorarioTrabajador);
