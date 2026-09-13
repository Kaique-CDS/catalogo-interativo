export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          slug: string
          name: string
          logo_url: string | null
          address: string | null
          whatsapp: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          logo_url?: string | null
          address?: string | null
          whatsapp: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          logo_url?: string | null
          address?: string | null
          whatsapp?: string
          owner_id?: string
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          store_id: string
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
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
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
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
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
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Store = Database['public']['Tables']['stores']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']