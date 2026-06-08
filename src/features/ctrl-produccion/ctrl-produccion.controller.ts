import { Controller, Get, Put, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CtrlProduccionService } from './ctrl-produccion.service';
import { SaveConfigCtrlProduccionDto } from './dto/config-ctrl-produccion.dto';
import { GuardarRegistroDto } from './dto/registro-produccion.dto';

@ApiTags('Control de Producción')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('config_ctrl_produccion')
export class CtrlProduccionController {
  constructor(private readonly service: CtrlProduccionService) {}

  // ── Configuración ──────────────────────────────────
  @Get()
  getConfig(@Req() req) {
    return this.service.getConfig(req.user.companyId);
  }

  @Put()
  saveConfig(@Req() req, @Body() dto: SaveConfigCtrlProduccionDto) {
    return this.service.saveConfig(req.user.companyId, dto);
  }

  // ── Registros de ejecución ─────────────────────────
  @Get('registros')
  getRegistros(@Req() req, @Query('fecha') fecha: string) {
    return this.service.getRegistrosPorFecha(req.user.companyId, fecha);
  }

  @Get('registros/rango')
  getRegistrosPorRango(@Req() req, @Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.service.getRegistrosPorRango(req.user.companyId, desde, hasta);
  }

  @Post('registros')
  guardarRegistro(@Req() req, @Body() dto: GuardarRegistroDto) {
    return this.service.guardarRegistro(req.user.companyId, dto);
  }
}
