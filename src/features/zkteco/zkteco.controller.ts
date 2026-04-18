import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ZktecoService } from './zkteco.service.js';

/**
 * Controlador para el protocolo ADMS de ZKTeco.
 * Los endpoints /iclock/* son llamados directamente por el dispositivo físico,
 * sin autenticación JWT.
 *
 * El dispositivo envía:
 *  - GET  /iclock/cdata          → Handshake inicial / solicitar configuración
 *  - POST /iclock/cdata          → Envío de registros de asistencia (ATTLOG)
 *  - GET  /iclock/getrequest     → Heartbeat cada ~30 segundos
 *
 * El endpoint de estado está bajo /api/zkteco/status (requiere JWT).
 */
@ApiTags('ZKTeco ADMS')
@Controller()
export class ZktecoController {
  constructor(private readonly zktecoService: ZktecoService) {}

  /**
   * Handshake inicial del dispositivo.
   * El dispositivo llama a este endpoint cuando se conecta para obtener su configuración.
   */
  @ApiOperation({ summary: 'Handshake inicial del dispositivo ZKTeco' })
  @Get('iclock/cdata')
  initDevice(@Query('SN') sn: string, @Res() res: Response): void {
    const config = this.zktecoService.getDeviceConfig(sn ?? 'UNKNOWN');
    res.setHeader('Content-Type', 'text/plain');
    res.send(config);
  }

  /**
   * El dispositivo envía registros de asistencia (tabla ATTLOG).
   * Body puede ser:
   *   - application/x-www-form-urlencoded: campo "data" con líneas tab-separadas
   *   - text/plain: líneas tab-separadas directamente
   */
  @ApiOperation({ summary: 'Recibe registros de asistencia del dispositivo ZKTeco' })
  @Post('iclock/cdata')
  async receiveAttendance(
    @Query('SN') sn: string,
    @Query('table') table: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.zktecoService.updateHeartbeat(sn ?? 'UNKNOWN');

    if (table !== 'ATTLOG') {
      res.setHeader('Content-Type', 'text/plain');
      res.send('OK: 0');
      return;
    }

    // Soporte para body URL-encoded (campo "data") y texto plano
    let rawData: string;
    if (req.body && typeof req.body === 'object' && 'data' in req.body) {
      rawData = String(req.body.data);
    } else if (typeof req.body === 'string') {
      rawData = req.body;
    } else {
      rawData = '';
    }

    const count = await this.zktecoService.processAttendanceLogs(sn ?? 'UNKNOWN', rawData);
    res.setHeader('Content-Type', 'text/plain');
    res.send(`OK: ${count}`);
  }

  /**
   * Heartbeat periódico del dispositivo (~cada 30 segundos).
   */
  @ApiOperation({ summary: 'Heartbeat del dispositivo ZKTeco' })
  @Get('iclock/getrequest')
  heartbeat(@Query('SN') sn: string, @Res() res: Response): void {
    this.zktecoService.updateHeartbeat(sn ?? 'UNKNOWN');
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  }

  /**
   * Endpoint de estado de los dispositivos ZKTeco conectados.
   * Accesible desde el frontend en GET /api/zkteco/status
   * (no tiene guard JWT para facilitar el monitoreo, agregar si se requiere seguridad)
   */
  @ApiOperation({ summary: 'Estado de los dispositivos ZKTeco registrados' })
  @Get('api/zkteco/status')
  getStatus() {
    return { devices: this.zktecoService.getAllDeviceStatus() };
  }
}
