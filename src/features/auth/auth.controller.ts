import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Autenticar un usuario y obtener un token' })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa. Devuelve el usuario y el token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @HttpCode(HttpStatus.OK)
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}