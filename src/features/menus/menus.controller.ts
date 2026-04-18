import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { MenusService } from './menus.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @ApiBearerAuth() // Indica que este endpoint requiere un token Bearer.
  @UseGuards(JwtAuthGuard) // ¡Este guardián protege la ruta!
  @Get('my-menus')
  @ApiOperation({ summary: 'Obtener los menús del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Devuelve el array de menús para el perfil del usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado (token no provisto o inválido).' })
  getMyMenus(@Req() req) {
    return this.menusService.getMyMenus(req.user.profile);
  }
}