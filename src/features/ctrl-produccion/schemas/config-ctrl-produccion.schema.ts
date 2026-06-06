import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigCtrlProduccionDocument = ConfigCtrlProduccion & Document;

export class DiaValues {
  @Prop({ default: '' }) hProg: string;
  @Prop({ default: '' }) cantPro: string;
}

export class FilaActividad {
  @Prop({ required: true }) actividadId: string;
  @Prop({ required: true }) actividadNombre: string;
  @Prop({ required: true }) procesoNombre: string;
  @Prop({ required: true }) subprocesoNombre: string;
  @Prop({ default: '' }) responsableId: string;
  @Prop({ type: DiaValues, default: () => ({}) }) lunes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) martes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) miercoles: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) jueves: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) viernes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) sabado: DiaValues;
}

export class FilaProyecto {
  @Prop({ default: '' }) descripcion: string;
  @Prop({ default: '' }) responsableId: string;
  @Prop({ type: DiaValues, default: () => ({}) }) lunes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) martes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) miercoles: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) jueves: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) viernes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) sabado: DiaValues;
}

@Schema({ collection: 'config_ctrl_produccion', timestamps: true })
export class ConfigCtrlProduccion {
  @Prop({ required: true })
  companyId: string;

  @Prop({ type: [Object], default: [] })
  actividades: FilaActividad[];

  @Prop({ type: Object, default: () => ({}) })
  proyectoOtro: FilaProyecto;
}

export const ConfigCtrlProduccionSchema = SchemaFactory.createForClass(ConfigCtrlProduccion);
