import { IsMongoId, IsOptional } from 'class-validator';

export class UpdatePuestoDto {
  // ID real del Puesto (colección `puestos`, la misma que usa Matriz de
  // Procesos). Opcional para poder "desasignar" mandando null/undefined.
  @IsOptional()
  @IsMongoId()
  puesto?: string;
}
