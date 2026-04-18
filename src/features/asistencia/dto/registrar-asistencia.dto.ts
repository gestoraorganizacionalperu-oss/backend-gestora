import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegistrarAsistenciaDto {
  @IsString()
  @IsNotEmpty()
  trabajador_id: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora: string;

  @IsIn(['entrada', 'salida'])
  tipo: 'entrada' | 'salida';

  @IsOptional()
  @IsString()
  empresa_id?: string;

  @IsOptional()
  @IsString()
  horario_ingreso?: string;
}
