import { PartialType } from '@nestjs/swagger';
import { CreatePuestoDto } from './create-puesto.dto.js';

export class UpdatePuestoDto extends PartialType(CreatePuestoDto) {}