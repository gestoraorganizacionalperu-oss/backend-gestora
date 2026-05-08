
import { Controller, Post, Get, Delete, Param, Body, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnexosMofService } from './anexos-mof.service';

@Controller('anexos-mof')
export class AnexosMofController {
  constructor(private readonly anexosService: AnexosMofService) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async uploadAnexo(
    @Body() body: any,
    @UploadedFile() archivo: any // <-- usa any aquí
  ) {
    // body: { documentoId, nombreArchivo, usuario }
    return this.anexosService.create({
      ...body,
      archivo: archivo.buffer,
      tipo: archivo.mimetype,
    });
  }

  @Get(':documentoId')
  async getAnexos(@Param('documentoId') documentoId: string) {
    // No enviamos el archivo binario en el listado
    const anexos = await this.anexosService.findByDocumento(documentoId);
    return anexos.map(a => ({
      _id: a._id,
      documentoId: a.documentoId,
      nombreArchivo: a.nombreArchivo,
      tipo: a.tipo,
      usuario: a.usuario,
      createdAt: (a as any).createdAt, // <-- cast para evitar error de tipado
    }));
  }

  @Get('descargar/:id')
  async descargar(@Param('id') id: string, @Res() res) {
    const anexo = await this.anexosService.findById(id);
    if (!anexo) {
      return res.status(404).send('No encontrado');
    }
    res.set({
      'Content-Type': anexo.tipo,
      'Content-Disposition': `attachment; filename="${anexo.nombreArchivo}"`,
    });
    res.send(anexo.archivo);
  }

  @Delete(':id')
  async deleteAnexo(@Param('id') id: string) {
    return this.anexosService.delete(id);
  }
}
