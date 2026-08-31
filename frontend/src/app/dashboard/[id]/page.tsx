import type { Metadata } from 'next'

import { MonitorDetailsPage } from '@/pages-flat/monitor-details'

export default MonitorDetailsPage

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Monitor Details',
    alternates: { canonical: `/dashboard/${id}` },
  }
}

interface Props {
  params: Promise<{ id: string }>
}
