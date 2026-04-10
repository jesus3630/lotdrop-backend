import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:4201', credentials: true });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`LotDrop API running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
