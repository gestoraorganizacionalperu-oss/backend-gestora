import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded, text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Habilitar CORS para todos los orígenes
  app.enableCors();

  // Aumentar el límite del tamaño del cuerpo de la solicitud para soportar Base64 grandes
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  // Parser de texto plano para los endpoints ADMS del dispositivo ZKTeco
  app.use('/iclock', text({ type: '*/*', limit: '1mb' }));

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'iclock/cdata', method: RequestMethod.GET },
      { path: 'iclock/cdata', method: RequestMethod.POST },
      { path: 'iclock/getrequest', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Tool Gestora API')
    .setDescription('Documentación de la API para la aplicación Tool Gestora')
    .setVersion('1.0')
    .addBearerAuth() // Habilita la autorización por Token (JWT) en la UI de Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // La UI estará disponible en /api-docs

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
