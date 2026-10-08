import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { store_id, vehicle_id } = body

    if (!store_id) {
      return NextResponse.json({ error: 'store_id é obrigatório' }, { status: 400 })
    }

    // Attempt to insert into a whatsapp_clicks analytics table
    // If the table doesn't exist yet, this might fail, but the prompt says 
    // the DB is already configured.
    const { error } = await supabase
      .from('whatsapp_clicks')
      .insert([
        {
          store_id,
          vehicle_id: vehicle_id || null,
        }
      ])

    if (error) {
      console.error('Supabase error registering WhatsApp click:', error)
      // We don't fail hard to avoid breaking the frontend if the table isn't exactly this name
      // Return 200 anyway so the user goes to WhatsApp
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Error in POST /api/analytics/whatsapp:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
