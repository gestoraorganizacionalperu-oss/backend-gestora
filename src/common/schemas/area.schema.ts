import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AreaDocument = Area & Document;

@Schema({ collection: 'areas' })
export class Area {
  @Prop({ required: true })
  Nombre: string;

  @Prop({ type: String, ref: 'Ubicacion' })
  UbicacionId: string;

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'Company' })
  CompanyId: string;

  @Prop({ type: String, ref: 'User' })
  CreatedBy: string;

  @Prop({ type: String, ref: 'User' })
  UpdatedBy: string;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
AreaSchema.set('timestamps', { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' });