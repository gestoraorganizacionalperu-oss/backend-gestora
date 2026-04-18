import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu } from '../../common/schemas/menu.schema.js';

@Injectable()
export class MenusRepository {
  constructor(@InjectModel(Menu.name) private menuModel: Model<Menu>) {}

  async findMenusByProfile(profile: string): Promise<any> {
    // Busca todos los menús donde el array 'profiles' incluya el perfil del usuario.
    const menus = await this.menuModel.find({ profiles: profile }).exec();

    // Mapeamos el resultado para devolver solo la data del menú, como se esperaba.
    return menus.map((menu) => menu.menuData);
  }
}