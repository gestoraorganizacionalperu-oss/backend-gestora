import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Asumo que tienes estos modelos definidos en algún lugar de tu aplicación
// y que los esquemas se llaman 'User', 'Company', 'TipoDocumento', 'SubProceso'

// Esquema para las definiciones anidadas
@Schema({ _id: true, timestamps: false })
export class Definicion {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  termino: string;

  @Prop({ required: true })
  descripcion: string;
}
export const DefinicionSchema = SchemaFactory.createForClass(Definicion);

// Esquema para el control de cambios anidado
@Schema({ _id: false, timestamps: false })
export class ControlCambio {
  @Prop({ required: true })
  item: number;

  @Prop({ required: true })
  modificacion: string;

  @Prop({ required: true })
  version: string;

  @Prop({ required: true, type: Date })
  fecha: Date;
}
export const ControlCambioSchema = SchemaFactory.createForClass(ControlCambio);

// Esquema para los adjuntos
@Schema({ _id: true, timestamps: false })
export class Adjunto {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  nombreArchivo: string;

  @Prop({ required: true })
  idGoogle: string;

  @Prop({ default: true })
  IsActive: boolean;
}
export const AdjuntoSchema = SchemaFactory.createForClass(Adjunto);

// Esquema para la referencia a usuarios
@Schema({ _id: false })
class UsuarioRef {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuarioId: Types.ObjectId;
}
export const UsuarioRefSchema = SchemaFactory.createForClass(UsuarioRef);

@Schema({ timestamps: true, collection: 'documentos' })
export class Documento extends Document {
  @Prop({ required: true, unique: true })
  codigo: string;

  @Prop({ type: Types.ObjectId, ref: 'TipoDocumento', required: true })
  tipoDocumentoId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubProceso', required: true })
  subProcesoId: Types.ObjectId;

  @Prop({ required: true })
  subProcesoNombre: string;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  areaId: Types.ObjectId;

  @Prop({ required: true })
  areaCodigo: string;

  @Prop({ required: true })
  desdeMatrizProceso: boolean;

  @Prop({ default: '1.0' })
  version: string;

  @Prop({ required: true })
  descripcionDocumento: string;

  @Prop({ required: true })
  objetivo: string;

  @Prop({ required: true })
  alcance: string;

  @Prop({ type: [DefinicionSchema], default: [] })
  definiciones: Types.DocumentArray<Definicion>;

  @Prop({ type: UsuarioRefSchema, required: true })
  elaboradoPor: UsuarioRef;

  @Prop({ type: UsuarioRefSchema, required: true })
  revisadoPor: UsuarioRef;

  @Prop({ type: UsuarioRefSchema, required: true })
  aprobadoPor: UsuarioRef;

  @Prop({ type: [ControlCambioSchema], default: [] })
  controlCambios: Types.DocumentArray<ControlCambio>;

  @Prop({ type: [AdjuntoSchema], default: [] })
  adjuntos: Types.DocumentArray<Adjunto>;

  @Prop({ type: Boolean, default: false })
  vbElaborado: boolean;

  @Prop({ type: Boolean, default: false })
  vbRevisado: boolean;

  @Prop({ type: Boolean, default: false })
  vbAprobado: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const DocumentoSchema = SchemaFactory.createForClass(Documento);