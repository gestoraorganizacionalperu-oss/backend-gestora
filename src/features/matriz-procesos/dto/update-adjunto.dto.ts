import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBase64,
} from 'class-validator';

export class UpdateAdjuntoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombreArchivo: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  readonly base64?: string;

  @IsOptional()
  @IsString()
  readonly idGoogle?: string | null;
}