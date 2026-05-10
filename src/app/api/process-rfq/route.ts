import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint cloud desactivado',
      detail:
        'El piloto actual procesa RFQs con el flujo local/inbound: /api/inbound-email y /api/local/inbox/[id]/process.',
    },
    { status: 410 }
  )
}
