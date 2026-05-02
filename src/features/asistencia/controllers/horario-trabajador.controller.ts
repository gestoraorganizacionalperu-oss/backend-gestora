import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { HorarioTrabajadorService } from '../services/horario-trabajador.service';
import { HorarioTrabajador } from '../schemas/horario-trabajador.schema';

@Controller('asistencia/horario-trabajador')
export class HorarioTrabajadorController {
  constructor(private readonly horarioTrabajadorService: HorarioTrabajadorService) {}

  @Post('set')
  async setHorario(@Body() data: Partial<HorarioTrabajador>) {
    return this.horarioTrabajadorService.createOrUpdateHorario(data);
  }

  @Get(':trabajadorId')
  async getHorario(@Param('trabajadorId') trabajadorId: string) {
    return this.horarioTrabajadorService.getHorarioByTrabajador(trabajadorId);
  }

  @Get()
  async getAllHorarios() {
    return this.horarioTrabajadorService.getAllHorarios();
  }
}
