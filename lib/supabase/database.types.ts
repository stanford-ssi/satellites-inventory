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
      boards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          version: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          version?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          version?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      board_parts: {
        Row: {
          id: string;
          board_id: string;
          part_id: string;
          quantity_required: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          part_id: string;
          quantity_required: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          part_id?: string;
          quantity_required?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      board_builds: {
        Row: {
          id: string;
          board_id: string;
          built_by: string | null;
          quantity_built: number;
          notes: string | null;
          built_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          built_by?: string | null;
          quantity_built?: number;
          notes?: string | null;
          built_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          built_by?: string | null;
          quantity_built?: number;
          notes?: string | null;
          built_at?: string;
        };
      };
    };
    Functions: {
      build_board: {
        Args: {
          board_id_param: string;
          quantity_param?: number;
          notes_param?: string | null;
        };
        Returns: {
          success: boolean;
          build_id?: string;
          message?: string;
          error?: string;
          insufficient_parts?: string[];
        };
      };
    };
  };
}