import { Controller, Get, UseGuards, Request, Put, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MaestrosService } from './maestros.service';
import { UpdateUbicacionDto } from './dto/update-ubicaciones-areas.dto';

@ApiTags('Maestros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maestros')
export class MaestrosController {
  constructor(private readonly maestrosService: MaestrosService) {}

  @Get('perfiles')
  @ApiOperation({ summary: 'Obtener lista de perfiles (ID y Nombre)' })
  getPerfiles() {
    return this.maestrosService.getPerfiles();
  }

  @Get('tipo-documentos')
  @ApiOperation({ summary: 'Obtener lista de tipos de documento' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de documento obtenida.'})
  getTipoDocumentos() {
    return this.maestrosService.getTipoDocumentos();
  }

  @Get('areas')
  @ApiOperation({ summary: 'Obtener lista de áreas activas' })
  @ApiResponse({ status: 200, description: 'Lista de áreas obtenida.'})
  getAreas(@Request() req) {
    const { companyId } = req.user;
    return this.maestrosService.getAreas(companyId);
  }

  @Get('ubicaciones-y-areas')
  @ApiOperation({
    summary: 'Obtener lista de ubicaciones con sus respectivas áreas',
  })
  getUbicacionesYAreas(@Request() req) {
    const { companyId } = req.user;
    return this.maestrosService.getUbicacionesYAreas(companyId);
  }

    @Put('ubicaciones-y-areas')
    @ApiOperation({ summary: 'Actualizar ubicaciones y áreas' })
    @ApiBody({
      type: [UpdateUbicacionDto],
      examples: {
        ejemploBase: {
          summary: 'Ejemplo de actualización masiva',
          description:
            'Array de ubicaciones y áreas. Si se envía ID, actualiza; si no, crea. Para desactivar, enviar isActive: false (se valida uso en puestos).',
          value: [
            {
              id: '65e24c782222222222222222',
              nombre: 'Planta de Producción (Callao)',
              isActive: true,
              areas: [
                {
                  id: '65e24d89ddddddddeeeeeeee',
                  nombre: 'Operaciones y Logística',
                  Codigo: 'OP',
                  isActive: true
                },
                {
                  nombre: 'Nueva Área de Mantenimiento (Se creará)',
                  Codigo: 'MT'
                },
              ],
            },
            {
              nombre: 'Nueva Sede Norte (Se creará)',
              areas: [
                {
                  nombre: 'Ventas',
                  Codigo: 'VT'
                },
              ],
            },
          ],
        },
      },
    })
    async updateUbicacionesYAreas(
      @Body() payload: any[],
      @Req() req: any,
    ) {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      return this.maestrosService.updateUbicacionesYAreas(companyId, userId, payload);
    }
    
}