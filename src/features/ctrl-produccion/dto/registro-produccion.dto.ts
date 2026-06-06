import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GuardarRegistroDto {
  @IsString() actividadId: string;
  @IsString() actividadNombre: string;
  @IsString() procesoNombre: string;
  @IsString() subprocesoNombre: string;
  @IsString() fecha: string;

  @IsOptional() @IsString() horaInicio?: string;
  @IsOptional() @IsString() horaFin?: string;
  @IsOptional() @IsNumber()  logrados?: number;
  @IsOptional() @IsNumber()  observados?: number;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsString() responsableId?: string;
  @IsOptional() @IsString() estado?: string;
}
