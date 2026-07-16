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

export class TurnoHorario {
  @Prop({ default: '' })
  entrada: string; // formato HH:mm

  @Prop({ default: '' })
  salida: string; // formato HH:mm
}

export class HorarioDia {
  // Turno mañana y turno tarde, con el break de almuerzo entre ambos.
  @Prop({ type: TurnoHorario, default: () => ({}) })
  manana: TurnoHorario;

  @Prop({ type: TurnoHorario, default: () => ({}) })
  tarde: TurnoHorario;

  // Campos legados (formato anterior: un solo turno por día, sin separar
  // mañana/tarde). Se conservan solo para no romper documentos guardados
  // antes de este cambio -- el frontend ya no los escribe.
  @Prop()
  entrada?: string;

  @Prop()
  salida?: string;
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
