import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AsistenciaDocument = Asistencia & Document;

@Schema({ collection: 'asistencia', timestamps: true })
export class Asistencia {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  dni: string;

  @Prop({ required: true })
  fecha: string;

  @Prop()
  entrada: string;

  @Prop()
  salida: string;

  @Prop()
  horario_esperado: string;

  @Prop({ default: false })
  tardanza: boolean;

  @Prop({ default: 0 })
  minutos_tardanza: number;

  @Prop({ default: 0 })
  minutos_tardanza_acumulados_mes: number;

  @Prop({ default: 0 })
  minutos_tardanza_limite_mes: number;

  @Prop({ default: false })
  marcar_descuento: boolean;

  @Prop()
  trabajador_id: string;

  @Prop()
  empresa_id: string;
}

export const AsistenciaSchema = SchemaFactory.createForClass(Asistencia);
