import { NestFactory, NestApplication } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule, {
    rawBody: true,
    logger: ['log', 'error', 'warn'],
  });

  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:4201', credentials: true });

  // Log every request so we can diagnose auth/routing issues
  app.use((req: any, res: any, next: any) => {
    const auth = req.headers.authorization ? 'Bearer ***' : 'none';
    console.log(`${req.method} ${req.path} | auth: ${auth} | origin: ${req.headers.origin || '-'}`);
    next();
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`LotDrop API running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
