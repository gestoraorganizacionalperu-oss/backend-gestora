import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../common/schemas/user.schema';
import { UserRepository } from './user.repository';
import { ProfilesModule } from '../profile/profiles.module';
import { PuestosModule } from '../puestos/puestos.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProfilesModule,
    PuestosModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService], // Exporta el servicio para que pueda ser usado en otros módulos (ej. Auth)
})
export class UsersModule {}
