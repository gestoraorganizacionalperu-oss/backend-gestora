import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class UpdateCargoDto {
  @ApiProperty({ example: 'Gerencia de Operaciones y Logística', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Responsable de todas las operaciones y la cadena de suministro.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID del cargo padre, o null si es un nodo raíz.', required: false, nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string | null;

  @ApiProperty({ example: 2, description: 'Nivel jerárquico del cargo.', required: false })
  @IsNumber()
  @IsOptional()
  level?: number;
}