import { HttpStatus } from '@nestjs/common'

export const deleteDocs = {
  summary: 'Completely deletes account',
  description: 'Permanently deletes the user account and all associated data',
  extraResponses: [{ status: HttpStatus.NO_CONTENT }],
  isProtected: true,
}
