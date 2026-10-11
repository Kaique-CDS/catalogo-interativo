import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    
    const { 
      slug, store_id, title, brand, model, year, mileage, price, fuel, transmission, 
      color, plate_end, features, badge, description, images, is_active 
    } = body

    if ((!slug && !store_id) || !title || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // Resolve o store_id se não foi passado diretamente, mas o slug foi
    const finalStoreId = store_id || await resolveStoreId(supabase, slug)

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
          store_id: finalStoreId,
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
    const slug = searchParams.get('slug')

    if (!store_id && !slug) {
      return NextResponse.json({ error: 'store_id ou slug é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || await resolveStoreId(supabase, slug!)

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('store_id', finalStoreId)
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
