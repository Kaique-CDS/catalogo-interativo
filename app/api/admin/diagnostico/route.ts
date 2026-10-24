import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'
import { getCloudinary } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface MigrationCheck {
  number: string
  title: string
  file: string
  applied: boolean
  description: string
  error?: string | null
  sql?: string
}

function getMigrationSql(filename: string): string {
  try {
    const fullPath = path.join(process.cwd(), 'supabase', 'migrations', filename)
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8')
    }
  } catch {}
  return `-- Arquivo supabase/migrations/${filename}`
}

export async function GET(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    const supabase = createAdminClient()
    if (slug) {
      const storeId = await resolveStoreId(supabase, slug)
      if (storeId && !canAccessTenant(auth, storeId)) {
        return NextResponse.json({ error: 'Acesso negado para este catálogo' }, { status: 403 })
      }
    }

    // 1. Verificação de Variáveis de Ambiente (Apenas Presença - Nunca Expor Valores)
    const envVars = [
      {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        label: 'URL do Projeto Supabase',
        category: 'Supabase',
        present: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
        ),
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        label: 'Chave Pública Anon do Supabase',
        category: 'Supabase',
        present: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
        ),
      },
      {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        label: 'Chave Secreta Service Role do Supabase',
        category: 'Supabase',
        present: Boolean(
          process.env.SUPABASE_SERVICE_ROLE_KEY &&
          !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
        ),
      },
      {
        key: 'CLOUDINARY_CLOUD_NAME',
        label: 'Nome da Cloud do Cloudinary',
        category: 'Cloudinary',
        present: Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()),
      },
      {
        key: 'CLOUDINARY_API_KEY',
        label: 'API Key do Cloudinary',
        category: 'Cloudinary',
        present: Boolean(process.env.CLOUDINARY_API_KEY?.trim()),
      },
      {
        key: 'CLOUDINARY_API_SECRET',
        label: 'API Secret do Cloudinary',
        category: 'Cloudinary',
        present: Boolean(process.env.CLOUDINARY_API_SECRET?.trim()),
      },
      {
        key: 'RESEND_API_KEY',
        label: 'API Key do Resend (E-mails transacionais)',
        category: 'E-mail / Notificações',
        present: Boolean(process.env.RESEND_API_KEY?.trim()),
      },
      {
        key: 'SESSION_SECRET',
        label: 'Segredo de Assinatura de Sessão (HMAC-SHA256)',
        category: 'Segurança',
        present: Boolean(process.env.SESSION_SECRET?.trim()),
      },
      {
        key: 'ENCRYPTION_KEY',
        label: 'Chave de Criptografia de Dados PII (AES-256)',
        category: 'Segurança',
        present: Boolean(
          process.env.ENCRYPTION_KEY?.trim() && process.env.ENCRYPTION_KEY.trim().length >= 32
        ),
      },
      {
        key: 'CRON_SECRET',
        label: 'Segredo para Execução de Cron Jobs',
        category: 'Segurança',
        present: Boolean(process.env.CRON_SECRET?.trim()),
      },
      {
        key: 'GEMINI_API_KEY',
        label: 'API Key do Google Gemini (Geração de Descrições)',
        category: 'Inteligência Artificial',
        present: Boolean(process.env.GEMINI_API_KEY?.trim()),
      },
      {
        key: 'NEXT_PUBLIC_APP_URL',
        label: 'URL Pública da Aplicação na Web',
        category: 'Aplicação',
        present: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
      },
    ]

    // 2. Testes de Conexão Ativa
    // Supabase
    let supabaseStatus = { ok: false, latency_ms: 0, error: null as string | null }
    const subStart = Date.now()
    try {
      const { error } = await supabase.from('stores').select('id').limit(1)
      supabaseStatus.latency_ms = Date.now() - subStart
      if (error) {
        supabaseStatus.ok = false
        supabaseStatus.error = error.message
      } else {
        supabaseStatus.ok = true
      }
    } catch (e: any) {
      supabaseStatus.latency_ms = Date.now() - subStart
      supabaseStatus.ok = false
      supabaseStatus.error = e?.message || 'Erro ao conectar ao Supabase'
    }

    // Cloudinary
    let cloudinaryStatus = {
      ok: false,
      configured: false,
      latency_ms: 0,
      error: null as string | null,
    }
    const c = getCloudinary()
    if (!c) {
      cloudinaryStatus.configured = false
      cloudinaryStatus.error =
        'As variáveis CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET não estão cadastradas na Vercel.'
    } else {
      cloudinaryStatus.configured = true
      const cStart = Date.now()
      try {
        const pingRes = await c.api.ping()
        cloudinaryStatus.latency_ms = Date.now() - cStart
        if (pingRes?.status === 'ok') {
          cloudinaryStatus.ok = true
        } else {
          cloudinaryStatus.ok = false
          cloudinaryStatus.error = `Status retornado: ${JSON.stringify(pingRes)}`
        }
      } catch (e: any) {
        cloudinaryStatus.latency_ms = Date.now() - cStart
        cloudinaryStatus.ok = false
        cloudinaryStatus.error = e?.message || 'Falha no ping da API do Cloudinary'
      }
    }

    // 3. Verificação de Colunas e Tabelas por Migration (014 a 028)
    const migrations: MigrationCheck[] = []

    // 014: Módulo de Contratos
    try {
      const { error } = await supabase.from('contracts').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '014',
        title: 'Módulo de Contratos e Documentos Jurídicos',
        file: '014_module_contracts.sql',
        applied: !isMissing,
        description: 'Tabelas contracts, contract_counters e função get_next_contract_number.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('014_module_contracts.sql'),
      })
    } catch {
      migrations.push({
        number: '014',
        title: 'Módulo de Contratos e Documentos Jurídicos',
        file: '014_module_contracts.sql',
        applied: false,
        description: 'Tabelas contracts, contract_counters e função get_next_contract_number.',
        sql: getMigrationSql('014_module_contracts.sql'),
      })
    }

    // 015: Contatos da Loja para Contratos
    try {
      const { error } = await supabase.from('stores').select('contract_email, contract_phone').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '015',
        title: 'Dados de Contato da Loja para Contratos',
        file: '015_fix_store_contacts.sql',
        applied: !isMissing,
        description: 'Colunas contract_email e contract_phone na tabela stores.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('015_fix_store_contacts.sql'),
      })
    } catch {
      migrations.push({
        number: '015',
        title: 'Dados de Contato da Loja para Contratos',
        file: '015_fix_store_contacts.sql',
        applied: false,
        description: 'Colunas contract_email e contract_phone na tabela stores.',
        sql: getMigrationSql('015_fix_store_contacts.sql'),
      })
    }

    // 016: Governança de IA
    try {
      const { error } = await supabase.from('stores').select('ai_monthly_usage, ai_limit_locked').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '016',
        title: 'Governança e Cotas de IA da Loja',
        file: '016_ai_usage_and_lock.sql',
        applied: !isMissing,
        description: 'Colunas ai_monthly_usage e ai_limit_locked na tabela stores.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('016_ai_usage_and_lock.sql'),
      })
    } catch {
      migrations.push({
        number: '016',
        title: 'Governança e Cotas de IA da Loja',
        file: '016_ai_usage_and_lock.sql',
        applied: false,
        description: 'Colunas ai_monthly_usage e ai_limit_locked na tabela stores.',
        sql: getMigrationSql('016_ai_usage_and_lock.sql'),
      })
    }

    // 017: Sistema de Tickets
    try {
      const { error } = await supabase.from('support_tickets').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '017',
        title: 'Central de Suporte e Tickets',
        file: '017_tickets_system.sql',
        applied: !isMissing,
        description: 'Tabela support_tickets para chamados internos e melhorias.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('017_tickets_system.sql'),
      })
    } catch {
      migrations.push({
        number: '017',
        title: 'Central de Suporte e Tickets',
        file: '017_tickets_system.sql',
        applied: false,
        description: 'Tabela support_tickets.',
        sql: getMigrationSql('017_tickets_system.sql'),
      })
    }

    // 018: Usuários e Autenticação de Lojistas
    try {
      const { error } = await supabase.from('store_users').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '018',
        title: 'Usuários Lojistas e Senhas Hash Bcrypt',
        file: '018_store_users_and_auth.sql',
        applied: !isMissing,
        description: 'Tabela store_users com hash bcrypt para substituição de senhas estáticas.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('018_store_users_and_auth.sql'),
      })
    } catch {
      migrations.push({
        number: '018',
        title: 'Usuários Lojistas e Senhas Hash Bcrypt',
        file: '018_store_users_and_auth.sql',
        applied: false,
        description: 'Tabela store_users.',
        sql: getMigrationSql('018_store_users_and_auth.sql'),
      })
    }

    // 019: Segurança e MFA TOTP
    try {
      const { error } = await supabase.from('mfa_tokens').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '019',
        title: 'MFA 2FA (RFC 6238) e Logs de Segurança',
        file: '019_security_and_mfa.sql',
        applied: !isMissing,
        description: 'Tabela mfa_tokens para autenticação em dois fatores.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('019_security_and_mfa.sql'),
      })
    } catch {
      migrations.push({
        number: '019',
        title: 'MFA 2FA (RFC 6238) e Logs de Segurança',
        file: '019_security_and_mfa.sql',
        applied: false,
        description: 'Tabela mfa_tokens.',
        sql: getMigrationSql('019_security_and_mfa.sql'),
      })
    }

    // 020: Veículos created_at guard
    try {
      const { error } = await supabase.from('vehicles').select('created_at').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '020',
        title: 'Guarda da Coluna created_at em Veículos',
        file: '020_vehicle_created_at_guard.sql',
        applied: !isMissing,
        description: 'Garante a coluna created_at com valor padrão now().',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('020_vehicle_created_at_guard.sql'),
      })
    } catch {
      migrations.push({
        number: '020',
        title: 'Guarda da Coluna created_at em Veículos',
        file: '020_vehicle_created_at_guard.sql',
        applied: false,
        description: 'Coluna created_at em vehicles.',
        sql: getMigrationSql('020_vehicle_created_at_guard.sql'),
      })
    }

    // 021: Preço Promocional (old_price)
    try {
      const { error } = await supabase.from('vehicles').select('old_price').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '021',
        title: 'Preço De/Por Promocional (old_price)',
        file: '021_add_vehicle_old_price.sql',
        applied: !isMissing,
        description: 'Coluna old_price na tabela vehicles para tags de oferta.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('021_add_vehicle_old_price.sql'),
      })
    } catch {
      migrations.push({
        number: '021',
        title: 'Preço De/Por Promocional (old_price)',
        file: '021_add_vehicle_old_price.sql',
        applied: false,
        description: 'Coluna old_price em vehicles.',
        sql: getMigrationSql('021_add_vehicle_old_price.sql'),
      })
    }

    // 022: Status de Venda (status, sold_at) -> CRÍTICO PARA OS CARROS
    try {
      const { error } = await supabase.from('vehicles').select('status, sold_at').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '022',
        title: 'Status do Veículo e Métricas de Venda',
        file: '022_vehicle_sold_metrics.sql',
        applied: !isMissing,
        description: 'Colunas status (disponivel, vendido, reservado) e sold_at. CRÍTICO: sua ausência impede o filtro de carros na vitrine.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('022_vehicle_sold_metrics.sql'),
      })
    } catch {
      migrations.push({
        number: '022',
        title: 'Status do Veículo e Métricas de Venda',
        file: '022_vehicle_sold_metrics.sql',
        applied: false,
        description: 'Colunas status e sold_at em vehicles.',
        sql: getMigrationSql('022_vehicle_sold_metrics.sql'),
      })
    }

    // 023: Tenant Banners -> CRÍTICO PARA OS BANNERS
    try {
      const { error } = await supabase.from('tenant_banners').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '023',
        title: 'Múltiplos Banners Desktop/Mobile (Carrossel e Vídeos)',
        file: '023_tenant_banners.sql',
        applied: !isMissing,
        description: 'Tabela tenant_banners. CRÍTICO: sua ausência força fallback para banners legados da tabela stores.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('023_tenant_banners.sql'),
      })
    } catch {
      migrations.push({
        number: '023',
        title: 'Múltiplos Banners Desktop/Mobile (Carrossel e Vídeos)',
        file: '023_tenant_banners.sql',
        applied: false,
        description: 'Tabela tenant_banners.',
        sql: getMigrationSql('023_tenant_banners.sql'),
      })
    }

    // 024: Vídeo de Boas-Vindas
    try {
      const { error } = await supabase.from('stores').select('welcome_video_url').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '024',
        title: 'Vídeo Flutuante de Boas-Vindas',
        file: '024_welcome_video.sql',
        applied: !isMissing,
        description: 'Coluna welcome_video_url na tabela stores para vídeo institucional estilo stories.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('024_welcome_video.sql'),
      })
    } catch {
      migrations.push({
        number: '024',
        title: 'Vídeo Flutuante de Boas-Vindas',
        file: '024_welcome_video.sql',
        applied: false,
        description: 'Coluna welcome_video_url na tabela stores.',
        sql: getMigrationSql('024_welcome_video.sql'),
      })
    }

    // 025: Fotos de Clientes
    try {
      const { error } = await supabase.from('tenant_customer_photos').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '025',
        title: 'Galeria de Clientes ("Clientes que levaram o carro")',
        file: '025_tenant_customer_photos.sql',
        applied: !isMissing,
        description: 'Tabela tenant_customer_photos para prova social e entrega de veículos.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('025_tenant_customer_photos.sql'),
      })
    } catch {
      migrations.push({
        number: '025',
        title: 'Galeria de Clientes ("Clientes que levaram o carro")',
        file: '025_tenant_customer_photos.sql',
        applied: false,
        description: 'Tabela tenant_customer_photos.',
        sql: getMigrationSql('025_tenant_customer_photos.sql'),
      })
    }

    // 026: Vínculo de Contrato com Veículo do Estoque
    try {
      const { error } = await supabase.from('contracts').select('vehicle_id').limit(1)
      const isMissing = error && (error.code === '42703' || error.message?.includes('column'))
      migrations.push({
        number: '026',
        title: 'Vínculo de Contrato com Veículo do Estoque',
        file: '026_contract_vehicle_id.sql',
        applied: !isMissing,
        description: 'Coluna vehicle_id na tabela contracts para baixa automática ao assinar contrato.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('026_contract_vehicle_id.sql'),
      })
    } catch {
      migrations.push({
        number: '026',
        title: 'Vínculo de Contrato com Veículo do Estoque',
        file: '026_contract_vehicle_id.sql',
        applied: false,
        description: 'Coluna vehicle_id na tabela contracts.',
        sql: getMigrationSql('026_contract_vehicle_id.sql'),
      })
    }

    // 027: Rascunhos Automáticos de Contratos
    try {
      const { error } = await supabase.from('contract_drafts').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '027',
        title: 'Rascunhos de Contratos com Criptografia',
        file: '027_contract_drafts.sql',
        applied: !isMissing,
        description: 'Tabela contract_drafts para salvamento automático de progresso de emissão.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('027_contract_drafts.sql'),
      })
    } catch {
      migrations.push({
        number: '027',
        title: 'Rascunhos de Contratos com Criptografia',
        file: '027_contract_drafts.sql',
        applied: false,
        description: 'Tabela contract_drafts.',
        sql: getMigrationSql('027_contract_drafts.sql'),
      })
    }

    // 028: Modelos Padrão de Cláusulas da Loja
    try {
      const { error } = await supabase.from('contract_templates').select('id').limit(1)
      const isMissing = error && (error.code === '42P01' || error.message?.includes('does not exist'))
      migrations.push({
        number: '028',
        title: 'Modelos de Cláusulas Padrão da Loja',
        file: '028_contract_templates.sql',
        applied: !isMissing,
        description: 'Tabela contract_templates para salvar respostas do questionário como padrão da loja.',
        error: isMissing ? error.message : null,
        sql: getMigrationSql('028_contract_templates.sql'),
      })
    } catch {
      migrations.push({
        number: '028',
        title: 'Modelos de Cláusulas Padrão da Loja',
        file: '028_contract_templates.sql',
        applied: false,
        description: 'Tabela contract_templates.',
        sql: getMigrationSql('028_contract_templates.sql'),
      })
    }

    const totalMigrations = migrations.length
    const appliedMigrations = migrations.filter((m) => m.applied).length
    const missingMigrationsList = migrations.filter((m) => !m.applied)

    const totalEnv = envVars.length
    const presentEnv = envVars.filter((e) => e.present).length

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        summary: {
          env_ok: presentEnv === totalEnv,
          env_present_count: presentEnv,
          env_total_count: totalEnv,
          supabase_ok: supabaseStatus.ok,
          cloudinary_ok: cloudinaryStatus.ok,
          migrations_ok: missingMigrationsList.length === 0,
          migrations_applied_count: appliedMigrations,
          migrations_total_count: totalMigrations,
        },
        connections: {
          supabase: supabaseStatus,
          cloudinary: cloudinaryStatus,
        },
        env: envVars,
        migrations,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Erro no diagnóstico:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar diagnóstico' },
      { status: 500 }
    )
  }
}
