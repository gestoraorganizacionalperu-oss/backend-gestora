import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CargosService } from './cargos.service.js';
import { CreateCargoDto } from './dto/create-cargo.dto.js';
import { UpdateCargoDto } from './dto/update-cargo.dto.js';

@ApiTags('Cargos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo cargo' })
  @ApiResponse({
    status: 201,
    description: 'Cargo creado exitosamente.',
    schema: {
      example: {
        _id: '65f4e0a1a1b2c3d4e5f6a7c9',
        Nombre: 'Gerencia de Operaciones',
        Descripcion: 'Responsable de todas las operaciones de la planta.',
        ParentId: null,
        IsActive: true,
        CompanyId: '6907a5a21f9a5744d381627b',
        CreatedBy: '6907aa501f9a5744d3816284',
        CreatedAt: '2025-03-15T20:00:00.000Z',
        UpdatedAt: '2025-03-15T20:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.', schema: { example: { message: ['name must be a string'], error: 'Bad Request', statusCode: 400 } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  create(@Body() createCargoDto: CreateCargoDto, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.cargosService.create(createCargoDto, companyId, userId);
  }

  @ApiOperation({ summary: 'Obtener todos los cargos de la empresa en formato de árbol' })
  @ApiResponse({
    status: 200,
    description: 'Estructura de cargos obtenida.',
    schema: {
      example: [
        {
          _id: '65f4e0a1a1b2c3d4e5f6a7c9',
          Nombre: 'Gerencia General',
          children: [
            {
              _id: '65f4e0b2a1b2c3d4e5f6a7d0',
              Nombre: 'Gerencia de Operaciones',
              children: [],
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @Get()
  findAll(@Req() req) {
    const companyId = req.user.companyId;
    return this.cargosService.findAll(companyId);
  }

  @ApiOperation({ summary: 'Obtener un cargo por su ID' })
  @ApiParam({ name: 'id', description: 'ID del cargo', type: String, example: '65f4e0a1a1b2c3d4e5f6a7c9' })
  @ApiResponse({
    status: 200,
    description: 'Datos del cargo.',
    schema: {
      example: {
        "_id": "65f4e0a1a1b2c3d4e5f6a7c9",
        "Nombre": "Gerencia de Operaciones",
        "Descripcion": "Responsable de todas las operaciones de la planta.",
        "ParentId": "65f4e0a1a1b2c3d4e5f6a7c8",
        "IsActive": true,
        "CompanyId": "6907a5a21f9a5744d381627b",
        "CreatedBy": "6907aa501f9a5744d3816284",
        "UpdatedBy": "6907aa501f9a5744d3816284",
        "CreatedAt": "2025-03-15T20:00:00.000Z",
        "UpdatedAt": "2025-03-15T21:00:00.000Z"
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.', schema: { example: { message: 'Cargo no encontrado.', error: 'Not Found', statusCode: 404 } } })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const companyId = req.user.companyId;
    return this.cargosService.findOne(id, companyId);
  }

  @ApiOperation({ summary: 'Actualizar un cargo por su ID' })
  @ApiParam({ name: 'id', description: 'ID del cargo a actualizar', type: String, example: '65f4e0a1a1b2c3d4e5f6a7c9' })
  @ApiResponse({
    status: 200,
    description: 'Cargo actualizado.',
    schema: {
      example: {
        "_id": "65f4e0a1a1b2c3d4e5f6a7c9",
        "Nombre": "Gerencia de Operaciones y Logística",
        "Descripcion": "Responsable de todas las operaciones y la cadena de suministro.",
        "ParentId": "65f4e0a1a1b2c3d4e5f6a7c8",
        "IsActive": true,
        "CompanyId": "6907a5a21f9a5744d381627b",
        "CreatedBy": "6907aa501f9a5744d3816284",
        "UpdatedBy": "6907aa501f9a5744d3816284",
        "UpdatedAt": "2025-03-15T22:30:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.', schema: { example: { message: 'Cargo no encontrado para actualizar.', error: 'Not Found', statusCode: 404 } } })
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCargoDto: UpdateCargoDto, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.cargosService.update(id, updateCargoDto, companyId, userId);
  }

  @ApiOperation({ summary: 'Eliminar un cargo por su ID (borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del cargo a eliminar', type: String, example: '65f4e0a1a1b2c3d4e5f6a7c9' })
  @ApiResponse({ status: 200, description: 'Cargo desactivado exitosamente.', schema: { example: { message: 'Cargo con ID #65f4e0a1a1b2c3d4e5f6a7c9 ha sido desactivado (eliminación lógica).' } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado.', schema: { example: { message: 'Cargo no encontrado para eliminar.', error: 'Not Found', statusCode: 404 } } })
  @ApiResponse({
    status: 409,
    description: 'Conflicto, el cargo tiene dependencias activas.',
    schema: {
      example: {
        message: 'No se puede desactivar el cargo, tiene cargos hijos o puestos activos asociados.',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.cargosService.remove(id, companyId, userId);
  }
}