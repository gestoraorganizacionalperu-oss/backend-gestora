import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('Connecting to MongoDB...');
        return {
        uri: configService.get<string>('DATABASE_URL'),
      }},
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}