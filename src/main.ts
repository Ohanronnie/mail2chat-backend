import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import whatsappService from "./whatsapp"
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  whatsappService.initializeClient();
  console.log("hello lol", Bun)
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
