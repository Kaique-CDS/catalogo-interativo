import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await req.json()

    const {
      title,
      brand,
      model,
      year,
      mileage,
      price,
      fuel,
      transmission,
      color,
      plate_end,
      features,
      badge,
      description,
      images,
      is_active,
      sku,
    } = body

    // Monta apenas colunas válidas da tabela vehicles (ignora slug, id, store_id, created_at)
    const updatePayload: Record<string, any> = {}
    if (title !== undefined) updatePayload.title = title
    if (brand !== undefined) updatePayload.brand = brand
    if (model !== undefined) updatePayload.model = model
    if (year !== undefined) updatePayload.year = parseInt(String(year), 10)
    if (mileage !== undefined) updatePayload.mileage = parseInt(String(mileage || 0), 10)
    if (price !== undefined) updatePayload.price = parseFloat(String(price || 0))
    if (fuel !== undefined) updatePayload.fuel = fuel
    if (transmission !== undefined) updatePayload.transmission = transmission
    if (color !== undefined) updatePayload.color = color
    if (plate_end !== undefined) updatePayload.plate_end = plate_end
    if (features !== undefined) updatePayload.features = features
    if (badge !== undefined) updatePayload.badge = badge
    if (description !== undefined) updatePayload.description = description
    if (images !== undefined) updatePayload.images = images
    if (is_active !== undefined) updatePayload.is_active = is_active
    if (sku !== undefined) updatePayload.sku = sku

    const { data, error } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating vehicle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('Error in PUT /api/vehicles/[id]:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error deleting vehicle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Error in DELETE /api/vehicles/[id]:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
