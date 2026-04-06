import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Security Hardening ---
  app.use(helmet());
  app.enableCors();

  // --- Global Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown props
      forbidNonWhitelisted: true,
      transform: true,       // auto-transform query params to typed primitives
    }),
  );

  // --- API Versioning ---
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  app.setGlobalPrefix('api');

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('Financial Backend API')
    .setDescription(
      'Role-Based Access Control financial records API with dashboard analytics.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- Reliability ---
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
