import { format, type Logform } from 'winston'

export const jsonFormat = format.printf((info: Logform.TransformableInfo) => {
  const { level: _, timestamp: __, message, context, stack, trace, ...meta } = info

  const payload: Record<string, unknown> = { message: String(message || '') }

  if (context) payload.context = String(context)
  if (stack) payload.stack = String(stack)
  if (trace) payload.trace = String(trace)

  for (const [key, value] of Object.entries(meta))
    if (typeof key === 'string' && isNaN(Number(key)))
      payload[key] = value instanceof Error ? String(value) : value

  return JSON.stringify(payload)
})

export const simpleFormat = format.printf(({ level, message, context, timestamp, ...meta }) => {
  const time = timestamp
    ? String(timestamp)
        .replace(/\.\d{3}Z$/, '')
        .replace('T', ' ')
    : ''
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `${time} ${level}: ${context ? `[${context}] ` : ''}${message}${metaStr}`
})
