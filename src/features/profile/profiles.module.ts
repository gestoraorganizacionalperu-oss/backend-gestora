import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesService } from './profiles.service';
import {
  Permission,
  PermissionSchema,
} from '../../common/schemas/permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Permission.name, schema: PermissionSchema }]),
  ],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}