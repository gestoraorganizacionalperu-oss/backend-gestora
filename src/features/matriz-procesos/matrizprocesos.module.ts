import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatrizProcesosController } from './matrizprocesos.controller';
import { MatrizProcesosService } from './matrizprocesos.service';
import {
  Macroproceso,
  MacroprocesoSchema,
} from '../../common/schemas/matrizprocesos.schema.js';
import { MatrizProcesosRepository } from './matrizprocesos.repository.js';
import { Documento, DocumentoSchema } from '../../common/schemas/documento.schema.js';
import { Company, CompanySchema } from '../../common/schemas/company.schema.js';
import {
  TipoDocumento,
  TipoDocumentoSchema,
} from '../../common/schemas/tipo-documento.schema.js';
import { User, UserSchema } from '../../common/schemas/user.schema.js';
import { GoogleStorageService } from '../../common/services/google-storage.service.js';
import { ConfigModule } from '@nestjs/config';
import { Puesto, PuestoSchema } from '../../common/schemas/puesto.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Macroproceso.name, schema: MacroprocesoSchema },
      { name: Documento.name, schema: DocumentoSchema },
      { name: Company.name, schema: CompanySchema },
      { name: TipoDocumento.name, schema: TipoDocumentoSchema },
      { name: User.name, schema: UserSchema },
      { name: Puesto.name, schema: PuestoSchema },
    ]),
    ConfigModule, // Importamos ConfigModule para usar ConfigService
  ],
  controllers: [MatrizProcesosController],
  providers: [MatrizProcesosService, MatrizProcesosRepository, GoogleStorageService],
})
export class MatrizProcesosModule {}
