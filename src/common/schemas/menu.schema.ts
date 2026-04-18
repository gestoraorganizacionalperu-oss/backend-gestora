import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'menus', timestamps: true })
export class Menu extends Document {
  @Prop({ type: [String], required: true })
  profiles: string[]; // Array de perfiles que pueden ver este menú, ej: ["Super Administrador"]

  @Prop({ type: Object, required: true })
  menuData: Record<string, any>; // Usamos un objeto genérico para máxima flexibilidad
}

export const MenuSchema = SchemaFactory.createForClass(Menu);