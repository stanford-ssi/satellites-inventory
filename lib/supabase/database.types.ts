export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          name: string;
          role: 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          email: string;
          name: string;
          role?: 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          part_id: string;
          description: string;
          bin_id: string | null;
          location_within_bin: string | null;
          quantity: number;
          min_quantity: number;
          part_link: string | null;
          qr_code: string | null;
          is_sensitive: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          part_id: string;
          description: string;
          bin_id?: string | null;
          location_within_bin?: string | null;
          quantity?: number;
          min_quantity?: number;
          part_link?: string | null;
          qr_code?: string | null;
          is_sensitive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          part_id?: string;
          description?: string;
          bin_id?: string | null;
          location_within_bin?: string | null;
          quantity?: number;
          min_quantity?: number;
          part_link?: string | null;
          qr_code?: string | null;
          is_sensitive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          part_id: string;
          user_id: string;
          type: 'checkout' | 'return' | 'adjustment';
          quantity: number;
          notes: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          part_id: string;
          user_id: string;
          type: 'checkout' | 'return' | 'adjustment';
          quantity: number;
          notes?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          part_id?: string;
          user_id?: string;
          type?: 'checkout' | 'return' | 'adjustment';
          quantity?: number;
          notes?: string | null;
          timestamp?: string;
        };
      };
    };
  };
}