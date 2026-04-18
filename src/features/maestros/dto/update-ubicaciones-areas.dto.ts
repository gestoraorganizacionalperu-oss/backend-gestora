import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  id?: string; // Si viene ID, actualizamos. Si no, creamos.

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  Codigo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUbicacionDto {
  @IsOptional()
  @IsString()
  id?: string; // Si viene ID, actualizamos. Si no, creamos.

  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAreaDto)
  areas: UpdateAreaDto[];
}