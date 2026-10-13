import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createAdminClient } from '@/lib/supabase/admin'
import { insertAuditLog } from '@/lib/supabase/erp-db'

export async function deleteVehicleWithPhotos(id: string, req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'
    const actor = req.headers.get('x-actor') || 'Lojista'

    // 1. Busca o veículo no Supabase pelo id, obtendo as fotos (com public_id)
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('Erro ao buscar veículo no Supabase antes da exclusão:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 })
    }

    const vehicleTitle = vehicle.title || `Veículo #${id.slice(0, 8)}`

    // Coleta todos os public_ids das fotos cadastradas no Cloudinary
    const publicIds: string[] = []
    if (Array.isArray(vehicle.fotos)) {
      for (const item of vehicle.fotos) {
        if (item && typeof item === 'object' && item.public_id) {
          const pid = String(item.public_id).trim()
          if (pid) publicIds.push(pid)
        }
      }
    }

    // 2. Chama a Admin API do Cloudinary para apagar todas as fotos em lote
    let photosDeletedCount = 0
    let cloudinaryFailed = false

    if (publicIds.length > 0) {
      try {
        const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'prnrnxaw').trim()
        const apiKey = (process.env.CLOUDINARY_API_KEY || '311883981717173').trim()
        const apiSecret = (process.env.CLOUDINARY_API_SECRET || 'SaJiLBB4hgByAIWoSYRtgqcGFUc').trim()

        if (cloudName && apiKey && apiSecret) {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
          })

          const delRes = await cloudinary.api.delete_resources(publicIds)
          if (delRes && delRes.deleted) {
            photosDeletedCount = Object.values(delRes.deleted).filter(
              (status) => status === 'deleted' || status === 'not_found'
            ).length
          } else {
            photosDeletedCount = publicIds.length
          }
        } else {
          console.warn('Credenciais do Cloudinary incompletas para exclusão automática de fotos.')
        }
      } catch (err: any) {
        cloudinaryFailed = true
        console.error('Falha ao excluir fotos no Cloudinary:', err)

        // Se a exclusão no Cloudinary falhar, registra log de erro mas NÃO bloqueia a exclusão do registro no banco
        try {
          await insertAuditLog({
            tipo: 'erro',
            criticidade: 'critico',
            descricao: `Falha ao apagar ${publicIds.length} foto(s) no Cloudinary para "${vehicleTitle}": ${err?.message || 'Erro de comunicação'}`,
            ator: actor,
            ip: clientIp,
          })
        } catch (logErr) {
          console.error('Erro ao salvar log de erro no auditoria:', logErr)
        }
      }
    }

    // 3. Deleta o registro do veículo no Supabase
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar veículo no Supabase:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 4. Inserir registro em logs_auditoria (tipo: 'exclusao') com contagem de fotos removidas
    try {
      const photosDetail = publicIds.length > 0
        ? cloudinaryFailed
          ? `(Tentativa de remoção de ${publicIds.length} foto(s) no Cloudinary falhou, agendada limpeza manual)`
          : `(${photosDeletedCount} foto(s) removida(s) do Cloudinary com sucesso)`
        : `(Sem fotos registradas no Cloudinary)`

      await insertAuditLog({
        tipo: 'exclusao',
        criticidade: 'normal',
        descricao: `Veículo "${vehicleTitle}" excluído do catálogo ${photosDetail}.`,
        ator: actor,
        ip: clientIp,
      })
    } catch (logErr) {
      console.error('Erro ao registrar log de exclusão:', logErr)
    }

    return NextResponse.json(
      {
        success: true,
        deletedId: id,
        photosDeleted: photosDeletedCount,
        cloudinaryFailed,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Erro geral ao excluir veículo:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
