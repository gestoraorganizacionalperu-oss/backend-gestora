import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator';

class PuestoRefDto {
  @IsMongoId()
  id: string;

  // ID del Trabajador (colección `trabajador`, _id numérico simple).
  // Puede venir como número o string según cómo lo mande el frontend.
  @IsOptional()
  trabajadorId?: number | string | null;
}

class DescripcionDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PuestoRefDto)
  puestos: PuestoRefDto[];
}

class ActividadDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescripcionDto)
  descripciones: DescripcionDto[];
}

class SubprocesoDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActividadDto)
  actividades: ActividadDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubprocesoDto)
  subprocesos: SubprocesoDto[];
}

class ProcesoDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubprocesoDto)
  subprocesos: SubprocesoDto[];
}

export class MacroprocesoDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcesoDto)
  procesos: ProcesoDto[];
}
