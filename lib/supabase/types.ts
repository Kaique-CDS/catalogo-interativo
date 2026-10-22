export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          slug: string
          name: string
          logo_url: string | null
          banner_url: string | null
          address: string | null
          whatsapp: string
          whatsapp_financeiro: string | null
          phone?: string | null
          instagram?: string | null
          email?: string | null
          maps_embed_url?: string | null
          banner_mobile_url?: string | null
          opening_hours: string | null
          primary_color: string | null
          font_family: string | null
          slogan: string | null
          modules?: { contracts?: boolean; [key: string]: any } | null
          contracts_enabled?: boolean | null
          contract_razao_social?: string | null
          contract_cnpj?: string | null
          contract_address?: string | null
          contract_phone?: string | null
          contract_email?: string | null
          contract_foro_cidade?: string | null
          contract_foro_estado?: string | null
          contract_rep_nome?: string | null
          contract_rep_cpf?: string | null
          contract_signature_url?: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          whatsapp: string
          whatsapp_financeiro?: string | null
          phone?: string | null
          instagram?: string | null
          email?: string | null
          maps_embed_url?: string | null
          banner_mobile_url?: string | null
          opening_hours?: string | null
          primary_color?: string | null
          font_family?: string | null
          slogan?: string | null
          modules?: { contracts?: boolean; [key: string]: any } | null
          contracts_enabled?: boolean | null
          contract_razao_social?: string | null
          contract_cnpj?: string | null
          contract_address?: string | null
          contract_phone?: string | null
          contract_email?: string | null
          contract_foro_cidade?: string | null
          contract_foro_estado?: string | null
          contract_rep_nome?: string | null
          contract_rep_cpf?: string | null
          contract_signature_url?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          whatsapp?: string
          whatsapp_financeiro?: string | null
          phone?: string | null
          instagram?: string | null
          email?: string | null
          maps_embed_url?: string | null
          banner_mobile_url?: string | null
          opening_hours?: string | null
          primary_color?: string | null
          font_family?: string | null
          slogan?: string | null
          modules?: { contracts?: boolean; [key: string]: any } | null
          contracts_enabled?: boolean | null
          contract_razao_social?: string | null
          contract_cnpj?: string | null
          contract_address?: string | null
          contract_phone?: string | null
          contract_email?: string | null
          contract_foro_cidade?: string | null
          contract_foro_estado?: string | null
          contract_rep_nome?: string | null
          contract_rep_cpf?: string | null
          contract_signature_url?: string | null
          owner_id?: string
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          store_id: string
          sku: string | null
          title: string
          brand: string
          model: string
          year: number
          mileage: number
          price: number
          fuel?: string | null
          transmission?: string | null
          color?: string | null
          plate_end?: string | null
          features?: string[] | null
          badge?: string | null
          description: string | null
          images: string[]
          fotos?: Array<{ url: string; public_id?: string | null; is_capa?: boolean }> | null
          fotos_urls?: string[] | null
          foto_capa_url?: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          sku?: string | null
          title: string
          brand: string
          model: string
          year: number
          mileage?: number
          price: number
          fuel?: string | null
          transmission?: string | null
          color?: string | null
          plate_end?: string | null
          features?: string[] | null
          badge?: string | null
          description?: string | null
          images?: string[]
          fotos?: Array<{ url: string; public_id?: string | null; is_capa?: boolean }> | null
          fotos_urls?: string[] | null
          foto_capa_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          sku?: string | null
          title?: string
          brand?: string
          model?: string
          year?: number
          mileage?: number
          price?: number
          fuel?: string | null
          transmission?: string | null
          color?: string | null
          plate_end?: string | null
          features?: string[] | null
          badge?: string | null
          description?: string | null
          images?: string[]
          fotos?: Array<{ url: string; public_id?: string | null; is_capa?: boolean }> | null
          fotos_urls?: string[] | null
          foto_capa_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      melhorias: {
        Row: {
          id: string
          tipo: 'urgente' | 'feature' | 'bug' | 'analise'
          titulo: string
          descricao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: 'urgente' | 'feature' | 'bug' | 'analise'
          titulo: string
          descricao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: 'urgente' | 'feature' | 'bug' | 'analise'
          titulo?: string
          descricao?: string | null
          created_at?: string
        }
      }
      contract_counters: {
        Row: {
          id: string
          store_id: string
          type: 'venda' | 'procuracao'
          last_number: number
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          type: 'venda' | 'procuracao'
          last_number?: number
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          type?: 'venda' | 'procuracao'
          last_number?: number
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          store_id: string
          sequential_number: number
          title: string
          type: 'venda' | 'procuracao'
          status: 'draft' | 'sent' | 'partially_signed' | 'signed' | 'canceled'
          buyer_type: 'pf' | 'pj'
          buyer_data: any
          seller_data: any
          vehicle_data: any
          payment_data: any
          clauses: any[]
          observations: string | null
          delivery_days: number | null
          down_payment: number | null
          transfer_responsible: string | null
          warranty_text: string | null
          crlv_data: any | null
          crlv_file_url: string | null
          print_pdf_url: string | null
          signed_pdf_url: string | null
          pdf_sha256: string | null
          is_manual_signed: boolean
          manual_signed_file_url: string | null
          manual_signed_by: string | null
          manual_signed_at: string | null
          canceled_at: string | null
          canceled_reason: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          sequential_number: number
          title: string
          type: 'venda' | 'procuracao'
          status?: 'draft' | 'sent' | 'partially_signed' | 'signed' | 'canceled'
          buyer_type: 'pf' | 'pj'
          buyer_data?: any
          seller_data?: any
          vehicle_data?: any
          payment_data?: any
          clauses?: any[]
          observations?: string | null
          delivery_days?: number | null
          down_payment?: number | null
          transfer_responsible?: string | null
          warranty_text?: string | null
          crlv_data?: any | null
          crlv_file_url?: string | null
          print_pdf_url?: string | null
          signed_pdf_url?: string | null
          pdf_sha256?: string | null
          is_manual_signed?: boolean
          manual_signed_file_url?: string | null
          manual_signed_by?: string | null
          manual_signed_at?: string | null
          canceled_at?: string | null
          canceled_reason?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          sequential_number?: number
          title?: string
          type?: 'venda' | 'procuracao'
          status?: 'draft' | 'sent' | 'partially_signed' | 'signed' | 'canceled'
          buyer_type?: 'pf' | 'pj'
          buyer_data?: any
          seller_data?: any
          vehicle_data?: any
          payment_data?: any
          clauses?: any[]
          observations?: string | null
          delivery_days?: number | null
          down_payment?: number | null
          transfer_responsible?: string | null
          warranty_text?: string | null
          crlv_data?: any | null
          crlv_file_url?: string | null
          print_pdf_url?: string | null
          signed_pdf_url?: string | null
          pdf_sha256?: string | null
          is_manual_signed?: boolean
          manual_signed_file_url?: string | null
          manual_signed_by?: string | null
          manual_signed_at?: string | null
          canceled_at?: string | null
          canceled_reason?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_signers: {
        Row: {
          id: string
          contract_id: string
          role: 'buyer' | 'seller' | 'outorgante' | 'outorgado'
          name: string
          document: string
          email: string
          phone: string
          token_hash: string
          token_expires_at: string
          status: 'pending' | 'signed' | 'rejected' | 'expired'
          signed_at: string | null
          signature_image_url: string | null
          ip: string | null
          user_agent: string | null
          otp_code_hash: string | null
          otp_sent_at: string | null
          otp_attempts: number
          otp_verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          role: 'buyer' | 'seller' | 'outorgante' | 'outorgado'
          name: string
          document: string
          email: string
          phone: string
          token_hash: string
          token_expires_at: string
          status?: 'pending' | 'signed' | 'rejected' | 'expired'
          signed_at?: string | null
          signature_image_url?: string | null
          ip?: string | null
          user_agent?: string | null
          otp_code_hash?: string | null
          otp_sent_at?: string | null
          otp_attempts?: number
          otp_verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          role?: 'buyer' | 'seller' | 'outorgante' | 'outorgado'
          name?: string
          document?: string
          email?: string
          phone?: string
          token_hash?: string
          token_expires_at?: string
          status?: 'pending' | 'signed' | 'rejected' | 'expired'
          signed_at?: string | null
          signature_image_url?: string | null
          ip?: string | null
          user_agent?: string | null
          otp_code_hash?: string | null
          otp_sent_at?: string | null
          otp_attempts?: number
          otp_verified_at?: string | null
          created_at?: string
        }
      }
      contract_events: {
        Row: {
          id: string
          contract_id: string
          signer_id: string | null
          event_type: 'created' | 'viewed' | 'otp_sent' | 'otp_verified' | 'otp_failed' | 'signed' | 'manual_signed' | 'canceled' | 'deleted' | 'pdf_generated'
          ip: string | null
          user_agent: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          signer_id?: string | null
          event_type: 'created' | 'viewed' | 'otp_sent' | 'otp_verified' | 'otp_failed' | 'signed' | 'manual_signed' | 'canceled' | 'deleted' | 'pdf_generated'
          ip?: string | null
          user_agent?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          signer_id?: string | null
          event_type?: 'created' | 'viewed' | 'otp_sent' | 'otp_verified' | 'otp_failed' | 'signed' | 'manual_signed' | 'canceled' | 'deleted' | 'pdf_generated'
          ip?: string | null
          user_agent?: string | null
          metadata?: any
          created_at?: string
        }
      }
      contract_templates: {
        Row: {
          id: string
          store_id: string
          type: 'venda' | 'procuracao'
          title: string
          clauses: any[]
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          type: 'venda' | 'procuracao'
          title: string
          clauses?: any[]
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          type?: 'venda' | 'procuracao'
          title?: string
          clauses?: any[]
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Store = Database['public']['Tables']['stores']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Melhoria = Database['public']['Tables']['melhorias']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type ContractSigner = Database['public']['Tables']['contract_signers']['Row']
export type ContractEvent = Database['public']['Tables']['contract_events']['Row']
export type ContractTemplate = Database['public']['Tables']['contract_templates']['Row']
export type ContractCounter = Database['public']['Tables']['contract_counters']['Row']