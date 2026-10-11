import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('stores').select('*').limit(1)
    
    if (error) {
      return NextResponse.json({ status: 'error', message: error.message, hint: error.hint }, { status: 500 })
    }
    
    return NextResponse.json({ status: 'ok', data })
  } catch (err: any) {
    return NextResponse.json({ status: 'exception', message: err.message }, { status: 500 })
  }
}
