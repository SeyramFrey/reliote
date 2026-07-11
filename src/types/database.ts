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
      architect_profiles: {
        Row: {
          anon_handle: string | null
          availability: Database["public"]["Enums"]["availability_status"]
          charter_signed_at: string | null
          charter_version: string | null
          city: string
          country: string
          created_at: string
          description: string
          diploma: string | null
          email: string
          fee_amount: number | null
          fee_currency: Database["public"]["Enums"]["fee_currency"] | null
          first_name: string
          id: string
          languages: string[]
          last_name: string
          ordre_number: string | null
          phone: string | null
          photo_url: string | null
          portfolio_url: string | null
          project_types: Database["public"]["Enums"]["project_type"][]
          rating: number | null
          specialties: string[]
          status: Database["public"]["Enums"]["architect_status"]
          structure: string | null
          updated_at: string
          user_id: string | null
          years_experience: number
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_status"]
          city: string
          country?: string
          created_at?: string
          description: string
          diploma?: string | null
          email: string
          fee_amount?: number | null
          fee_currency?: Database["public"]["Enums"]["fee_currency"] | null
          first_name: string
          id?: string
          languages?: string[]
          last_name: string
          ordre_number?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          project_types?: Database["public"]["Enums"]["project_type"][]
          rating?: number | null
          specialties?: string[]
          status?: Database["public"]["Enums"]["architect_status"]
          structure?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience: number
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_status"]
          city?: string
          country?: string
          created_at?: string
          description?: string
          diploma?: string | null
          email?: string
          fee_amount?: number | null
          fee_currency?: Database["public"]["Enums"]["fee_currency"] | null
          first_name?: string
          id?: string
          languages?: string[]
          last_name?: string
          ordre_number?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          project_types?: Database["public"]["Enums"]["project_type"][]
          rating?: number | null
          specialties?: string[]
          status?: Database["public"]["Enums"]["architect_status"]
          structure?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "architect_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          budget_range: string | null
          client_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          project_description: string
          project_location: string
          project_type: Database["public"]["Enums"]["project_type"]
          required_specialties: string[]
          status: Database["public"]["Enums"]["project_status"]
          timeline: string | null
          user_id: string | null
        }
        Insert: {
          budget_range?: string | null
          client_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_description: string
          project_location: string
          project_type: Database["public"]["Enums"]["project_type"]
          required_specialties?: string[]
          status?: Database["public"]["Enums"]["project_status"]
          timeline?: string | null
          user_id?: string | null
        }
        Update: {
          budget_range?: string | null
          client_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_description?: string
          project_location?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          required_specialties?: string[]
          status?: Database["public"]["Enums"]["project_status"]
          timeline?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_engagements: {
        Row: {
          architect_id: string
          charter_accepted: boolean
          charter_version: string | null
          engaged_at: string | null
          id: string
          notes: string | null
          project_id: string
          proposed_at: string
          status: Database["public"]["Enums"]["engagement_status"]
        }
        Insert: {
          architect_id: string
          charter_accepted?: boolean
          charter_version?: string | null
          engaged_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          proposed_at?: string
          status?: Database["public"]["Enums"]["engagement_status"]
        }
        Update: {
          architect_id?: string
          charter_accepted?: boolean
          charter_version?: string | null
          engaged_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          proposed_at?: string
          status?: Database["public"]["Enums"]["engagement_status"]
        }
        Relationships: []
      }
      engagement_relays: {
        Row: {
          architect_relay: string
          client_relay: string
          created_at: string
          engagement_id: string
        }
        Insert: {
          architect_relay: string
          client_relay: string
          created_at?: string
          engagement_id: string
        }
        Update: {
          architect_relay?: string
          client_relay?: string
          created_at?: string
          engagement_id?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          architect_id: string
          created_at: string
          id: string
          project_id: string
          reasons: Json
          score: number
        }
        Insert: {
          architect_id: string
          created_at?: string
          id?: string
          project_id: string
          reasons?: Json
          score: number
        }
        Update: {
          architect_id?: string
          created_at?: string
          id?: string
          project_id?: string
          reasons?: Json
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          locale: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      user_role_for_current: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      architect_status: "pending" | "verified" | "rejected" | "paused"
      availability_status: "available" | "busy" | "unavailable"
      engagement_status: "proposed" | "engaged" | "declined" | "cancelled" | "expired"
      fee_currency: "EUR" | "XOF"
      project_status: "new" | "matched" | "in_review" | "closed"
      project_type:
        | "residential"
        | "hospitality"
        | "commercial"
        | "urban"
        | "cultural"
        | "other"
      user_role: "client" | "architect" | "admin"
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
  public: {
    Enums: {
      architect_status: ["pending", "verified", "rejected", "paused"],
      availability_status: ["available", "busy", "unavailable"],
      engagement_status: ["proposed", "engaged", "declined", "cancelled", "expired"],
      fee_currency: ["EUR", "XOF"],
      project_status: ["new", "matched", "in_review", "closed"],
      project_type: [
        "residential",
        "hospitality",
        "commercial",
        "urban",
        "cultural",
        "other",
      ],
      user_role: ["client", "architect", "admin"],
    },
  },
} as const

