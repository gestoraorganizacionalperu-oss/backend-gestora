

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { MatrizProcesosService } from './matrizprocesos.service';
import { MacroprocesoDto } from './dto/matrizprocesos.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';

@ApiTags('Matriz de Procesos')
@ApiBearerAuth()
@Controller('matrizprocesos')
@UseGuards(JwtAuthGuard)
export class MatrizProcesosController {
  constructor(private readonly matrizProcesosService: MatrizProcesosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la matriz de procesos completa de la empresa' })
  getMatriz(@Req() req) {
    // Asumimos que el companyId está en el payload del token
    const companyId = req.user.companyId;
    const userId = req.user.userId;
    return this.matrizProcesosService.getMatriz(companyId, userId);
  }
  
  @Put()
  @ApiOperation({ summary: 'Actualizar la matriz de procesos completa de la empresa' })
  @ApiBody({
    type: [MacroprocesoDto],
    description: 'La estructura completa de la matriz de procesos. Los elementos sin _id se crearán, los que tengan _id se actualizarán. Los macroprocesos que no se envíen serán desactivados.',
    examples: {
      a: {
        summary: 'Ejemplo de Matriz de Procesos',
        value: [
          {
            "_id": "67402f1a8f1b2c001f001001",
            "nombre": "Macroproceso de Operaciones",
            "orden": 10,
            "procesos": [
              {
                "_id": "67402f1a8f1b2c001f001002",
                "nombre": "Proceso de Logística",
                "orden": 5,
                "subprocesos": [
                  {
                    "_id": "67402f1a8f1b2c001f001003",
                    "nombre": "Recepción de Productos (PADRE)",
                    "orden": 2,
                    "actividades": [
                      {
                        "_id": "67402f1a8f1b2c001f001004",
                        "nombre": "Verificar documentos",
                        "orden": 1,
                        "descripciones": [
                          {
                            "_id": "67402f1a8f1b2c001f001005",
                            "texto": "Revisar factura y guía del transportista",
                            "orden": 1,
                            "puestos": [
                              { "id": "67402f1a8f1b2c001f001006" }
                            ]
                          }
                        ]
                      }
                    ],
                    "subprocesos": [
                      {
                        "_id": "67402f1a8f1b2c001f001007",
                        "nombre": "Subproceso de Inspección (HIJO)",
                        "actividades": [],
                        "subprocesos": []
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "nombre": "Nuevo Macroproceso de Calidad",
            "procesos": []
          }
        ]
      }
    }
  })
  async updateMatriz(
    @Req() req,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    matrizDto: MacroprocesoDto[],
  ) {
    const companyId = req.user.companyId;
    const userId = req.user.sub; // o req.user.id, dependiendo de tu payload de JWT
    await this.matrizProcesosService.updateMatriz(
      companyId,
      userId,
      matrizDto,
    );
    return this.matrizProcesosService.getMatriz(companyId, userId);
  }

  @Post('documentos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo documento en la matriz de procesos' })
  @ApiBody({
    type: CreateDocumentoDto,
    description: 'Datos para la creación de un nuevo documento.',
    examples: {
      'registro-procedimiento': {
        summary: 'Ejemplo de registro de un Procedimiento',
        value: {
          tipoDocumentoId: '6573c05c088f170e060c4002',
          subProcesoId: '692b68decc13c2d914990b70',
          areaId: '65e24d89ddddddddeeeeeeee',
          areaCodigo: 'MAR',
          desdeMatrizProceso: true,
          descripcionDocumento: 'Descripción detallada del propósito de este documento.',
          objetivo:
            'Establecer las condiciones que permitan ejecutar la recepción de mercadería de forma organizada, garantizando así que los productos, la cantidad y la calidad sean los esperados, preservando su integridad y cuidado antes del almacenamiento.',
          alcance:
            'Las disposiciones contenidas en presente documento son de cumplimiento obligatorio para todos los colaboradores, cuyas funciones les involucre en el presente documento, en todas y cada una de las áreas y cargos involucrados.',
          definiciones: [
            {
              termino: 'Ventana Horaria (VH)',
              descripcion:
                'Franja de tiempo acordada entre el proveedor y el área de almacén para la recepción de mercadería. Su cumplimiento asegura una adecuada planificación y fluidez en las operaciones logísticas.',
            },
            {
              termino: 'OC (Orden de Compra)',
              descripcion:
                'Documento emitido por el área de compras que autoriza la adquisición de productos o servicios. Contiene información detallada como cantidades, precios, fechas de entrega y condiciones comerciales.',
            },
          ],
          elaboradoPor: {
            usuarioId: '6907aa501f9a5744d3816284',
          },
          revisadoPor: {
            usuarioId: '6907aa741f9a5744d3816286',
          },
          aprobadoPor: {
            usuarioId: '6910c76feb5cb666615ef49f',
          },
          adjuntos: [
            {
              nombreArchivo: 'diagrama-flujo.png',
              base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            },
            {
              nombreArchivo: 'manual-usuario.pdf',
              base64: 'JVBERi0xLjQKJdPr6e/go....',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento registrado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado (Empresa o Tipo de Documento).',
  })
  async registrarDocumento(
    @Body() createDocumentoDto: CreateDocumentoDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    const result = await this.matrizProcesosService.createDocumento(
      createDocumentoDto,
      userId,
      companyId,
    );
    return result;
  }

  @Get('documentos/subproceso/:subProcesoId')
  @ApiOperation({ summary: 'Obtener el detalle de un documento por el ID de su subproceso' })
  @ApiParam({ name: 'subProcesoId', description: 'ID del subproceso asociado al documento', type: String })
  @ApiResponse({ status: 200, description: 'Detalle del documento obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findDocumentoBySubproceso(
    @Param('subProcesoId') subProcesoId: string,
    @Req() req,
  ) {
    const companyId = req.user.companyId;
    console.log("zzzz",companyId)
    return this.matrizProcesosService.findDocumentoBySubProcesoId(
      subProcesoId,
      companyId,
    );
  }

  @Get('documentos/listado')
  @ApiOperation({ summary: 'Listar documentos registrados para la empresa con detalles extendidos' })
  @ApiResponse({ status: 200, description: 'Lista de documentos obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  listadoDocumentosPoliticas(@Req() req) {
    const companyId = req.user.companyId;
    const userId = req.user.userId;
    return this.matrizProcesosService.findAllDocumentosPoliticas(companyId, userId);
  }

  @Put('documentos/:id')
  @ApiOperation({ summary: 'Actualizar un documento existente por su ID' })
  @ApiParam({ name: 'id', description: 'ID del documento a actualizar', type: String })
  @ApiBody({
    type: UpdateDocumentoDto,
    description: 'Datos a actualizar del documento. El campo "modificacion" es obligatorio para el control de cambios.',
    examples: {
      'actualizacion-objetivo': {
        summary: 'Ejemplo de actualización de objetivo',
        value: {
          objetivo: "Nuevo objetivo actualizado para el proceso de recepción.",
          modificacion: "Se ha refinado el objetivo para mayor claridad.",
          adjuntos: [
            {
              "nombreArchivo": "documento-existente.pdf",
              "idGoogle": "f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf"
            },
            {
              "nombreArchivo": "nuevo-diagrama.png",
              "idGoogle": "",
              "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Documento actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  updateDocumento(
    @Param('id') id: string,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.matrizProcesosService.updateDocumento(
      id,
      updateDocumentoDto,
      userId,
      companyId,
    );
  }

  @Get('subprocesos-padres')
  @ApiOperation({ summary: 'Obtener una lista de todos los subprocesos padres de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de subprocesos padres obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findAllParentSubprocesos(@Req() req) {
    const companyId = req.user.companyId;
    return this.matrizProcesosService.findAllParentSubprocesos(companyId);
  }

  @Get('documentos/:id')
  @ApiOperation({ summary: 'Obtener el detalle completo de un documento por su ID' })
  @ApiParam({ name: 'id', description: 'ID del documento', type: String })
  @ApiResponse({ status: 200, description: 'Detalle del documento obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findDocumentoById(
    @Param('id') id: string,
    @Req() req,
  ) {
    const companyId = req.user.companyId;
    return this.matrizProcesosService.findDocumentoById(id, companyId);
  }

  @Put('documentos/:id/visto-bueno-elaborado')
  @ApiOperation({ summary: 'Dar visto bueno como Elaborador (vbElaborado = true)' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Visto bueno registrado.' })
  @ApiResponse({ status: 403, description: 'No tiene permisos.' })
  aprobarElaborado(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.matrizProcesosService.aprobarElaborado(id, userId, companyId);
  }

  @Put('documentos/:id/visto-bueno-revisado')
  @ApiOperation({ summary: 'Dar visto bueno como Revisor (vbRevisado = true)' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Visto bueno registrado.' })
  @ApiResponse({ status: 403, description: 'No tiene permisos.' })
  aprobarRevisado(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.matrizProcesosService.aprobarRevisado(id, userId, companyId);
  }

  @Put('documentos/:id/visto-bueno-aprobado')
  @ApiOperation({ summary: 'Dar visto bueno como Aprobador (vbAprobado = true)' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Visto bueno registrado.' })
  @ApiResponse({ status: 403, description: 'No tiene permisos.' })
  aprobarAprobado(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const companyId = req.user.companyId;
    return this.matrizProcesosService.aprobarAprobado(id, userId, companyId);
  }
}
