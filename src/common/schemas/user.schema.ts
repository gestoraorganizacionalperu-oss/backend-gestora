import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
  collection: 'users',
})
export class User {
  @Prop({ required: true })
  Name: string;

  @Prop()
  LastName: string;

  @Prop({ type: String, default: null })
  Dni: string | null;

  @Prop({ type: String, required: false, unique: true, sparse: true, index: true })
  Email: string | null;

  @Prop({ type: String, default: null })
  Username: string | null;

  @Prop({ type: String, default: null })
  PasswordHash: string | null;

  @Prop()
  ProfileId: number;

  @Prop()
  HasCredentials: boolean;

  @Prop({ default: true })
  IsActive: boolean;

  @Prop({ type: String, ref: 'Company', required: true })
  CompanyId: string;

  @Prop({ type: String, ref: 'User', default: null })
  CreatedBy: string | null;

  @Prop({ type: String, ref: 'User', default: null })
  UpdatedBy: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);