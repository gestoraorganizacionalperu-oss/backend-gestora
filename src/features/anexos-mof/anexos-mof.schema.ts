import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AnexoMof extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'documentos' })
  documentoId: Types.ObjectId;

  @Prop({ required: true })
  nombreArchivo: string;

  @Prop({ required: true, type: Buffer })
  archivo: Buffer; // Archivo binario

  @Prop()
  tipo: string; // mime type, ej: 'application/pdf'

  @Prop()
  usuario: string; // opcional: quién subió el archivo
}

export const AnexoMofSchema = SchemaFactory.createForClass(AnexoMof);
