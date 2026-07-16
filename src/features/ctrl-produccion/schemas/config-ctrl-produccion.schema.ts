import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigCtrlProduccionDocument = ConfigCtrlProduccion & Document;

export class DiaValues {
  @Prop({ default: '' }) hProg: string;
  @Prop({ default: '' }) cantPro: string;
  // Hora en que debería iniciar/terminar la actividad ese día ("HH:mm").
  // hProg se calcula automáticamente a partir de estos dos en el frontend.
  @Prop({ default: '' }) horaInicio: string;
  @Prop({ default: '' }) horaFin: string;
  // El responsable ahora se asigna por día (antes era único por fila/actividad).
  @Prop({ default: '' }) responsableId: string;
}

export class FilaActividad {
  @Prop({ required: true }) actividadId: string;
  @Prop({ required: true }) actividadNombre: string;
  @Prop({ required: true }) procesoNombre: string;
  @Prop({ required: true }) subprocesoNombre: string;
  @Prop({ type: DiaValues, default: () => ({}) }) lunes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) martes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) miercoles: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) jueves: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) viernes: DiaValues;
  @Prop({ type: DiaValues, default: () => ({}) }) sabado: DiaValues;
}

export class FilaProyecto {
  @Prop({ default: '' }) descripcion: string;
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

  // Fecha del Lunes de la semana que representa este documento ("YYYY-MM-DD").
  // Antes de este campo, había UN SOLO documento por empresa que se
  // sobrescribía cada vez que se guardaba -- perdiendo el historial de
  // semanas anteriores. Ahora cada semana tiene su propio documento.
  @Prop({ required: false })
  semanaInicio?: string;

  @Prop({ type: [Object], default: [] })
  actividades: FilaActividad[];

  @Prop({ type: Object, default: () => ({}) })
  proyectoOtro: FilaProyecto;
}

export const ConfigCtrlProduccionSchema = SchemaFactory.createForClass(ConfigCtrlProduccion);
ConfigCtrlProduccionSchema.index({ companyId: 1, semanaInicio: 1 }, { unique: true, sparse: true });
