import type { Database, Json } from '@pumni/supabase';

export interface BillingDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      plans: {
        Row: {
          tier: string;
          max_active_rooms: number | null;
          max_room_members: number | null;
          updated_at: string;
        };
        Insert: {
          tier: string;
          max_active_rooms?: number | null;
          max_room_members?: number | null;
          updated_at?: string;
        };
        Update: {
          tier?: string;
          max_active_rooms?: number | null;
          max_room_members?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_customers: {
        Row: {
          user_id: string;
          provider: string;
          provider_customer_id: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          provider?: string;
          provider_customer_id?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_subscription_id: string;
          tier: string;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          provider_subscription_id: string;
          tier: string;
          status: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          provider_subscription_id?: string;
          tier?: string;
          status?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          provider_event_id: string;
          event_type: string;
          payload: Json;
          received_at: string;
          processed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          provider: string;
          provider_event_id: string;
          event_type: string;
          payload: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          provider?: string;
          provider_event_id?: string;
          event_type?: string;
          payload?: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_entitlements: {
        Args: {
          p_user: string;
        };
        Returns: {
          tier: string;
          max_active_rooms: number | null;
          max_room_members: number | null;
        }[];
      };
    };
  };
}
