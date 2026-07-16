import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@toolgestora.com',
    description: 'Email o nombre de usuario con el que el usuario inició sesión',
  })
  @IsString()
  @IsNotEmpty({ message: 'El email o usuario no puede estar vacío.' })
  email: string;

  @ApiProperty({ example: '123456789', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  password: string;
}