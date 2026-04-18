import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AsistenciaConfigDocument = AsistenciaConfig & Document;

@Schema({ collection: 'asistencia_config', timestamps: true })
export class AsistenciaConfig {
  @Prop({ required: true })
  empresa_id: string;

  @Prop({ required: true })
  horario_ingreso: string;

  @Prop({ default: 10 })
  tolerancia_minutos: number;

  @Prop({ default: 60 })
  minutos_acumulados_mes: number;

  @Prop({ default: true })
  activo: boolean;

  @Prop()
  descripcion: string;
}

export const AsistenciaConfigSchema = SchemaFactory.createForClass(AsistenciaConfig);
