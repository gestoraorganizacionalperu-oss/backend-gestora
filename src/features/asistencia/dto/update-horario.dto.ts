import { IsString, IsOptional } from 'class-validator';

export class UpdateHorarioDto {
  @IsOptional()
  @IsString()
  horario_ingreso?: string;

  @IsOptional()
  @IsString()
  hora_salida?: string;
}
