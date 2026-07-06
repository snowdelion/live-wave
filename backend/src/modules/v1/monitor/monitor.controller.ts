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
import { AuthGuard } from '@nestjs/passport'
import { ApiExtraModels } from '@nestjs/swagger'

import { UserId } from '@/backend/shared/decorators/user-id.decorator'
import { RateLimitGuard } from '@/backend/shared/rate-limit/guards/rate-limit.guard'

import { MonitorDocs } from './decorators/monitor-docs.decorator'
import { MONITOR_EXTRA_MODELS } from './dto/monitor-extra-models'
import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'
import {
  createMonitorDocs,
  deleteMonitorDocs,
  findByUserIdDocs,
  findMonitorByIdDocs,
  updateMonitorDocs,
} from './monitor.docs'
import { MonitorService } from './monitor.service'

@ApiExtraModels(...MONITOR_EXTRA_MODELS)
@Controller('v1/monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  @MonitorDocs(createMonitorDocs)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard, AuthGuard('jwt'))
  async create(
    @UserId() userId: string,
    @Body()
    dto: CreateMonitorDto,
  ) {
    return await this.monitorService.create(userId, dto)
  }

  @Get(':id')
  @MonitorDocs(findMonitorByIdDocs)
  @UseGuards(AuthGuard('jwt'))
  async findById(@UserId() userId: string, @Param('id') id: string) {
    return await this.monitorService.findById(userId, id)
  }

  @Get()
  @MonitorDocs(findByUserIdDocs)
  @UseGuards(AuthGuard('jwt'))
  async findAllByUserId(@UserId() userId: string) {
    return await this.monitorService.findAllByUserId(userId)
  }

  @Patch(':id')
  @MonitorDocs(updateMonitorDocs)
  @UseGuards(AuthGuard('jwt'))
  async update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateMonitorDto) {
    return await this.monitorService.update(userId, id, dto)
  }

  @Delete(':id')
  @MonitorDocs(deleteMonitorDocs)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async delete(@UserId() userId: string, @Param('id') id: string) {
    await this.monitorService.delete(userId, id)
  }
}
