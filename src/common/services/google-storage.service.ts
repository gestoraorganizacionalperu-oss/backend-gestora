import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class GoogleStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly logger = new Logger(GoogleStorageService.name);

  constructor(private configService: ConfigService) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    let credentials;
    if (isProduction) {
      // En producción (Render), lee las credenciales desde la variable de entorno
      // que contiene el contenido del JSON (File Secret).
      const keyFilePath = this.configService.get<string>('GCP_KEYFILE_CONTENT');
      if (!keyFilePath) {
        throw new Error('GCP_KEYFILE_CONTENT environment variable is not set for production.');
      }

      credentials = { keyFilename: path.resolve(keyFilePath) };
    } else {
      // En desarrollo, usa la ruta al archivo JSON.
      // En desarrollo, usa la ruta al archivo JSON.
      const keyFilePath = this.configService.get<string>('GCP_KEYFILE_PATH');
      if (!keyFilePath) {
        throw new Error('GCP_KEYFILE_PATH environment variable is not set for local development.');
      }
      credentials = { keyFilename: path.resolve(keyFilePath) };
    }

    this.storage = new Storage(credentials);
    this.bucketName = this.configService.get<string>(
      'GCS_BUCKET_NAME',
      isProduction ? 'sistema-tool' : 'sistema-go',
    );
  } 
 
  async uploadFile(base64: string, gcsFileName: string, companyId: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const filePath = `adjuntos/${companyId}/${gcsFileName}`;
    const file = bucket.file(filePath);

    const buffer = Buffer.from(base64, 'base64');

    try {
      await file.save(buffer);
      this.logger.log(`File uploaded to ${filePath}`);
      return gcsFileName; // Devuelve el nombre del archivo guardado en GCS
    } catch (error) {
      this.logger.error(`Failed to upload ${gcsFileName}`, error.stack);
      throw new InternalServerErrorException('Error al subir el archivo adjunto.');
    }
  }

  async downloadFileAsBase64(gcsFileName: string, companyId: string): Promise<string | null> {
    const bucket = this.storage.bucket(this.bucketName);
    const filePath = `adjuntos/${companyId}/${gcsFileName}`;
    const file = bucket.file(filePath);

    try {
      const [contents] = await file.download();
      this.logger.log(`File ${gcsFileName} downloaded from ${filePath}`);
      return contents.toString('base64');
    } catch (error) {
      if (error.code === 404) {
        this.logger.warn(`File not found in GCS: ${filePath}`);
        return null; // Si el archivo no se encuentra, no detenemos la operación.
      }
      throw new InternalServerErrorException(`Error al descargar el archivo adjunto: ${gcsFileName}`);
    }
  }

  async deleteFile(gcsFileName: string, companyId: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const filePath = `adjuntos/${companyId}/${gcsFileName}`;
    const file = bucket.file(filePath);

    try {
      await file.delete();
      this.logger.log(`File ${gcsFileName} deleted from ${filePath}`);
    } catch (error) {
      if (error.code === 404) {
        this.logger.warn(`File to delete not found in GCS, proceeding with DB update: ${filePath}`);
        return; // Si el archivo ya no existe, no es un error fatal.
      }
      throw new InternalServerErrorException(`Error al eliminar el archivo adjunto: ${gcsFileName}`);
    }
  }
}