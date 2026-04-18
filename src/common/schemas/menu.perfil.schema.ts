import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ collection: 'menus' })
export class Menu {
  @Prop({ required: true })
  IdPerfil: number;

  @Prop({ required: true })
  NamePerfil: string;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);