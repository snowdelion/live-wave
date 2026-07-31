import { MonitorDetailsClient } from './MonitorDetailsClient'

export async function MonitorDetailsPage({ params }: MonitorDetailPageProps) {
  const { id: monitorId } = await params

  return <MonitorDetailsClient monitorId={monitorId} />
}

interface MonitorDetailPageProps {
  params: Promise<{ id: string }>
}
