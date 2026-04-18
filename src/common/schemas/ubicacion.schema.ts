import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UbicacionDocument = Ubicacion & Document;

@Schema({ collection: 'ubicaciones' })
export class Ubicacion {
  @Prop({ required: true })
  Nombre: string;

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'Company', required: true })
  CompanyId: string;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}

export const UbicacionSchema = SchemaFactory.createForClass(Ubicacion);
UbicacionSchema.set('timestamps', { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' });