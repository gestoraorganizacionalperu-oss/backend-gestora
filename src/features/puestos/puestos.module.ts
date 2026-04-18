import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Puesto, PuestoSchema } from '../../common/schemas/puesto.schema.js';
import { PuestosRepository } from './puestos.repository.js';
import { PuestosService } from './puestos.service.js';
import { PuestosController } from './puestos.controller.js';
import { Macroproceso, MacroprocesoSchema } from '../../common/schemas/matrizprocesos.schema.js';
import { User, UserSchema } from '../../common/schemas/user.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Puesto.name, schema: PuestoSchema },
    { name: Macroproceso.name, schema: MacroprocesoSchema },
    { name: User.name, schema: UserSchema },
  ])],
  controllers: [PuestosController],
  providers: [PuestosService, PuestosRepository],
  exports: [PuestosService], // Exportamos el servicio para que otros módulos puedan usarlo
})
export class PuestosModule {}