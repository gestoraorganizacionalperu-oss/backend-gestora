import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtener la lista de usuarios de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente.',
    schema: {
      example: [
        {
          id: '6907aa501f9a5744d3816284',
          name: 'Super',
          lastName: 'Admin',
          email: 'superadmin@toolgestora.com',
          username: 'superadmin',
          dni: null,
          profileId: 1,
          profileName: 'Super Administrador',
          puestoId: '65e24c782222222222222222',
          isActive: true,
          hasCredentials: true,
          companyId: '6907a5a21f9a5744d381627b',
          createdAt: '2025-10-18T21:11:02.840Z',
          createdBy: null,
          updatedAt: null,
          updatedBy: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @Get()
  findAll(@Request() req) {
    const { companyId } = req.user;
    return this.usersService.findAll(companyId);
  }

  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario a obtener', type: String, example: '6907aa501f9a5744d3816284' })
  @ApiResponse({ status: 200, description: 'Datos del usuario.', type: Object, schema: { example: { id: '6907aa501f9a5744d3816284', name: 'Super', lastName: 'Admin', puestoId: '65e24c782222222222222222' /* ...otros campos */ } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.', schema: { example: { message: 'Usuario no encontrado.', error: 'Not Found', statusCode: 404 } } })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const { companyId } = req.user;
    return this.usersService.findOne(id, companyId);
  }

  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    schema: {
      example: {
        id: '65f4d8c6a1b2c3d4e5f6a7b8',
        name: 'Juan',
        lastName: 'Perez',
        profileId: 2,
        puestoId: '65e24c782222222222222222',
        isActive: true,
        companyId: '6907a5a21f9a5744d381627b',
        createdAt: '2025-03-15T20:00:00.000Z',
        createdBy: '6907aa501f9a5744d3816284',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos.',
    schema: {
      example: {
        message: ['password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({ status: 409, description: 'El email o username ya existe.', schema: { example: { message: 'El email ya está registrado.', error: 'Conflict', statusCode: 409 } } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const { companyId, userId } = req.user;
    return this.usersService.create(createUserDto, companyId, userId);
  }

  @ApiOperation({ summary: 'Actualizar un usuario existente' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar', type: String, example: '65f4d8c6a1b2c3d4e5f6a7b8' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente.',
    schema: {
      example: {
        id: '65f4d8c6a1b2c3d4e5f6a7b8',
        name: 'Juan Actualizado',
        profileId: 2,
        puestoId: '65e24c782222222222222222',
        companyId: '6907a5a21f9a5744d381627b',
        updatedAt: '2025-03-15T21:00:00.000Z',
        updatedBy: '6907aa501f9a5744d3816284',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.', schema: { example: { message: 'Usuario no encontrado para la actualización.', error: 'Not Found', statusCode: 404 } } })
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    const { userId, companyId } = req.user;
    return this.usersService.update(id, companyId, updateUserDto, userId);
  }

  @ApiOperation({ summary: 'Desactivar un usuario (borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a desactivar', type: String, example: '65f4d8c6a1b2c3d4e5f6a7b8' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado exitosamente.', schema: { example: { message: 'Usuario desactivado exitosamente.' } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.', schema: { example: { message: 'Usuario no encontrado para desactivar.', error: 'Not Found', statusCode: 404 } } })
  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req) { // Cambiado a Delete para seguir convenciones REST
    const { userId, companyId } = req.user;
    return this.usersService.deactivate(id, companyId, userId);
  }
}