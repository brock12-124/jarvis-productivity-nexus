export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          external_event_id: string | null
          id: string
          location: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          external_event_id?: string | null
          id?: string
          location?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          external_event_id?: string | null
          id?: string
          location?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_metadata: {
        Row: {
          calendar_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_primary: boolean | null
          is_selected: boolean | null
          metadata: Json | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean | null
          is_selected?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean | null
          is_selected?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_orders: {
        Row: {
          created_at: string
          delivery_address: string
          id: string
          order_id: string | null
          order_items: Json
          order_total: number
          provider: string
          restaurant_name: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address: string
          id?: string
          order_id?: string | null
          order_items: Json
          order_total: number
          provider: string
          restaurant_name: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          id?: string
          order_id?: string | null
          order_items?: Json
          order_total?: number
          provider?: string
          restaurant_name?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_service_accounts: {
        Row: {
          account_id: string | null
          created_at: string
          default_address_id: string | null
          default_payment_method: string | null
          favorite_restaurants: Json | null
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          default_address_id?: string | null
          default_payment_method?: string | null
          favorite_restaurants?: Json | null
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          default_address_id?: string | null
          default_payment_method?: string | null
          favorite_restaurants?: Json | null
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notion_databases: {
        Row: {
          created_at: string
          database_id: string
          id: string
          property_mappings: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          database_id: string
          id?: string
          property_mappings?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          database_id?: string
          id?: string
          property_mappings?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ride_bookings: {
        Row: {
          booking_id: string | null
          created_at: string
          dropoff_location: string
          fare: number | null
          id: string
          pickup_location: string
          pickup_time: string
          provider: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          dropoff_location: string
          fare?: number | null
          id?: string
          pickup_location: string
          pickup_time: string
          provider: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          dropoff_location?: string
          fare?: number | null
          id?: string
          pickup_location?: string
          pickup_time?: string
          provider?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ride_service_accounts: {
        Row: {
          account_id: string | null
          created_at: string
          default_payment_method: string | null
          favorite_locations: Json | null
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          default_payment_method?: string | null
          favorite_locations?: Json | null
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          default_payment_method?: string | null
          favorite_locations?: Json | null
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slack_channels: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_private: boolean | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          integration_type: string
          operation: string
          payload: Json
          priority: number | null
          resource_id: string | null
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          integration_type: string
          operation: string
          payload: Json
          priority?: number | null
          resource_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          integration_type?: string
          operation?: string
          payload?: Json
          priority?: number | null
          resource_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string
          created_at: string
          etag: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          sync_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          etag?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          etag?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
