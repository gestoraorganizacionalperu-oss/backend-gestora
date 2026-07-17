import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PuestosService } from './puestos.service.js';
import { CreatePuestoDto } from './dto/create-puesto.dto.js';
import { UpdatePuestoDto } from './dto/update-puesto.dto.js';

@ApiTags('Puestos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('puestos') // <-- Nueva ruta base
export class PuestosController {
  constructor(private readonly puestosService: PuestosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo puesto' })
  @ApiBody({
    description: 'Datos para crear un nuevo puesto',
    schema: {
      example: {
        name: "Jefe de Planta",
        description: "Supervisa las operaciones diarias de la planta de producción.",
        areaId: "65e24d89ddddddddeeeeeeee",
        locationId: "65e24c782222222222222222",
        cargoId: "65f3a9b8d4b3b4b3b4b3b4b3",
        puestoParentId: "6907f19dfdd7fe49aee4c80b",
        technicalRequirements: ["Conocimiento en ISO 9001", "Experiencia en gestión de equipos"]
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Puesto creado exitosamente.',
    schema: {
      example: {
        "Nombre": "Jefe de Planta",
        "Descripcion": "Supervisa las operaciones diarias de la planta de producción.",
        "CargoId": "65f3a9b8d4b3b4b3b4b3b4b3",
        "CompanyId": "6907a5a21f9a5744d381627b",
        "IsActive": true,
        "CreatedBy": "6907aa501f9a5744d3816284",
        "AreaId": "65e24d89ddddddddeeeeeeee",
        "UbicacionId": "65e24c782222222222222222",
        "puestoParentId": "6907f19dfdd7fe49aee4c80b",
        "_id": "65f5f5a1b2c3d4e5f6a7b1c2",
        "CreatedAt": "2025-03-16T10:00:00.000Z",
        "UpdatedAt": "2025-03-16T10:00:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.', schema: { example: { message: ['name must be a string'], error: 'Bad Request', statusCode: 400 } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  create(@Body() createPuestoDto: CreatePuestoDto, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.puestosService.create(companyId, userId, createPuestoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los puestos activos de la empresa' })
  @ApiQuery({ name: 'cargoId', description: 'ID del cargo para filtrar los puestos (opcional)', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de puestos obtenida.',
    schema: {
      example: [
        {
          "_id": "65f5f5a1b2c3d4e5f6a7b1c2",
          "Nombre": "Jefe de Planta",
          "Descripcion": "Supervisa las operaciones diarias de la planta de producción.",
          "CompanyId": "6907a5a21f9a5744d381627b",
          "IsActive": true,
          "AreaId": "65e24d89ddddddddeeeeeeee",
          "UbicacionId": "65e24c782222222222222222",
          "puestoParentId": null,
          "CargoId": "65f3a9b8d4b3b4b3b4b3b4b3",
          "CreatedBy": "6907aa501f9a5744d3816284",
          "CreatedAt": "2025-03-16T10:00:00.000Z",
          "UpdatedAt": "2025-03-16T10:00:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  findAll(@Req() req, @Query('cargoId') cargoId?: string) { // Corregido el nombre del parámetro
    const companyId = req.user.companyId;
    return this.puestosService.findAll(companyId, cargoId);
  }

  @Get('listado-mof')
  @ApiOperation({ summary: 'Listar puestos activos para MOF con nombre de cargo' })
  @ApiResponse({ status: 200, description: 'Lista de puestos para MOF obtenida.' })
  listadoMof(@Req() req) {
    const companyId = req.user.companyId;
    const userId = req.user.userId;
    return this.puestosService.findAllMof(companyId, userId);
  }

  @Get('detalle-mof/:id')
  @ApiOperation({ summary: 'Obtener detalle completo de un puesto para MOF (incluye actividades)' })
  @ApiParam({ name: 'id', description: 'ID del puesto', type: String })
  @ApiResponse({ status: 200, description: 'Detalle del puesto obtenido.' })
  getPuestoMofDetail(@Param('id') id: string, @Req() req) {
    const companyId = req.user.companyId;
    return this.puestosService.findPuestoMofDetail(id, companyId);
  }

  @Post('mof-masivo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle masivo de puestos para MOF (incluye actividades y área)' })
  @ApiBody({ type: [String], description: 'Array de IDs de puestos', examples: { a: { value: ["65f5f5a1b2c3d4e5f6a7b1c2", "6907f19dfdd7fe49aee4c80b"] } } })
  @ApiResponse({ status: 200, description: 'Detalles de puestos obtenidos.' })
  getMofMasivo(@Body() puestoIds: string[], @Req() req) {
    const companyId = req.user.companyId;
    return this.puestosService.findMofMasivo(puestoIds, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un puesto por su ID' })
  @ApiParam({ name: 'id', description: 'ID del puesto a obtener', type: String, example: '65f5f5a1b2c3d4e5f6a7b1c2' })
  @ApiQuery({
    name: 'incluirInactivo',
    description: 'Si es "true", devuelve el puesto aunque esté desactivado (uso interno: mostrar asignaciones históricas de la Matriz de Procesos que apuntan a un puesto ya inactivo)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del puesto.',
    schema: {
      example: {
        "_id": "65f5f5a1b2c3d4e5f6a7b1c2",
        "Nombre": "Jefe de Planta",
        "Descripcion": "Supervisa las operaciones diarias de la planta de producción.",
        "CompanyId": "6907a5a21f9a5744d381627b",
        "IsActive": true,
        "AreaId": "65e24d89ddddddddeeeeeeee",
        "UbicacionId": "65e24c782222222222222222",
        "puestoParentId": "6907f19dfdd7fe49aee4c80b",
        "CargoId": "65f3a9b8d4b3b4b3b4b3b4b3",
        "CreatedBy": "6907aa501f9a5744d3816284",
        "CreatedAt": "2025-03-16T10:00:00.000Z",
        "UpdatedAt": "2025-03-16T10:00:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado.', schema: { example: { message: 'Puesto con ID #... no encontrado.', error: 'Not Found', statusCode: 404 } } })
  findOne(@Param('id') id: string, @Req() req, @Query('incluirInactivo') incluirInactivo?: string) {
    const companyId = req.user.companyId;
    return this.puestosService.findOne(id, companyId, incluirInactivo === 'true');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un puesto por su ID' })
  @ApiParam({ name: 'id', description: 'ID del puesto a actualizar', type: String, example: '65f5f5a1b2c3d4e5f6a7b1c2' })
  @ApiBody({
    description: 'Datos para actualizar el puesto',
    schema: {
      example: {
        name: "Jefe de Planta (Actualizado)",
        description: "Descripción actualizada.",
        areaId: "65e24d89ccccccccdddddddd",
        locationId: "65e24c781111111111111111",
        cargoId: "65f3a9b8d4b3b4b3b4b3b4b3",
        puestoParentId: "6907f19dfdd7fe49aee4c80b",
        technicalRequirements: ["Requisito 1", "Requisito 2"]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Puesto actualizado exitosamente.',
    schema: {
      example: {
        "_id": "65f5f5a1b2c3d4e5f6a7b1c2",
        "Nombre": "Jefe de Planta (Actualizado)",
        "Descripcion": "Descripción actualizada.",
        "CompanyId": "6907a5a21f9a5744d381627b",
        "IsActive": true,
        "AreaId": "65e24d89ccccccccdddddddd",
        "UbicacionId": "65e24c781111111111111111",
        "CargoId": "65f3a9b8d4b3b4b3b4b3b4b3",
        "puestoParentId": "6907f19dfdd7fe49aee4c80b",
        "UpdatedBy": "6907aa501f9a5744d3816284",
        "UpdatedAt": "2025-03-16T11:00:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado.', schema: { example: { message: 'Puesto con ID #... no encontrado para actualizar.', error: 'Not Found', statusCode: 404 } } })
  update(@Param('id') id: string, @Body() updatePuestoDto: UpdatePuestoDto, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.puestosService.update(id, companyId, userId, updatePuestoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un puesto por su ID (borrado lógico)' })
  @ApiParam({ name: 'id', description: 'ID del puesto a eliminar', type: String, example: '65f5f5a1b2c3d4e5f6a7b1c2' })
  @ApiResponse({ status: 200, description: 'Puesto desactivado exitosamente.', schema: { example: { message: 'Puesto con ID #65f5f5a1b2c3d4e5f6a7b1c2 ha sido desactivado.' } } })
  @ApiResponse({ status: 401, description: 'No autorizado.', schema: { example: { message: 'Unauthorized', statusCode: 401 } } })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado.', schema: { example: { message: 'Puesto con ID #... no encontrado para eliminar.', error: 'Not Found', statusCode: 404 } } })
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.puestosService.remove(id, companyId, userId);
  }
}