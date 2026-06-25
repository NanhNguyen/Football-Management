import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Danh sách origin mặc định được phép gọi API
  const defaultOrigins = [
    'http://localhost:3000',
    'https://sparta.ricasso.io.vn',
  ];

  // Cho phép mở rộng thêm qua biến môi trường ALLOWED_ORIGINS (phân cách bằng dấu phẩy)
  const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép các tool như Postman / server-to-server (không có origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: origin "${origin}" không được phép`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');
  await app.listen(3001);
  console.log('🏟️  SPARTA Football League API đang chạy tại http://localhost:3001');
  console.log('✅  CORS cho phép các origin:', allowedOrigins.join(', '));
}
bootstrap();
