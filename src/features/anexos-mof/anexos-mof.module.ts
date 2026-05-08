import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnexoMof, AnexoMofSchema } from './anexos-mof.schema';
import { AnexosMofService } from './anexos-mof.service';
import { AnexosMofController } from './anexos-mof.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: AnexoMof.name, schema: AnexoMofSchema }])],
  providers: [AnexosMofService],
  controllers: [AnexosMofController],
  exports: [AnexosMofService],
})
export class AnexosMofModule {}
