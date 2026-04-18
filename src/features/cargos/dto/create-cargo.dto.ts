import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCargoDto {
  @ApiProperty({ example: 'Gerencia de Operaciones' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Responsable de todas las operaciones de la empresa.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID del cargo padre, o null si es un nodo raíz.', required: false, nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string | null;

  @ApiProperty({ example: 2, description: 'Nivel jerárquico del cargo.' })
  @IsNumber()
  @IsNotEmpty()
  level: number;
}