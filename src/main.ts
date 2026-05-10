import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('BMQA-App');

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // For development; replace with your frontend URL (e.g., 'http://localhost:4200') for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.setGlobalPrefix('/api/v1');
  // await app.listen(process.env.PORT ?? 3300);
  const config = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BPCL API')
    .setDescription('The BPCL API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get('PORT', 3300);

  await app.listen(port, () => {
    void (async () => {
      const appBaseUrl = await app.getUrl();

      logger.log(
        `Application is running on: ${appBaseUrl} and Swagger UI is on: ${appBaseUrl}/docs`,
      );
    })();
  });
}
void bootstrap();
