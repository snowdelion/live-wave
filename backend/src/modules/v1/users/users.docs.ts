import { HttpStatus } from '@nestjs/common'

import { GetMeResponseDto } from './dto/get-me-response.dto'

export const deleteDocs = {
  summary: 'Completely deletes account',
  description: 'Permanently deletes the user account and all associated data',
  extraResponses: [
    { status: HttpStatus.NO_CONTENT },
    {
      example: {
        message: 'Access denied',
        error: 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
      },
      status: HttpStatus.FORBIDDEN,
    },
  ],
}

export const getMeDocs = {
  summary: 'Gets current user base info',
  description: 'Returns base info, count of monitors, settings (enabled/disabled notifications)',
  extraResponses: [{ status: HttpStatus.OK, type: GetMeResponseDto }],
  isProtected: true,
}
