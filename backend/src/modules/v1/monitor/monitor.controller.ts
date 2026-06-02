import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiExtraModels } from '@nestjs/swagger'

import { ClientId } from '@/backend/shared/decorators/client-id.decorator'
import { RateLimitGuard } from '@/backend/shared/rate-limit/guards/rate-limit.guard'

import { MonitorDocs } from './decorators/monitor-docs.decorator'
import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'
import { MonitorCheckResponseDto } from './dto/responses/monitor-check-response.dto'
import { MonitorResponseWithChecksDto } from './dto/responses/monitor-response-with-checks.dto'
import { MonitorResponseDto } from './dto/responses/monitor-response.dto'
import {
  createMonitorDocs,
  deleteMonitorDocs,
  findByClientIdDocs,
  findMonitorByIdDocs,
  updateMonitorDocs,
} from './monitor.docs'
import { MonitorService } from './monitor.service'

@ApiExtraModels(MonitorResponseDto, MonitorResponseWithChecksDto, MonitorCheckResponseDto)
@Controller('v1/monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  @MonitorDocs(createMonitorDocs)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async create(@ClientId() clientId: string, @Body() dto: CreateMonitorDto) {
    return await this.monitorService.create(clientId, dto)
  }

  @Get(':id')
  @MonitorDocs(findMonitorByIdDocs)
  async findById(@ClientId() clientId: string, @Param('id') id: string) {
    return await this.monitorService.findById(clientId, id)
  }

  @Get()
  @MonitorDocs(findByClientIdDocs)
  async findAllByClientId(@ClientId() clientId: string) {
    return await this.monitorService.findAllByClientId(clientId)
  }

  @Patch(':id')
  @MonitorDocs(updateMonitorDocs)
  async update(
    @ClientId() clientId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMonitorDto,
  ) {
    return await this.monitorService.update(clientId, id, dto)
  }

  @Delete(':id')
  @MonitorDocs(deleteMonitorDocs)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@ClientId() clientId: string, @Param('id') id: string) {
    await this.monitorService.delete(clientId, id)
  }
}
