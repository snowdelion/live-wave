import { ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'

import { AppModule } from './app.module'
import { Logger } from './shared/logger/logger.service'
import { MetricsInterceptor } from './shared/metrics/interceptors/metrics.interceptor'
import { MetricsFilter } from './shared/metrics/metrics.filter'
import { MetricsService } from './shared/metrics/metrics.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const configService = app.get(ConfigService)

  const config = new DocumentBuilder()
    .setTitle('LiveWave: Uptime monitor API')
    .setDescription('API for uptime monitoring services')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  if (configService.get<'production' | 'test' | 'development'>('NODE_ENV') !== 'production') {
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('/docs', app, document)
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.setGlobalPrefix('api')
  app.useGlobalFilters(new MetricsFilter(app.get(MetricsService)))
  app.useGlobalInterceptors(new MetricsInterceptor(app.get(MetricsService)))
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  const allowedOrigins = [
    'http://127.0.0.1:3000',
    'https://live-wave-monitoring.vercel.app',
    configService.get<string>('FRONTEND_URL'),
  ].filter(Boolean)
  console.log('CORS allowed origins:', allowedOrigins)
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  })
  app.enableShutdownHooks()
  app.use(cookieParser())
  app.useLogger(app.get(Logger))

  await app.listen(configService.get<number>('PORT', 8000))
}
bootstrap().catch(e => {
  console.error(`Failed to start application: ${JSON.stringify(e)}`)
  process.exit(1)
})
