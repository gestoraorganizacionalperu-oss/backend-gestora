import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegistroProduccionDocument = RegistroProduccion & Document;

@Schema({ collection: 'registros_produccion', timestamps: true })
export class RegistroProduccion {
  @Prop({ required: true }) companyId: string;
  @Prop({ required: true }) actividadId: string;
  @Prop({ required: true }) actividadNombre: string;
  @Prop({ required: true }) procesoNombre: string;
  @Prop({ required: true }) subprocesoNombre: string;
  @Prop({ required: true }) fecha: string;       // YYYY-MM-DD
  @Prop({ default: null })  horaInicio: string;  // HH:MM:SS
  @Prop({ default: null })  horaFin: string;
  @Prop({ default: 0 })     logrados: number;
  @Prop({ default: 0 })     observados: number;
  @Prop({ default: 0 })     duracionMinutos: number;
  @Prop({ default: '' })    observaciones: string;
  @Prop({ default: '' })    responsableId: string;
  @Prop({ default: 'pendiente' }) estado: string; // pendiente | en_progreso | completado
}

export const RegistroProduccionSchema = SchemaFactory.createForClass(RegistroProduccion);
