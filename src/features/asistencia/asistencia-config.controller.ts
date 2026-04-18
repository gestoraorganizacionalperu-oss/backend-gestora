import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AsistenciaService } from './asistencia.service.js';
import { CreateAsistenciaConfigDto, UpdateAsistenciaConfigDto } from './dto/asistencia-config.dto.js';

@ApiTags('Asistencia Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asistencia-config')
export class AsistenciaConfigController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Get(':empresaId')
  getConfig(@Param('empresaId') empresaId: string) {
    return this.asistenciaService.getConfigByEmpresa(empresaId);
  }

  @Post()
  createConfig(@Body() dto: CreateAsistenciaConfigDto) {
    return this.asistenciaService.createConfig(dto);
  }

  @Put(':empresaId')
  updateConfig(@Param('empresaId') empresaId: string, @Body() dto: UpdateAsistenciaConfigDto) {
    return this.asistenciaService.updateConfig(empresaId, dto);
  }
}
