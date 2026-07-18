import z from 'zod'

import { DnsRecordType, MonitorType } from '@/entities/monitor'

import { urlRefine } from '../lib/dashboard.utils'

export const monitorFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(MonitorType),
    checkInterval: z.number().min(1).max(60),
    timeout: z.number().min(5000).max(30_000),
    url: z.string().optional(),
    host: z.string().optional(),
    port: z
      .number('Port is required')
      .min(1, 'Port must be between 1-65535')
      .max(65535, 'Port must be between 1-65535')
      .optional(),
    recordType: z.enum(DnsRecordType).optional(),
    method: z.enum(['HEAD']).optional(),
  })
  .superRefine((data, ctx) => {
    const type = data.type
    if (type === MonitorType.HTTP) {
      if (!data.url) ctx.addIssue({ code: 'custom', message: 'URL is required', path: ['url'] })
      else if (!urlRefine(data.url))
        ctx.addIssue({ code: 'custom', message: 'Invalid URL', path: ['url'] })
    }

    if (type !== MonitorType.HTTP && !data.host)
      ctx.addIssue({ code: 'custom', message: 'Host is required', path: ['host'] })

    if (type === MonitorType.TCP && !data.port)
      ctx.addIssue({ code: 'custom', message: 'Port is required', path: ['port'] })
  })

export type MonitorForm = z.infer<typeof monitorFormSchema>
