export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'member'
          name: string
          github_username: string | null
          github_id: number | null
          ssi_org_member: boolean
          ssi_org_role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'member'
          name: string
          github_username?: string | null
          github_id?: number | null
          ssi_org_member?: boolean
          ssi_org_role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'member'
          name?: string
          github_username?: string | null
          github_id?: number | null
          ssi_org_member?: boolean
          ssi_org_role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          part_id: string
          description: string
          bin_id: string
          location_within_bin: string
          quantity: number
          part_link: string | null
          qr_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_id: string
          description: string
          bin_id: string
          location_within_bin: string
          quantity: number
          part_link?: string | null
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          part_id?: string
          description?: string
          bin_id?: string
          location_within_bin?: string
          quantity?: number
          part_link?: string | null
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          part_id: string
          user_id: string
          type: 'checkout' | 'return'
          quantity: number
          timestamp: string
        }
        Insert: {
          id?: string
          part_id: string
          user_id: string
          type: 'checkout' | 'return'
          quantity: number
          timestamp?: string
        }
        Update: {
          id?: string
          part_id?: string
          user_id?: string
          type?: 'checkout' | 'return'
          quantity?: number
          timestamp?: string
        }
      }
    }
  }
}