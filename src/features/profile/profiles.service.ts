import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Permission,
  PermissionDocument,
} from '../../common/schemas/permission.schema';

@Injectable()
export class ProfilesService implements OnModuleInit {
  private profileMap: Map<number, string> = new Map();

  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    const permissions = await this.permissionModel.find().select({ IdPerfil: 1, NamePerfil: 1 }).exec();
    permissions.forEach((p) => {
      this.profileMap.set(p.IdPerfil, p.NamePerfil);
    });
  }

  getProfileName(profileId: number): string {
    return this.profileMap.get(profileId) || 'Desconocido';
  }
}