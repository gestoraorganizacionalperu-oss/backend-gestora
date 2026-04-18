import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Company {
  @Prop()
  RazonSocial: string;

  @Prop()
  RUC: string;

  @Prop()
  Abreviatura: string;

  @Prop()
  Direccion: string;

  @Prop()
  LogoUrl: string;

  @Prop()
  IsActive: boolean;

  @Prop({ type: String, default: null })
  CreatedBy: string | null;

  @Prop({ type: String, default: null })
  UpdatedBy: string | null;
}

export const CompanySchema = SchemaFactory.createForClass(Company);