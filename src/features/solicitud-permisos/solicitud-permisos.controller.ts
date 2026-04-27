import { Controller, Post, Body, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export interface SolicitudPermiso {
  _id?: string;
  dni: string;
  fechaInicio: string; // string tipo 'DD/MM/YYYY'
  fechaFin: string;    // string tipo 'DD/MM/YYYY'
  correlativo: string;
  imagenBase64: string;
}

@Controller('solicitud-permisos')
export class SolicitudPermisosController {
  constructor(
    @InjectModel('SolicitudPermiso')
    private readonly solicitudPermisoModel: Model<SolicitudPermiso>,
  ) {}

  @Post()
  async create(@Body() data: SolicitudPermiso) {
    // Forzar fechas a string 'DD/MM/YYYY' igual que Control de Asistencia
    const toDMYString = (d: any) => {
      if (!d) return '';
      if (typeof d === 'string' && d.includes('/')) return d;
      // Si es string tipo ISO, convertir a Date
      const date = new Date(d);
      if (isNaN(date.getTime())) throw new Error('Fecha inválida. Usa formato DD/MM/YYYY.');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    try {
      data.fechaInicio = toDMYString(data.fechaInicio);
      data.fechaFin = toDMYString(data.fechaFin);
    } catch (e) {
      throw new Error('Formato de fecha inválido. Usa DD/MM/YYYY.');
    }
    const created = await this.solicitudPermisoModel.create(data);
    return created;
  }

  @Get()
  async findAll() {
    return this.solicitudPermisoModel.find();
  }
}
