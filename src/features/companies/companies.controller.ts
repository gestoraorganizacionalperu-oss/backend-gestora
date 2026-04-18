import { Controller, Get, Body, Param, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CompaniesService } from './companies.service.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js'; // Asegúrate que esta ruta es correcta
import { ParamIdDto } from './dto/param-id.dto.js';

@ApiTags('Companies') // 1. Agrupa los endpoints bajo la etiqueta "Companies" en Swagger.
@ApiBearerAuth() // 2. Indica que todos los endpoints aquí requieren un token de autenticación.
@UseGuards(JwtAuthGuard) // ¡Protegemos todos los endpoints de este controlador!
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener la información de una empresa por su ID' })
  @ApiParam({ name: 'id', description: 'El ID (ObjectId) de la empresa' })
  @ApiResponse({ status: 200, description: 'Devuelve los datos de la empresa.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido. No tienes permiso para ver esta empresa.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findOne(@Param() params: ParamIdDto, @Req() req) {
    // Lógica de autorización: El ID de la empresa en el token debe coincidir con el ID solicitado.
    const userCompanyId = req.user.companyId;
    if (userCompanyId !== params.id) {
      throw new ForbiddenException('No tienes permiso para acceder a los datos de esta empresa.');
    }
    return this.companiesService.findOne(params.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar la información de una empresa' })
  @ApiParam({ name: 'id', description: 'El ID (ObjectId) de la empresa a actualizar' })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Campos a actualizar de la empresa.',
    examples: {
      a: {
        summary: 'Ejemplo de actualización',
        value: {
          businessName: "Tech Innovations SRL",
          ruc: "20601234567",
          logo: "https://cdn.example.com/logos/newlogo.png",
          isActive: true
        } as UpdateCompanyDto
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Devuelve los datos actualizados de la empresa.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada para actualizar.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido. No tienes permiso para modificar esta empresa.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  update(
    @Param() params: ParamIdDto,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req,
  ) {
    // Lógica de autorización
    const userId = req.user.userId;
    const userCompanyId = req.user.companyId;
    if (userCompanyId !== params.id) {
      throw new ForbiddenException('No tienes permiso para modificar los datos de esta empresa.');
    }
    return this.companiesService.update(params.id, updateCompanyDto, userId);
  }
}