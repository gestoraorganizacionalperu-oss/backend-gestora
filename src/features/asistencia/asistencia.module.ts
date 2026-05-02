import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trabajador, TrabajadorSchema } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaSchema } from '../../common/schemas/asistencia.schema.js';
import { AsistenciaConfig, AsistenciaConfigSchema } from '../../common/schemas/asistencia-config.schema.js';
import { AsistenciaRepository } from './asistencia.repository.js';
import { AsistenciaService } from './asistencia.service.js';
import { AsistenciaController } from './asistencia.controller.js';
import { AsistenciaConfigController } from './asistencia-config.controller.js';
import { HorarioTrabajador, HorarioTrabajadorSchema } from './schemas/horario-trabajador.schema';
import { HorarioTrabajadorService } from './services/horario-trabajador.service';
import { HorarioTrabajadorController } from './controllers/horario-trabajador.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trabajador.name, schema: TrabajadorSchema },
      { name: Asistencia.name, schema: AsistenciaSchema },
      { name: AsistenciaConfig.name, schema: AsistenciaConfigSchema },
      { name: HorarioTrabajador.name, schema: HorarioTrabajadorSchema },
    ]),
  ],
  controllers: [AsistenciaController, AsistenciaConfigController, HorarioTrabajadorController],
  providers: [AsistenciaService, AsistenciaRepository, HorarioTrabajadorService],
})
export class AsistenciaModule {}
