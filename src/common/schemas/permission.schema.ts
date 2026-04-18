import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class SubMenu {
  @Prop() Id: number;
  @Prop() Nombre: string;
  @Prop() Ruta: string;
  @Prop() Icono: string;
  @Prop() ParentId: number;
}
const SubMenuSchema = SchemaFactory.createForClass(SubMenu);

@Schema({ _id: false })
class Menu {
  @Prop() Id: number;
  @Prop() Nombre: string;
  @Prop({ type: String, default: null }) Ruta: string | null;
  @Prop() Icono: string;
  @Prop({ type: Number, default: null }) ParentId: number | null;
  @Prop({ type: [SubMenuSchema], default: undefined }) submenus?: SubMenu[];
}
const MenuSchema = SchemaFactory.createForClass(Menu);

export type PermissionDocument = Permission & Document;

@Schema({ collection: 'menus' }) // Forzamos a que use la colección 'menus'
export class Permission {
  @Prop()
  IdPerfil: number;

  @Prop()
  NamePerfil: string;

  @Prop()
  DescripcionPerfil: string;

  @Prop({ type: [MenuSchema] })
  Menus: Menu[];
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
