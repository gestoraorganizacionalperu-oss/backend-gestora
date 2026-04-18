import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrabajadorDocument = Trabajador & Document;

@Schema({ collection: 'trabajador', timestamps: false })
export class Trabajador {
  @Prop()
  nombres: string;

  @Prop()
  nro_doc: string;

  @Prop({ type: Object })
  puesto: any;

  @Prop()
  hora_ingreso: string;

  @Prop()
  hora_salida: string;

  @Prop()
  empresa_id: string;

  @Prop()
  tipo_doc: number;
}

export const TrabajadorSchema = SchemaFactory.createForClass(Trabajador);
