import { HttpStatus } from '@nestjs/common'

import { MonitorResponseWithChecksDto } from './dto/responses/monitor-response-with-checks.dto'
import { MonitorResponseDto } from './dto/responses/monitor-response.dto'

export const createMonitorDocs = {
  summary: 'Creates a new monitoring service',
  description:
    'Adds a new service to monitor for the current session. The service will be periodically checked according to the specified interval',
  extraResponses: [
    {
      status: HttpStatus.CREATED,
      description: 'Monitoring service has been created successfully',
      type: MonitorResponseDto,
    },
  ],
}

export const findByClientIdDocs = {
  summary: 'Finds all monitoring services by current "clientId"',
  description:
    'Returns a list of all monitoring services belonging to the current session. Services are ordered by creation date (newest first)',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Monitoring service has been created successfully',
      type: [MonitorResponseDto],
    },
  ],
}

export const findMonitorByIdDocs = {
  summary: 'Finds one monitoring serivce by ID',
  description:
    'Retrieves a specific monitoring service by its ID. Also includes the last 10 checks performed. Access is restricted to the session that owns the service',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'List of monitoring services',
      type: MonitorResponseWithChecksDto,
    },
  ],
  extraParam: {
    name: 'id',
    description: 'Monitoring service ID',
    example: 'cmpplwrap0000u1cwddpe8mq8',
  },
}

export const updateMonitorDocs = {
  summary: 'Updates monitoring service',
  description:
    'Partially updates an existing monitoring service (e.g., name, URL, method, check interval, timeout). Only fields provided in the request will be updated',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Monitoring service updated successfully',
      type: MonitorResponseDto,
    },
  ],
  extraParam: {
    name: 'id',
    description: 'Monitoring service ID',
    example: 'cmpplwrap0000u1cwddpe8mq8',
  },
  isUpdate: true,
}

export const deleteMonitorDocs = {
  summary: 'Deletes monitoring service',
  description:
    'Permanently deletes a monitoring service and all its associated checks. This action cannot be undone',
  extraResponses: [
    {
      status: HttpStatus.NO_CONTENT,
      description: 'Monitoring service deleted successfully (no body)',
    },
  ],
  extraParam: {
    name: 'id',
    description: 'Monitoring service ID',
    example: 'cmpplwrap0000u1cwddpe8mq8',
  },
}
