import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AsistenciaService } from './asistencia.service.js';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';
import { CreateAsistenciaConfigDto, UpdateAsistenciaConfigDto } from './dto/asistencia-config.dto.js';

@ApiTags('Asistencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Get('trabajadores')
  getTrabajadores() {
    return this.asistenciaService.getTrabajadores();
  }

  @Get('todas')
  getTodasAsistencias(@Req() req) {
    return this.asistenciaService.getTodasAsistencias(req.user.companyId);
  }

  @Post('registrar')
  registrarAsistencia(@Body() dto: RegistrarAsistenciaDto, @Req() req) {
    return this.asistenciaService.registrarAsistencia(dto, req.user.companyId);
  }

  @Put('trabajadores/:id/horario')
  actualizarHorario(@Param('id') id: string, @Body() dto: UpdateHorarioDto) {
    return this.asistenciaService.actualizarHorarioTrabajador(id, dto);
  }
}
