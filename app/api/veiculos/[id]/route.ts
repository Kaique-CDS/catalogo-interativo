import { NextRequest } from 'next/server'
import { deleteVehicleWithPhotos } from '@/lib/vehicle-service'
import { PUT as updateVehicle } from '@/app/api/vehicles/[id]/route'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return deleteVehicleWithPhotos(id, req)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateVehicle(req, context)
}
