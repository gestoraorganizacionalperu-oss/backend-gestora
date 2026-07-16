import { Injectable, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from './auth.repository.js';
import { Permission, PermissionDocument } from '../../common/schemas/permission.schema.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async login(identificador: string, pass: string) {
    try {
      const user = await this.authRepository.findUserByCredentials(identificador, pass);
      if (!user) {
        this.logger.warn(`Credenciales inválidas para: ${identificador}`);
        throw new UnauthorizedException('Credenciales inválidas.');
      }

      // 1. Obtener los permisos basados en el ProfileId del usuario
      const permissionsDoc = await this.permissionModel.findOne({ IdPerfil: user.ProfileId }).exec();
      const permissions = permissionsDoc ? permissionsDoc.toObject() : null;

      // 2. Crear el payload del token
      const payload = {
        name: user.Name,
        userId: user._id.toString(), // ID del usuario como string
        profile: permissions?.NamePerfil || 'Sin Perfil Asignado', // Usar el nombre del perfil de los permisos
        profileId: user.ProfileId, // ID numérico del perfil, usado por RolesGuard para restringir endpoints
        companyId: user.CompanyId,
      };
      const token = this.jwtService.sign(payload);

      // 3. Mapear la respuesta final
      const { PasswordHash, ...userResponse } = user;
      const finalUserObject = { id: userResponse._id.toString(), ...userResponse };
      delete finalUserObject._id;

      return {
        user: finalUserObject,
        permisos: permissions ? {
          NamePerfil: permissions.NamePerfil,
          DescripcionPerfil: permissions.DescripcionPerfil,
          Menus: permissions.Menus,
        } : null,
        token: token,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error en login para ${identificador}: ${errorMessage}`);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Ocurrió un error inesperado durante el login.');
    }
  }
}