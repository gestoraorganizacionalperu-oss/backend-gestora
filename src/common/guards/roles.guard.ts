import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Debe usarse DESPUÉS de JwtAuthGuard (@UseGuards(JwtAuthGuard, RolesGuard)),
 * ya que depende de que req.user ya esté poblado por la estrategia JWT.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedProfileIds = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene @Roles(), no se restringe por rol.
    if (!allowedProfileIds || allowedProfileIds.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.profileId || !allowedProfileIds.includes(user.profileId)) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    return true;
  }
}