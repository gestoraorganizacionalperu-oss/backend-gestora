import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Trabajador, TrabajadorSchema } from '../../common/schemas/trabajador.schema.js';
import { Asistencia, AsistenciaSchema } from '../../common/schemas/asistencia.schema.js';
import { ZktecoWebhookController } from './zkteco-webhook.controller.js';
import { ZktecoWebhookService } from './zkteco-webhook.service.js';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Trabajador.name, schema: TrabajadorSchema },
      { name: Asistencia.name, schema: AsistenciaSchema },
    ]),
  ],
  controllers: [ZktecoWebhookController],
  providers: [ZktecoWebhookService],
})
export class ZktecoWebhookModule {}
