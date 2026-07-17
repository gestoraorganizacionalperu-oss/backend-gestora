import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class DiaValuesDto {
  @IsOptional()
  @IsString()
  hProg?: string;

  @IsOptional()
  @IsString()
  cantPro?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  // Responsable asignado para ese día en particular (reemplaza el
  // responsable único por fila que existía antes).
  @IsOptional()
  @IsString()
  responsableId?: string;
}

export class FilaActividadDto {
  @IsString()
  actividadId: string;

  @IsString()
  actividadNombre: string;

  @IsString()
  procesoNombre: string;

  @IsString()
  subprocesoNombre: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  lunes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  martes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  miercoles?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  jueves?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  viernes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  sabado?: DiaValuesDto;
}

export class FilaProyectoDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  lunes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  martes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  miercoles?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  jueves?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  viernes?: DiaValuesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiaValuesDto)
  sabado?: DiaValuesDto;
}

export class SaveConfigCtrlProduccionDto {
  // Fecha del Lunes de la semana que se está guardando ("YYYY-MM-DD").
  @IsString()
  semanaInicio: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilaActividadDto)
  actividades: FilaActividadDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilaProyectoDto)
  proyectosOtros: FilaProyectoDto[];
}
