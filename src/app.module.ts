import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './core/database/database.module.js';
import { AuthModule } from './features/auth/auth.module.js';
import { MenusModule } from './features/menus/menus.module.js';
import { CompaniesModule } from './features/companies/companies.module.js';
import { CargosModule } from './features/cargos/cargos.module.js';
import { PuestosModule } from './features/puestos/puestos.module.js';
import { UsersModule } from './features/users/users.module.js';
import { MaestrosModule } from './features/maestros/maestros.module.js';
import { MatrizProcesosModule } from './features/matriz-procesos/matrizprocesos.module.js';
import { AsistenciaModule } from './features/asistencia/asistencia.module.js';
import { ZktecoModule } from './features/zkteco/zkteco.module.js';
import { ZktecoWebhookModule } from './features/zkteco-webhook/zkteco-webhook.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    MenusModule,
    CompaniesModule,
    CargosModule,
    PuestosModule,
    UsersModule,
    MaestrosModule,
    MatrizProcesosModule,
    AsistenciaModule,
    ZktecoModule,
    ZktecoWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
