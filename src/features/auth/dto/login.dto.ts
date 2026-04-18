import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@toolgestora.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'El formato del email no es válido.' })
  email: string;

  @ApiProperty({ example: '123456789', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  password: string;
}