import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

// --- Esquema para Puesto (referencia al _id del Puesto + opcionalmente
// qué Trabajador específico ocupa ese Puesto en esta actividad) ---
@Schema({ _id: false })
export class PuestoRef {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Puesto' })
  id: Types.ObjectId;

  // ID del Trabajador (colección `trabajador`, _id numérico simple) que
  // específicamente ocupa este Puesto para esta actividad -- necesario
  // porque un mismo Puesto (ej. "Asistente") puede tener varias personas
  // asignadas, y sin esto no había forma de saber cuál de ellas era.
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  trabajadorId: number | string | null;
}
export const PuestoRefSchema = SchemaFactory.createForClass(PuestoRef);

// --- Esquema para Descripcion ---
@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Descripcion {
  _id: Types.ObjectId;

  @Prop({ required: true })
  texto: string;

  @Prop({ type: [PuestoRefSchema], default: [] })
  puestos: PuestoRef[];

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}
export const DescripcionSchema = SchemaFactory.createForClass(Descripcion);
DescripcionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    delete ret._id;
  },
});

@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Actividad {
  _id: Types.ObjectId;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: [DescripcionSchema], default: [] })
  descripciones: Descripcion[];

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}
export const ActividadSchema = SchemaFactory.createForClass(Actividad);
ActividadSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    delete ret._id;
  },
});

// --- Esquema para Subproceso (recursivo) ---
@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Subproceso {
  _id: Types.ObjectId;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: [ActividadSchema], default: [] })
  actividades: Actividad[];

  @Prop({ type: [], default: [] }) // Se define de forma recursiva más abajo
  subprocesos: Subproceso[];

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}
export const SubprocesoSchema = SchemaFactory.createForClass(Subproceso);
SubprocesoSchema.add({
  subprocesos: { type: [SubprocesoSchema], default: [] },
});
SubprocesoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    delete ret._id;
  },
});

// --- Esquema para Proceso ---
@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Proceso {
  _id: Types.ObjectId;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: [SubprocesoSchema], default: [] })
  subprocesos: Subproceso[];

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}
export const ProcesoSchema = SchemaFactory.createForClass(Proceso);
ProcesoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    delete ret._id;
  },
});

// --- Esquema Principal para Macroproceso ---
export type MacroprocesoDocument = Macroproceso & Document;

@Schema({
  collection: 'macroprocesos',
  timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
})
export class Macroproceso {
  @Prop({ required: true })
  nombre: string;

  @Prop({ type: String, ref: 'Company', required: true })
  CompanyId: string;

  @Prop({ type: [ProcesoSchema], default: [] })
  procesos: Proceso[];

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}

export const MacroprocesoSchema = SchemaFactory.createForClass(Macroproceso);
