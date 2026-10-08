import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    
    const { 
      store_id, title, brand, model, year, mileage, price, fuel, transmission, 
      color, plate_end, features, badge, description, images, is_active 
    } = body

    if (!store_id || !title || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
          store_id,
          title,
          brand,
          model,
          year: parseInt(year),
          mileage: parseInt(mileage || 0),
          price: parseFloat(price || 0),
          fuel,
          transmission,
          color,
          plate_end,
          features,
          badge,
          description,
          images: images || [],
          is_active: is_active ?? true,
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error inserting vehicle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const store_id = searchParams.get('store_id')

    if (!store_id) {
      return NextResponse.json({ error: 'store_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('store_id', store_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching vehicles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('Error in GET /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
