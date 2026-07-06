import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('LiveWave: Uptime monitor API')
    .setDescription('API for uptime monitoring services')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('/docs', app, document)

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.setGlobalPrefix('api')

  app.use(helmet())
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
  app.enableShutdownHooks()
  app.use(cookieParser())

  await app.listen(process.env.PORT || 8000)
}
bootstrap().catch(console.error)
