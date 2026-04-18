import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaestrosService } from './maestros.service';
import { MaestrosRepository } from './maestros.repository';
import { MaestrosController } from './maestros.controller';
import { Area, AreaSchema } from '../../common/schemas/area.schema';
import { Ubicacion, UbicacionSchema } from '../../common/schemas/ubicacion.schema';
import { Menu, MenuSchema } from '../../common/schemas/menu.perfil.schema';
import { TipoDocumento, TipoDocumentoSchema } from '../../common/schemas/tipo-documento.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Area.name, schema: AreaSchema },
      { name: Ubicacion.name, schema: UbicacionSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: TipoDocumento.name, schema: TipoDocumentoSchema },
    ]),
  ],
  controllers: [MaestrosController],
  providers: [MaestrosService, MaestrosRepository],
})
export class MaestrosModule {}