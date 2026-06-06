import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigCtrlProduccion, ConfigCtrlProduccionSchema } from './schemas/config-ctrl-produccion.schema';
import { RegistroProduccion, RegistroProduccionSchema } from './schemas/registro-produccion.schema';
import { CtrlProduccionService } from './ctrl-produccion.service';
import { CtrlProduccionController } from './ctrl-produccion.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConfigCtrlProduccion.name, schema: ConfigCtrlProduccionSchema },
      { name: RegistroProduccion.name,   schema: RegistroProduccionSchema },
    ]),
  ],
  controllers: [CtrlProduccionController],
  providers: [CtrlProduccionService],
})
export class CtrlProduccionModule {}
