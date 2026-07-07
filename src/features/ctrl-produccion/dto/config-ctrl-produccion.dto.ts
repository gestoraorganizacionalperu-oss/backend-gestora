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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilaActividadDto)
  actividades: FilaActividadDto[];

  @ValidateNested()
  @Type(() => FilaProyectoDto)
  proyectoOtro: FilaProyectoDto;
}
