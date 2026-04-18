import { OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { CreateDocumentoDto } from './create-documento.dto';
import { Type } from 'class-transformer';
import { UpdateAdjuntoDto } from './update-adjunto.dto';

// Usamos OmitType para excluir 'adjuntos' de la herencia, evitando el conflicto de tipos.
export class UpdateDocumentoDto extends PartialType(
  OmitType(CreateDocumentoDto, ['adjuntos'] as const),
) {
  @IsString()
  @IsNotEmpty({ message: 'El campo modificación es obligatorio para el control de cambios.' })
  readonly modificacion: string;

  @IsOptional()
  @IsString()
  readonly objetivo?: string;

  @IsOptional()
  @IsString()
  readonly alcance?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAdjuntoDto)
  readonly adjuntos?: UpdateAdjuntoDto[];
}