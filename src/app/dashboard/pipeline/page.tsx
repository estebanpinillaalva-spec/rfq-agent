import { readPipeline } from '@/lib/local-store'
import { PageHeader } from '@/components/ui'
import { PipelineTable } from './pipeline-table'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const pipeline = await readPipeline()
  return (
    <div>
      <PageHeader eyebrow="Ventas" title="Pipeline comercial" />
      <PipelineTable initialHeaders={pipeline.headers} initialRows={pipeline.rows} />
    </div>
  )
}
