import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CargoDocument = Cargo & Document;

@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Cargo {
  @Prop({ required: true })
  Nombre: string;

  @Prop()
  Descripcion: string;

  @Prop({ type: String, default: null })
  ParentId: string | null;

  // @Prop()
  // Level: number;

  @Prop({ type: Boolean, default: true })
  IsActive: boolean;

  @Prop({ required: true })
  CompanyId: string;

  @Prop({ type: String, default: null })
  CreatedBy: string | null;

  @Prop({ type: String, default: null })
  UpdatedBy: string | null;
}

export const CargoSchema = SchemaFactory.createForClass(Cargo);