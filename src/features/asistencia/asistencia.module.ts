import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trabajador, TrabajadorSchema } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaSchema } from '../../common/schemas/asistencia.schema.js';
import { AsistenciaConfig, AsistenciaConfigSchema } from '../../common/schemas/asistencia-config.schema.js';
import { AsistenciaRepository } from './asistencia.repository.js';
import { AsistenciaService } from './asistencia.service.js';
import { AsistenciaController } from './asistencia.controller.js';
import { AsistenciaConfigController } from './asistencia-config.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trabajador.name, schema: TrabajadorSchema },
      { name: Asistencia.name, schema: AsistenciaSchema },
      { name: AsistenciaConfig.name, schema: AsistenciaConfigSchema },
    ]),
  ],
  controllers: [AsistenciaController, AsistenciaConfigController],
  providers: [AsistenciaService, AsistenciaRepository],
})
export class AsistenciaModule {}
