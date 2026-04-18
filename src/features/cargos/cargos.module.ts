import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cargo, CargoSchema } from '../../common/schemas/cargo.schema.js';
import { CargosController } from './cargos.controller.js';
import { CargosRepository } from './cargos.repository.js';
import { CargosService } from './cargos.service.js';
import { PuestosModule } from '../puestos/puestos.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cargo.name, schema: CargoSchema }]),
    PuestosModule,
  ],
  controllers: [CargosController],
  providers: [CargosService, CargosRepository],
})
export class CargosModule {}