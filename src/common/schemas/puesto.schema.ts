import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class Requisito {
  @Prop()
  Id: number;
  @Prop()
  Requisito: string;
}
const RequisitoSchema = SchemaFactory.createForClass(Requisito);

@Schema({ _id: false })
class Responsible {
  @Prop()
  Id: number;
  @Prop({ type: String }) // Referencia a User._id
  UsuarioId: string;
  @Prop()
  Name: string;
  @Prop()
  Email: string;
}
const ResponsibleSchema = SchemaFactory.createForClass(Responsible);

@Schema({ _id: false })
class MofDuty {
  @Prop()
  Id: number;
  @Prop()
  Tipo: string;
  @Prop()
  Descripcion: string;
}
const MofDutySchema = SchemaFactory.createForClass(MofDuty);

export type PuestoDocument = Puesto & Document;

@Schema({ timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' } })
export class Puesto {
  @Prop({ required: true })
  Nombre: string;

  @Prop()
  Descripcion: string;

  @Prop()
  CompanyId: string;

  @Prop()
  IsActive: boolean;

  @Prop({ type: String })
  AreaId: string;
  @Prop({ type: String })
  UbicacionId: string;
  @Prop({ type: [RequisitoSchema] }) requisitos: Requisito[];
  @Prop({ type: [ResponsibleSchema] }) responsibles: Responsible[];
  @Prop({ type: [MofDutySchema] }) mof_duties: MofDuty[];
  @Prop({ required: true, type: String })
  CargoId: string;

  @Prop({ type: Types.ObjectId, ref: 'Puesto', default: null })
  puestoParentId: Types.ObjectId;

  @Prop({ type: String, default: null })
  CreatedBy: string | null;

  @Prop({ type: String, default: null })
  UpdatedBy: string | null;
}

export const PuestoSchema = SchemaFactory.createForClass(Puesto);
