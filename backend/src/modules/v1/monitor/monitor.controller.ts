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
} from '@nestjs/common'
import { ApiExtraModels } from '@nestjs/swagger'

import { ClientId } from '@/backend/shared/decorators/client-id.decorator'

import { CheckResponseDto } from '../checks/dto/check-response.dto'

import { MonitorDocs } from './decorators/monitor-docs.decorator'
import { CreateMonitorDto } from './dto/create-monitor.dto'
import { MonitorResponseWithChecksDto } from './dto/monitor-response-with-checks.dto'
import { MonitorResponseDto } from './dto/monitor-response.dto'
import { UpdateMonitorDto } from './dto/update-monitor.dto'
import {
  createMonitorDocs,
  deleteMonitorDocs,
  findByClientIdDocs,
  findMonitorByIdDocs,
  updateMonitorDocs,
} from './monitor.docs'
import { MonitorService } from './monitor.service'

@ApiExtraModels(MonitorResponseDto, MonitorResponseWithChecksDto, CheckResponseDto)
@Controller('v1/monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  @MonitorDocs(createMonitorDocs)
  @HttpCode(HttpStatus.CREATED)
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
