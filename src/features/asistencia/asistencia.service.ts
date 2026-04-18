import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AsistenciaRepository } from './asistencia.repository.js';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';
import { CreateAsistenciaConfigDto, UpdateAsistenciaConfigDto } from './dto/asistencia-config.dto.js';

@Injectable()
export class AsistenciaService {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async getTrabajadores() {
    return this.asistenciaRepository.getTrabajadores();
  }

  async getTodasAsistencias(companyId: string) {
    return this.asistenciaRepository.getTodasAsistencias(companyId);
  }

  async registrarAsistencia(dto: RegistrarAsistenciaDto, companyId: string) {
    const existente = await this.asistenciaRepository.findAsistencia(dto.trabajador_id, dto.fecha);

    if (dto.tipo === 'entrada') {
      if (existente) {
        throw new BadRequestException('Ya se registró la entrada para este trabajador en esta fecha.');
      }
      const data = {
        trabajador_id: dto.trabajador_id,
        nombre: dto.nombre,
        dni: dto.dni,
        fecha: dto.fecha,
        entrada: dto.hora,
        horario_esperado: dto.horario_ingreso || '',
        empresa_id: dto.empresa_id || companyId,
        tardanza: false,
        minutos_tardanza: 0,
      };

      // Calcular tardanza si hay horario de ingreso
      if (dto.horario_ingreso) {
        const [hEsp, mEsp] = dto.horario_ingreso.split(':').map(Number);
        const [hReal, mReal] = dto.hora.split(':').map(Number);
        const minutosEsperados = hEsp * 60 + mEsp;
        const minutosReales = hReal * 60 + mReal;
        const diff = minutosReales - minutosEsperados;
        if (diff > 0) {
          data.tardanza = true;
          data.minutos_tardanza = diff;
        }
      }

      const nueva = await this.asistenciaRepository.createAsistencia(data);
      return { mensaje: 'Entrada registrada exitosamente.', data: nueva };
    }

    if (dto.tipo === 'salida') {
      if (!existente) {
        throw new BadRequestException('No hay entrada registrada para este trabajador en esta fecha.');
      }
      const actualizada = await this.asistenciaRepository.updateAsistencia(
        (existente as any)._id.toString(),
        { salida: dto.hora },
      );
      return { mensaje: 'Salida registrada exitosamente.', data: actualizada };
    }
  }

  async actualizarHorarioTrabajador(id: string, dto: UpdateHorarioDto) {
    const trabajador = await this.asistenciaRepository.updateHorarioTrabajador(id, dto);
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con ID ${id} no encontrado.`);
    }
    return { data: trabajador };
  }

  async getConfigByEmpresa(empresaId: string) {
    const config = await this.asistenciaRepository.getConfigByEmpresa(empresaId);
    if (!config) {
      throw new NotFoundException(`No se encontró configuración para la empresa ${empresaId}.`);
    }
    return { data: config };
  }

  async createConfig(dto: CreateAsistenciaConfigDto) {
    const config = await this.asistenciaRepository.createConfig(dto);
    return { data: config };
  }

  async updateConfig(empresaId: string, dto: UpdateAsistenciaConfigDto) {
    const config = await this.asistenciaRepository.updateConfig(empresaId, dto);
    if (!config) {
      throw new NotFoundException(`No se encontró configuración para la empresa ${empresaId}.`);
    }
    return { data: config };
  }
}
