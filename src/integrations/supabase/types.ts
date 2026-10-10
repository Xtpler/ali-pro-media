export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts_market: {
        Row: {
          account_details: string | null;
          created_at: string | null;
          description: string | null;
          followers_count: number | null;
          id: string;
          images: string[] | null;
          platform: string;
          price: number;
          seller_id: string | null;
          status: string | null;
          title: string;
        };
        Insert: {
          account_details?: string | null;
          created_at?: string | null;
          description?: string | null;
          followers_count?: number | null;
          id?: string;
          images?: string[] | null;
          platform: string;
          price: number;
          seller_id?: string | null;
          status?: string | null;
          title: string;
        };
        Update: {
          account_details?: string | null;
          created_at?: string | null;
          description?: string | null;
          followers_count?: number | null;
          id?: string;
          images?: string[] | null;
          platform?: string;
          price?: number;
          seller_id?: string | null;
          status?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          message: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          message?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          message?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          badge_text: string | null;
          button_text: string | null;
          button_url: string | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          subtitle: string | null;
          title: string;
        };
        Insert: {
          badge_text?: string | null;
          button_text?: string | null;
          button_url?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          subtitle?: string | null;
          title: string;
        };
        Update: {
          badge_text?: string | null;
          button_text?: string | null;
          button_url?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          subtitle?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      card_categories: {
        Row: {
          created_at: string | null;
          icon: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      card_codes: {
        Row: {
          card_id: string | null;
          code_value: string;
          created_at: string | null;
          id: string;
          is_used: boolean | null;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          card_id?: string | null;
          code_value: string;
          created_at?: string | null;
          id?: string;
          is_used?: boolean | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          card_id?: string | null;
          code_value?: string;
          created_at?: string | null;
          id?: string;
          is_used?: boolean | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "card_codes_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "digital_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          platform: string;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          platform: string;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          platform?: string;
        };
        Relationships: [];
      };
      deposit_requests: {
        Row: {
          admin_note: string | null;
          admin_notes: string | null;
          amount: number | null;
          amount_iqd: number | null;
          created_at: string | null;
          gateway: string | null;
          gateway_label: string | null;
          id: string;
          notes: string | null;
          payment_method: string | null;
          proof_image: string | null;
          receipt_url: string | null;
          reviewed_at: string | null;
          sender_note: string | null;
          sender_phone: string | null;
          status: string | null;
          transaction_ref: string | null;
          updated_at: string;
          user_email: string | null;
          user_id: string;
          user_name: string | null;
          user_phone: string | null;
        };
        Insert: {
          admin_note?: string | null;
          admin_notes?: string | null;
          amount?: number | null;
          amount_iqd?: number | null;
          created_at?: string | null;
          gateway?: string | null;
          gateway_label?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          proof_image?: string | null;
          receipt_url?: string | null;
          reviewed_at?: string | null;
          sender_note?: string | null;
          sender_phone?: string | null;
          status?: string | null;
          transaction_ref?: string | null;
          updated_at?: string;
          user_email?: string | null;
          user_id: string;
          user_name?: string | null;
          user_phone?: string | null;
        };
        Update: {
          admin_note?: string | null;
          admin_notes?: string | null;
          amount?: number | null;
          amount_iqd?: number | null;
          created_at?: string | null;
          gateway?: string | null;
          gateway_label?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          proof_image?: string | null;
          receipt_url?: string | null;
          reviewed_at?: string | null;
          sender_note?: string | null;
          sender_phone?: string | null;
          status?: string | null;
          transaction_ref?: string | null;
          updated_at?: string;
          user_email?: string | null;
          user_id?: string;
          user_name?: string | null;
          user_phone?: string | null;
        };
        Relationships: [];
      };
      deposits: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          proof_image_url: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          proof_image_url?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          proof_image_url?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      digital_cards: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          price: number;
          title: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          price: number;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          price?: number;
          title?: string;
        };
        Relationships: [];
      };
      electronic_cards: {
        Row: {
          category_id: string | null;
          code_data: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean | null;
          price: number;
          title: string;
        };
        Insert: {
          category_id?: string | null;
          code_data?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          price: number;
          title: string;
        };
        Update: {
          category_id?: string | null;
          code_data?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          price?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "electronic_cards_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "card_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      hero_slides: {
        Row: {
          button_text: string | null;
          button_url: string | null;
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          media_type: string | null;
          media_url: string;
          subtitle: string | null;
          title: string;
        };
        Insert: {
          button_text?: string | null;
          button_url?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          media_type?: string | null;
          media_url: string;
          subtitle?: string | null;
          title: string;
        };
        Update: {
          button_text?: string | null;
          button_url?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          media_type?: string | null;
          media_url?: string;
          subtitle?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          audience: string;
          created_at: string;
          id: string;
          kind: string;
          message: string;
          read: boolean;
          title: string;
          user_id: string | null;
        };
        Insert: {
          audience?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
          read?: boolean;
          title?: string;
          user_id?: string | null;
        };
        Update: {
          audience?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
          read?: boolean;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          account_id: string | null;
          card_id: string | null;
          created_at: string | null;
          delivered_data: string | null;
          id: string;
          order_type: string;
          quantity: number | null;
          service_id: string | null;
          status: string | null;
          target_link: string | null;
          total_price: number;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          card_id?: string | null;
          created_at?: string | null;
          delivered_data?: string | null;
          id?: string;
          order_type: string;
          quantity?: number | null;
          service_id?: string | null;
          status?: string | null;
          target_link?: string | null;
          total_price: number;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          card_id?: string | null;
          created_at?: string | null;
          delivered_data?: string | null;
          id?: string;
          order_type?: string;
          quantity?: number | null;
          service_id?: string | null;
          status?: string | null;
          target_link?: string | null;
          total_price?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts_market";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "digital_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          balance: number | null;
          balance_iqd: number | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          is_banned: boolean | null;
          phone: string | null;
          phone_number: string | null;
          referral_code: string | null;
          referred_by: string | null;
          role: string | null;
          updated_at: string | null;
          wallet_balance: number | null;
          wallet_balance_iqd: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          balance?: number | null;
          balance_iqd?: number | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_banned?: boolean | null;
          phone?: string | null;
          phone_number?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: string | null;
          updated_at?: string | null;
          wallet_balance?: number | null;
          wallet_balance_iqd?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          balance?: number | null;
          balance_iqd?: number | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_banned?: boolean | null;
          phone?: string | null;
          phone_number?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: string | null;
          updated_at?: string | null;
          wallet_balance?: number | null;
          wallet_balance_iqd?: number | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          max_quantity: number | null;
          min_quantity: number | null;
          name: string;
          platform: string | null;
          price_per_1000: number;
          service_type: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_quantity?: number | null;
          min_quantity?: number | null;
          name: string;
          platform?: string | null;
          price_per_1000: number;
          service_type?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_quantity?: number | null;
          min_quantity?: number | null;
          name?: string;
          platform?: string | null;
          price_per_1000?: number;
          service_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          closed_at: string | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          message: string;
          proof_image_url: string | null;
          response: string | null;
          status: string | null;
          subject: string;
          updated_at: string;
          user_avatar_url: string | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
          user_phone: string | null;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          message: string;
          proof_image_url?: string | null;
          response?: string | null;
          status?: string | null;
          subject: string;
          updated_at?: string;
          user_avatar_url?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          user_phone?: string | null;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          message?: string;
          proof_image_url?: string | null;
          response?: string | null;
          status?: string | null;
          subject?: string;
          updated_at?: string;
          user_avatar_url?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          user_phone?: string | null;
        };
        Relationships: [];
      };
      ticket_replies: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          is_admin_reply: boolean;
          message: string;
          ticket_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string;
          is_admin_reply?: boolean;
          message?: string;
          ticket_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          is_admin_reply?: boolean;
          message?: string;
          ticket_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      unban_requests: {
        Row: {
          admin_notes: string | null;
          contact_phone: string | null;
          created_at: string | null;
          description: string;
          email: string | null;
          id: string;
          platform: string;
          proof_url: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description: string;
          email?: string | null;
          id?: string;
          platform: string;
          proof_url?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string;
          email?: string | null;
          id?: string;
          platform?: string;
          proof_url?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          role: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          role?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          role?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      vouchers: {
        Row: {
          active: boolean;
          amount_iqd: number;
          code: string;
          created_at: string;
          id: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          active?: boolean;
          amount_iqd?: number;
          code: string;
          created_at?: string;
          id?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          active?: boolean;
          amount_iqd?: number;
          code?: string;
          created_at?: string;
          id?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          description: string | null;
          id: string;
          reference_id: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reference_id?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reference_id?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_adjust_wallet: {
        Args: { _amount: number; _reason?: string; _user_id?: string };
        Returns: Json;
      };
      approve_unban_request: {
        Args: { p_request_id: string; p_user_id: string };
        Returns: undefined;
      };
      deduct_wallet_balance: {
        Args: { p_amount: number; p_description: string; p_user_id: string };
        Returns: boolean;
      };
      generate_unique_referral_code: { Args: never; Returns: string };
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean };
      is_staff: { Args: { _uid: string }; Returns: boolean };
      review_deposit: {
        Args: { _approve: boolean; _deposit_id: string; _note?: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
