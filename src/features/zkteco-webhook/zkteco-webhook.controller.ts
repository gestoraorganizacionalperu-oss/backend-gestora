import { Controller, Get, Post, Query, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ZktecoWebhookService } from './zkteco-webhook.service.js';

/**
 * Webhook para recibir eventos de ZKBio Zlink Open Platform.
 * URL base: /api/zkteco-webhook
 *
 * Flujo:
 * 1. ZKBio Zlink envía GET con ?echostr=XXX para verificar la URL → respondemos con el valor
 * 2. ZKBio Zlink envía POST con eventos de asistencia → procesamos y guardamos en MongoDB
 */
@ApiTags('ZKBio Zlink Webhook')
@Controller('zkteco-webhook')
export class ZktecoWebhookController {
  private readonly logger = new Logger(ZktecoWebhookController.name);

  constructor(private readonly webhookService: ZktecoWebhookService) {}

  /**
   * Verificación de URL — ZKBio Zlink envía GET con &echostr= o &challenge=
   * para confirmar que la URL es válida antes de activar el webhook.
   */
  @ApiOperation({ summary: 'Verificación de URL para ZKBio Zlink' })
  @Get()
  verifyUrl(
    @Query('echostr') echostr: string,
    @Query('challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const token = echostr ?? challenge ?? '';
    this.logger.log(`Verificación de URL ZKBio Zlink: echostr/challenge="${token}"`);

    if (!token) {
      res.status(200).send('OK');
      return;
    }

    const response = this.webhookService.buildChallengeResponse(token);
    res.status(200).send(response);
  }

  /**
   * Recepción de eventos de asistencia desde ZKBio Zlink.
   * ZKBio Zlink envía POST con JSON cuando ocurre un evento (marca de asistencia).
   */
  @ApiOperation({ summary: 'Recibe eventos de asistencia de ZKBio Zlink' })
  @Post()
  async receiveEvent(@Req() req: Request, @Res() res: Response): Promise<void> {
    const signature = req.headers['x-zkteco-signature'] as string | undefined
      ?? req.headers['x-hub-signature-256'] as string | undefined;

    const rawBody = JSON.stringify(req.body);

    if (signature && !this.webhookService.verifySignature(rawBody, signature)) {
      this.logger.warn('Firma inválida en webhook ZKBio Zlink — solicitud rechazada');
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    try {
      const result = await this.webhookService.processEvent(req.body);
      this.logger.log(`Evento procesado: ${result.processed} registros`);
      res.status(200).json({ success: true, processed: result.processed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error procesando evento Zlink: ${msg}`);
      res.status(500).json({ success: false, message: msg });
    }
  }
}
