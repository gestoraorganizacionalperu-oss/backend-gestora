import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AuthRepository } from './auth.repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../common/schemas/user.schema.js';
import { Permission, PermissionSchema } from '../../common/schemas/permission.schema.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Permission.name, schema: PermissionSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy],
})
export class AuthModule {}
