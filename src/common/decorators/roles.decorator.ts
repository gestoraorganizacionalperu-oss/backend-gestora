import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a usuarios cuyo ProfileId esté en la lista dada.
 * Debe usarse junto con JwtAuthGuard y RolesGuard.
 *
 * Ejemplo: @Roles(1, 2) // Super Administrador, Administrador
 */
export const Roles = (...profileIds: number[]) => SetMetadata(ROLES_KEY, profileIds);