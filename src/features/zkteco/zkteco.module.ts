import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trabajador, TrabajadorSchema } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaSchema } from '../../common/schemas/asistencia.schema.js';
import { ZktecoController } from './zkteco.controller.js';
import { ZktecoService } from './zkteco.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trabajador.name, schema: TrabajadorSchema },
      { name: Asistencia.name, schema: AsistenciaSchema },
    ]),
  ],
  controllers: [ZktecoController],
  providers: [ZktecoService],
  exports: [ZktecoService],
})
export class ZktecoModule {}
