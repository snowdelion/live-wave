import dns from 'dns/promises'

import { Injectable } from '@nestjs/common'
import { RecordType, StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import { BaseCheckStrategy } from './base-check.strategy'
import type { StrategyContext, StrategyResult } from './strategy-result.types'

@Injectable()
export class DnsStrategy extends BaseCheckStrategy {
  constructor(
    protected prisma: PrismaService,
    baseLogger: Logger,
  ) {
    super(prisma, baseLogger, DnsStrategy.name)
  }

  async check(monitor: StrategyContext): Promise<StrategyResult> {
    if (!monitor?.dnsMonitor) {
      this.logger.warn('Monitor or its DnsMonitor not found, skipping check', {
        monitorId: monitor.id,
      })
      return {
        status: StatusEnum.down,
        error: 'Monitor or DnsMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    return await this.performCheck({
      monitorId: monitor.id,
      host: monitor.dnsMonitor.host,
      recordType: monitor.dnsMonitor.recordType,
      timeout: monitor.timeout,
    })
  }

  private async performCheck({ monitorId, host, recordType, timeout }: PerformCheckOptions) {
    const { status, error, responseTime, resolvedValue } = await this.checkDnsConnection({
      host,
      recordType,
      timeout,
    })

    if (status === StatusEnum.down)
      this.logger.warn('DNS monitor is down', { monitorId, host, recordType, error })

    await this.confirmCheckResult(monitorId, {
      error,
      status,
      responseTime,
      details: { host, recordType, resolvedValue },
    })
    return { status, error, responseTime, checkedAt: new Date() }
  }

  private async checkDnsConnection({ host, recordType, timeout }: CheckDnsConnectionOptions) {
    const start = Date.now()
    let status: StatusEnum = StatusEnum.down
    let error: string | null = null
    let responseTime: number | null = null
    let resolvedValue: string | null = null
    let success = false
    let timeoutId: NodeJS.Timeout | null = null

    try {
      const promise = new Promise(
        (_, rej) =>
          (timeoutId = setTimeout(() => rej(new Error(`DNS timeout after ${timeout}ms`)), timeout)),
      )
      const result = await Promise.race([dns.resolve(host, recordType ?? RecordType.A), promise])
      resolvedValue = this.formatDnsRecord(result, recordType)
      success = true
    } catch (e) {
      const rawError = getErrorMessage(e, `DNS query failed (${host})`)
      error = this.normalizeDnsError(rawError, host, timeout)
      this.logger.warn('DNS query failed', { host, recordType, rawError })
    } finally {
      responseTime = Date.now() - start
      if (timeoutId) clearTimeout(timeoutId)
    }

    status = success ? StatusEnum.up : StatusEnum.down
    return { status, error, responseTime, resolvedValue }
  }

  private formatDnsRecord(result: unknown, recordType: RecordType | null): string {
    if (!Array.isArray(result)) return JSON.stringify(result)

    const parts: string[] = []
    for (const item of result) {
      switch (recordType) {
        case 'MX': {
          const mx = item as { exchange: string; priority: number }
          parts.push(`${mx.exchange}:${mx.priority}`)
          break
        }

        case 'TXT': {
          const txt = Array.isArray(item) ? item.join('') : String(item)
          parts.push(txt)
          break
        }

        default:
          parts.push(String(item))
      }
    }
    return parts.join(', ')
  }

  private normalizeDnsError(errorMsg: string, host: string, timeout: number): string {
    if (/ENOTFOUND|DNS.*lookup|getaddrinfo/i.test(errorMsg))
      return `DNS lookup failed for ${host} host`
    if (/timeout/i.test(errorMsg)) return `DNS timeout after ${timeout}ms`
    if (/NXDOMAIN/i.test(errorMsg)) return `Domain ${host} does not exist`
    return `DNS query failed (${host})`
  }
}

interface PerformCheckOptions {
  monitorId: string
  host: string
  timeout: number
  recordType: RecordType | null
}

interface CheckDnsConnectionOptions {
  host: string
  recordType: RecordType | null
  timeout: number
}
