import { Module } from '@nestjs/common';
import { MenusService } from './menus.service.js';
import { MenusController } from './menus.controller.js';
import { MenusRepository } from './menus.repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from '../../common/schemas/menu.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }])],
  controllers: [MenusController],
  providers: [MenusService, MenusRepository],
})
export class MenusModule {}