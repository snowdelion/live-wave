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
import { CreateDnsMonitorDto } from './dto/requests/create-monitor/create-dns-monitor.dto'
import { CreateHttpMonitorDto } from './dto/requests/create-monitor/create-http-monitor.dto'
import { CreateIcmpMonitorDto } from './dto/requests/create-monitor/create-icmp-monitor.dto'
import { CreateTcpMonitorDto } from './dto/requests/create-monitor/create-tcp-monitor.dto'
import { UpdateHttpMonitorDto } from './dto/requests/update-monitor/update-http-monitor.dto'
import { UpdateIcmpMonitorDto } from './dto/requests/update-monitor/update-icmp-monitor.dto'
import { UpdateTcpMonitorDto } from './dto/requests/update-monitor/update-tcp-monitor.dto'
import { HttpMonitorConfig } from './dto/responses/http-monitor-response.dto'
import { IcmpMonitorConfig } from './dto/responses/icmp-monitor-response.dto'
import {
  HttpCheckDetails,
  IcmpCheckDetails,
  MonitorCheckResponseDto,
  TcpCheckDetails,
} from './dto/responses/monitor-check-response.dto'
import { MonitorResponseWithChecksDto } from './dto/responses/monitor-response-with-checks.dto'
import { TcpMonitorConfig } from './dto/responses/tcp-monitor-response.dto'
import {
  createMonitorDocs,
  deleteMonitorDocs,
  findByClientIdDocs,
  findMonitorByIdDocs,
  updateMonitorDocs,
} from './monitor.docs'
import { MonitorService } from './monitor.service'

@ApiExtraModels(
  MonitorResponseWithChecksDto,
  MonitorCheckResponseDto,
  CreateHttpMonitorDto,
  CreateTcpMonitorDto,
  CreateIcmpMonitorDto,
  CreateDnsMonitorDto,
  UpdateHttpMonitorDto,
  UpdateTcpMonitorDto,
  UpdateIcmpMonitorDto,
  HttpCheckDetails,
  TcpCheckDetails,
  IcmpCheckDetails,
  HttpMonitorConfig,
  IcmpMonitorConfig,
  TcpMonitorConfig,
)
@Controller('v1/monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  @MonitorDocs(createMonitorDocs)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async create(
    @ClientId() clientId: string,
    @Body()
    dto: CreateHttpMonitorDto | CreateIcmpMonitorDto | CreateTcpMonitorDto | CreateDnsMonitorDto,
  ) {
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
    @Body() dto: UpdateHttpMonitorDto | UpdateIcmpMonitorDto | UpdateTcpMonitorDto,
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
