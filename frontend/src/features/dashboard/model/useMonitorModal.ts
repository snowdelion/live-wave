import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  DnsRecordType,
  MonitorType,
  useCreateMonitor,
  useUpdateMonitor,
  type CreateMonitorRequest,
  type UpdateMonitorRequest,
} from '@/entities/monitor'

import type { MonitorModalProps } from '../ui/modals/MonitorModal'

import { monitorFormSchema, type MonitorForm } from './monitor-form.schema'

export function useMonitorModal({ mode, onClose, initial }: MonitorModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const { mutate: createMonitor, isPending: isCreating } = useCreateMonitor()
  const { mutate: updateMonitor, isPending: isUpdating } = useUpdateMonitor()

  const isCreate = mode === 'create'
  const isPending = isCreating || isUpdating

  const {
    control,
    watch,
    setValues,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<MonitorForm>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      url: initial?.url ?? '',
      host: initial?.host ?? '',
      port: initial?.port ?? undefined,
      recordType: initial?.recordType ?? DnsRecordType.A,
      type: initial?.type ?? MonitorType.HTTP,
      method: initial?.method ?? 'HEAD',
      checkInterval: initial?.checkInterval ?? 10,
      timeout: initial?.timeout ?? 5000,
    },
    reValidateMode: 'onSubmit',
  })

  const type = watch('type')

  const onSubmit = (data: MonitorForm) => {
    setSubmitError(null)
    if (isCreate) {
      const base = {
        name: data.name,
        checkInterval: data.checkInterval,
        timeout: data.timeout,
      }
      let payload: CreateMonitorRequest
      switch (data.type) {
        case MonitorType.HTTP:
          payload = {
            ...base,
            type: data.type,
            url: data.url ?? '',
            method: data.method ?? 'HEAD',
          }
          break
        case MonitorType.TCP:
          payload = {
            ...base,
            type: data.type,
            host: data.host ?? '',
            port: data.port || 0,
          }
          break
        case MonitorType.ICMP:
          payload = {
            ...base,
            type: data.type,
            host: data.host ?? '',
          }
          break
        case MonitorType.DNS:
          payload = {
            ...base,
            type: data.type,
            host: data.host ?? '',
            recordType: data.recordType ?? DnsRecordType.A,
          }
          break
        default:
          return
      }
      createMonitor(payload, {
        onSuccess: onClose,
        onError: ({ message }) => setSubmitError(message || 'Failed to create monitor'),
      })
    } else {
      if (!initial?.id) return
      const payload: Partial<UpdateMonitorRequest> = {
        name: data.name,
        checkInterval: data.checkInterval,
        timeout: data.timeout,
      }
      switch (data.type) {
        case MonitorType.HTTP:
          if (data.url) payload.url = data.url
          if (data.method) payload.method = data.method
          break
        case MonitorType.TCP:
          if (data.host) payload.host = data.host
          if (data.port) payload.port = data.port
          break
        case MonitorType.ICMP:
          if (data.host) payload.host = data.host
          break
        case MonitorType.DNS:
          if (data.host) payload.host = data.host
          if (data.recordType) payload.recordType = data.recordType
          break
      }
      updateMonitor(
        { monitorId: initial.id, body: payload },
        {
          onSuccess: onClose,
          onError: ({ message }) => setSubmitError(message || 'Failed to update monitor'),
        },
      )
    }
  }

  return {
    control,
    cancelButtonRef,
    setValues,
    register,
    handleSubmit,
    errors,
    clearErrors,
    type,
    onSubmit,
    isPending,
    submitError,
  }
}
