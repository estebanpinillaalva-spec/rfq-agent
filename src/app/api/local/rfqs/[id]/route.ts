import { NextResponse } from 'next/server'
import { getRfqDetail } from '@/lib/local-store'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const detail = await getRfqDetail(params.id)
  if (!detail) return NextResponse.json({ error: 'RFQ no encontrado' }, { status: 404 })
  return NextResponse.json({ rfq: detail })
}
