import fs from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.contracts-cache.json')

/**
 * Salva contrato no cache local para suportar testes locais e desenvolvimento
 * antes ou independentemente da execução das migrations no Supabase.
 */
export function saveLocalContract(contract: any): void {
  try {
    let list: any[] = []
    if (fs.existsSync(CACHE_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      } catch {
        list = []
      }
    }
    const idx = list.findIndex((c) => c.id === contract.id)
    if (idx >= 0) {
      list[idx] = contract
    } else {
      list.unshift(contract)
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.error('Erro ao salvar contrato local no cache:', err)
  }
}

/**
 * Obtém contrato pelo ID ou número sequencial no cache local.
 */
export function getLocalContractById(id: string): any | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      return (
        list.find((c: any) => c.id === id || String(c.number) === id) || null
      )
    }
  } catch {}
  return null
}

/**
 * Lista todos os contratos salvos no cache local.
 */
export function getLocalContracts(storeId?: string): any[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (!Array.isArray(list)) return []
      return list.filter(
        (c: any) => !c.deleted_at && (!storeId || !c.store_id || c.store_id === storeId)
      )
    }
  } catch {}
  return []
}

/**
 * Marca contrato como cancelado/excluído no cache local.
 */
export function deleteLocalContract(id: string): boolean {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      let list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (!Array.isArray(list)) return false
      list = list.map((c: any) =>
        c.id === id
          ? { ...c, status: 'cancelado', deleted_at: new Date().toISOString() }
          : c
      )
      fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8')
      return true
    }
  } catch {}
  return false
}

/**
 * Obtém signatário e seu contrato pelo hash do token no cache local.
 */
export function getLocalSignerByTokenHash(tokenHash: string): { contract: any; signer: any } | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (!Array.isArray(list)) return null
      for (const c of list) {
        if (c.signers && Array.isArray(c.signers)) {
          const signer = c.signers.find((s: any) => s.token_hash === tokenHash)
          if (signer) {
            return { contract: c, signer }
          }
        }
      }
    }
  } catch {}
  return null
}

/**
 * Atualiza dados de um signatário no cache local.
 */
export function updateLocalSigner(contractId: string, signerId: string, updates: any): boolean {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (!Array.isArray(list)) return false
      const contract = list.find((c: any) => c.id === contractId)
      if (contract && contract.signers) {
        const idx = contract.signers.findIndex((s: any) => s.id === signerId)
        if (idx >= 0) {
          contract.signers[idx] = { ...contract.signers[idx], ...updates }
          fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8')
          return true
        }
      }
    }
  } catch {}
  return false
}

/**
 * Registra evento de auditoria no cache local.
 */
export function addLocalContractEvent(contractId: string, event: any): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const list = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (!Array.isArray(list)) return
      const contract = list.find((c: any) => c.id === contractId)
      if (contract) {
        if (!contract.events) contract.events = []
        contract.events.push({
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          contract_id: contractId,
          ...event,
          created_at: new Date().toISOString(),
        })
        fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8')
      }
    }
  } catch {}
}

