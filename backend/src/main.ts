/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { getConnectionOptions } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const configService = app.get(ConfigService);
  app.enableCors();
  // const connectionOptions = await getConnectionOptions();
  // await getConnectionOptions();
  // await app.listen(configService.get('PORT') || 3003);
  await app.listen(3003);
}
bootstrap();
