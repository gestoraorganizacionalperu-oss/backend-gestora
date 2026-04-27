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

  async login(email: string, pass: string) {
    try {
      const user = await this.authRepository.findUserByCredentials(email, pass);
      if (!user) {
        this.logger.warn(`Credenciales inválidas para: ${email}`);
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
        companyId: user.CompanyId,
      };
      const token = this.jwtService.sign(payload);

      // 3. Mapear la respuesta final
      const { PasswordHash, ...userResponse } = user;
      const finalUserObject = { id: userResponse._id.toString(), ...userResponse };
      delete finalUserObject._id;

      // Función para transformar 'hijos' en 'submenus' recursivamente
      function transformarMenus(menus) {
        return menus?.map(menu => {
          let submenus = menu.hijos ? transformarMenus(menu.hijos) : undefined;
          // Si no hay hijos ni submenus, dejar como array vacío
          if (!submenus) submenus = [];
          const { hijos, ...rest } = menu;
          return { ...rest, submenus };
        }) || [];
      }

      return {
        user: finalUserObject,
        permisos: permissions ? {
          NamePerfil: permissions.NamePerfil,
          DescripcionPerfil: permissions.DescripcionPerfil,
          Menus: transformarMenus(permissions.Menus),
        } : null,
        token: token,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error en login para ${email}: ${errorMessage}`);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Ocurrió un error inesperado durante el login.');
    }
  }
}