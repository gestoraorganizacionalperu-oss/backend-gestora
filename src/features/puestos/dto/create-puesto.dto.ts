import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId, IsNumber } from 'class-validator';

export class CreatePuestoDto {
  @ApiProperty({ example: 'Analista de Marketing Digital' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Responsable de campañas en redes sociales y SEO.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '65e24c781111111111111111', description: 'ObjectId de la Ubicación' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  locationId: string;

  @ApiProperty({ example: '65e24d89aaaaaaaabbbbbbbb', description: 'ObjectId del Área' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  areaId: string;

  @ApiProperty({ example: '6907d7b9d36b456ea8529062', description: 'ObjectId del Cargo al que pertenece' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  cargoId: string;

  @ApiProperty({ type: [String], example: ['Certificación en Google Ads', 'Conocimiento de SEMrush'] })
  @IsArray()
  @IsOptional()
  technicalRequirements?: string[];

  @ApiProperty({ type: [String], example: ['6907aa501f9a5744d3816284', '6907ab501f9a5744d3816285'], description: 'Array de ObjectIds de los usuarios responsables.' })
  @IsArray()
  @IsMongoId({ each: true }) // Valida que cada elemento del array sea un ObjectId
  @IsOptional()
  responsibleIds?: string[];

  @ApiProperty({ example: '6907f19dfdd7fe49aee4c80b', description: 'ID del puesto padre (opcional)', required: false })
  @IsOptional()
  @IsMongoId()
  puestoParentId?: string;
}