import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolicitudPermisosController } from './solicitud-permisos.controller';
import { SolicitudPermisoSchema } from './solicitud-permiso.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SolicitudPermiso', schema: SolicitudPermisoSchema },
    ]),
  ],
  controllers: [SolicitudPermisosController],
})
export class SolicitudPermisosModule {}
