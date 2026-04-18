import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAsistenciaConfigDto {
  @IsString()
  @IsNotEmpty()
  empresa_id: string;

  @IsString()
  @IsNotEmpty()
  horario_ingreso: string;

  @IsOptional()
  @IsNumber()
  tolerancia_minutos?: number;

  @IsOptional()
  @IsNumber()
  minutos_acumulados_mes?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateAsistenciaConfigDto {
  @IsOptional()
  @IsString()
  horario_ingreso?: string;

  @IsOptional()
  @IsNumber()
  tolerancia_minutos?: number;

  @IsOptional()
  @IsNumber()
  minutos_acumulados_mes?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
