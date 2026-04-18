import { IsString, IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  // Podríamos usar IsUrl() si siempre es una URL, pero lo dejamos como string por si es base64
  logo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}