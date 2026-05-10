import { listRfqs } from '@/lib/local-store'
import { PageHeader } from '@/components/ui'
import { RfqConsole } from './rfq-console'

export const dynamic = 'force-dynamic'

export default async function RfqsPage() {
  const rfqs = await listRfqs()

  return (
    <div>
      <PageHeader eyebrow="Operacion" title="RFQs" />
      <RfqConsole initialRfqs={rfqs} />
    </div>
  )
}
