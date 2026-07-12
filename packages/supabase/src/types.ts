export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          email: string | null
          provider: string
          provider_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          provider?: string
          provider_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          provider?: string
          provider_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          max_active_rooms: number | null
          max_room_members: number | null
          tier: string
          updated_at: string
        }
        Insert: {
          max_active_rooms?: number | null
          max_room_members?: number | null
          tier: string
          updated_at?: string
        }
        Update: {
          max_active_rooms?: number | null
          max_room_members?: number | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          metadata: Json
          provider: string
          provider_subscription_id: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_subscription_id: string
          status: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_subscription_id?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["tier"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          locale: string
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          locale?: string
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          locale?: string
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_queue_items: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          position: number
          room_id: string
          source_ref: string
          source_type: Database["public"]["Enums"]["watch_source_type"]
          title: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          position: number
          room_id: string
          source_ref: string
          source_type: Database["public"]["Enums"]["watch_source_type"]
          title?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          position?: number
          room_id?: string
          source_ref?: string
          source_type?: Database["public"]["Enums"]["watch_source_type"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_queue_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_heartbeats: {
        Row: {
          heartbeat_at: string
          host_id: string
          room_id: string
        }
        Insert: {
          heartbeat_at?: string
          host_id: string
          room_id: string
        }
        Update: {
          heartbeat_at?: string
          host_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_heartbeats_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_rooms: {
        Row: {
          anchor_position: number
          anchor_server_ts: string
          code: string
          created_at: string
          current_queue_item_id: string | null
          host_heartbeat_at: string
          host_id: string
          id: string
          is_playing: boolean
          last_active_at: string
          playback_rate: number
          source_ref: string
          source_type: Database["public"]["Enums"]["watch_source_type"]
          updated_at: string
        }
        Insert: {
          anchor_position?: number
          anchor_server_ts?: string
          code: string
          created_at?: string
          current_queue_item_id?: string | null
          host_heartbeat_at?: string
          host_id: string
          id?: string
          is_playing?: boolean
          last_active_at?: string
          playback_rate?: number
          source_ref: string
          source_type: Database["public"]["Enums"]["watch_source_type"]
          updated_at?: string
        }
        Update: {
          anchor_position?: number
          anchor_server_ts?: string
          code?: string
          created_at?: string
          current_queue_item_id?: string | null
          host_heartbeat_at?: string
          host_id?: string
          id?: string
          is_playing?: boolean
          last_active_at?: string
          playback_rate?: number
          source_ref?: string
          source_type?: Database["public"]["Enums"]["watch_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_rooms_current_queue_item_id_fkey"
            columns: ["current_queue_item_id"]
            isOneToOne: false
            referencedRelation: "watch_queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_room_host: { Args: { p_room_id: string }; Returns: undefined }
      get_public_profiles: {
        Args: { p_ids: string[] }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      get_user_entitlements: {
        Args: { p_user: string }
        Returns: {
          max_active_rooms: number
          max_room_members: number
          tier: string
        }[]
      }
      leave_room: { Args: { p_room_id: string }; Returns: undefined }
      transfer_room_host: {
        Args: { p_new_host: string; p_room_id: string }
        Returns: undefined
      }
    }
    Enums: {
      watch_source_type: "youtube" | "url"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      watch_source_type: ["youtube", "url"],
    },
  },
} as const

