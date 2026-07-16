import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombres del usuario',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Perez',
    description: 'Apellidos del usuario',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: '71234567',
    description: 'Documento Nacional de Identidad',
    required: false,
  })
  @IsString()
  @IsOptional()
  dni?: string;

  @ApiProperty({
    example: 2,
    description: 'ID del perfil del usuario (e.g., 2 para Administrador)',
  })
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @ApiProperty({
    example: true,
    description:
      'Indica si el usuario tendrá credenciales de acceso (email/contraseña)',
  })
  @IsBoolean()
  hasCredentials: boolean;

  @ApiProperty({
    example: 'jperez@miempresa.com',
    description:
      'Correo electrónico para el inicio de sesión (requerido si hasCredentials es true)',
    required: false,
  })
  @ValidateIf((o) => o.hasCredentials)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    example: 'jperez',
    description:
      'Nombre de usuario para el inicio de sesión (requerido si hasCredentials es true)',
    required: false,
  })
  @ValidateIf((o) => o.hasCredentials)
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({
    example: 'micontraseña123',
    description:
      'Contraseña para el inicio de sesión (requerido si hasCredentials es true)',
    minLength: 8,
    required: false,
  })
  @ValidateIf((o) => o.hasCredentials)
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    example: '65e24c782222222222222222',
    description: 'ID del puesto asignado al usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  puestoId?: string;

  @ApiProperty({
    example: true,
    description:
      'Si es true y se envió un DNI, además de crear el Usuario se crea o vincula un registro en la colección `trabajador` (usado para marcar asistencia y asignar producción). Requiere que `dni` esté presente.',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  esTrabajador?: boolean;
}
