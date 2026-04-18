import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsOptional,
  IsBase64,
} from 'class-validator';
import { Types } from 'mongoose';

class DefinicionDto {
  @IsString()
  @IsNotEmpty()
  readonly termino: string;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;
}

class UsuarioRefDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly usuarioId: Types.ObjectId;
}

class AdjuntoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombreArchivo: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  readonly base64: string;
}

export class CreateDocumentoDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly tipoDocumentoId: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  readonly subProcesoId: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  readonly areaId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  readonly areaCodigo: string;

  @IsBoolean()
  @IsNotEmpty()
  readonly desdeMatrizProceso: boolean;

  @IsString()
  @IsNotEmpty()
  readonly descripcionDocumento: string;

  @IsOptional()
  @IsString()
  readonly objetivo?: string;

  @IsOptional()
  @IsString()
  readonly alcance?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefinicionDto)
  readonly definiciones: DefinicionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjuntoDto)
  readonly adjuntos?: AdjuntoDto[];

  @ValidateNested()
  @Type(() => UsuarioRefDto)
  readonly elaboradoPor: UsuarioRefDto;

  @ValidateNested()
  @Type(() => UsuarioRefDto)
  readonly revisadoPor: UsuarioRefDto;

  @ValidateNested()
  @Type(() => UsuarioRefDto)
  readonly aprobadoPor: UsuarioRefDto;
}