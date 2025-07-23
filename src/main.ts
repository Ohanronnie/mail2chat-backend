import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import whatsappService from "./whatsapp"
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  whatsappService.initializeClient();
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
