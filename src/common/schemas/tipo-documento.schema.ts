import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TipoDocumentoDocument = TipoDocumento & Document;

@Schema({ collection: 'tipoDocumentos', timestamps: true })
export class TipoDocumento {
  @Prop({ required: true })
  tipo_documento: string;

  @Prop({ required: true, unique: true })
  codigo: string;
}

export const TipoDocumentoSchema = SchemaFactory.createForClass(TipoDocumento);