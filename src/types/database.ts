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
          ordre_number: string
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
        ComputedFields: never
        Insert: {
          anon_handle?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          charter_signed_at?: string | null
          charter_version?: string | null
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
          ordre_number: string
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
          anon_handle?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          charter_signed_at?: string | null
          charter_version?: string | null
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
          ordre_number?: string
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
        ComputedFields: never
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
        Relationships: [
          {
            foreignKeyName: "client_engagements_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_engagements_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_engagements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          budget_range: string | null
          choice_requested_at: string | null
          client_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          project_country: string
          project_description: string
          project_location: string
          project_type: Database["public"]["Enums"]["project_type"]
          required_specialties: string[]
          status: Database["public"]["Enums"]["project_status"]
          timeline: string | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          budget_range?: string | null
          choice_requested_at?: string | null
          client_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_country: string
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
          choice_requested_at?: string | null
          client_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_country?: string
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
      engagement_relays: {
        Row: {
          architect_relay: string
          client_relay: string
          created_at: string
          engagement_id: string
        }
        ComputedFields: never
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
        Relationships: [
          {
            foreignKeyName: "engagement_relays_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: true
            referencedRelation: "client_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_projects: {
        Row: {
          cite: string | null
          coordinates: string | null
          created_at: string
          hotspots: NonNullable<Json>
          id: string
          location: string | null
          published: boolean
          quote_en: string | null
          quote_fr: string | null
          rows: NonNullable<Json>
          slides: NonNullable<Json>
          sort_order: number
          stats: NonNullable<Json>
          title_en: string
          title_fr: string
        }
        ComputedFields: never
        Insert: {
          cite?: string | null
          coordinates?: string | null
          created_at?: string
          hotspots?: NonNullable<Json>
          id?: string
          location?: string | null
          published?: boolean
          quote_en?: string | null
          quote_fr?: string | null
          rows?: NonNullable<Json>
          slides?: NonNullable<Json>
          sort_order?: number
          stats?: NonNullable<Json>
          title_en: string
          title_fr: string
        }
        Update: {
          cite?: string | null
          coordinates?: string | null
          created_at?: string
          hotspots?: NonNullable<Json>
          id?: string
          location?: string | null
          published?: boolean
          quote_en?: string | null
          quote_fr?: string | null
          rows?: NonNullable<Json>
          slides?: NonNullable<Json>
          sort_order?: number
          stats?: NonNullable<Json>
          title_en?: string
          title_fr?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          body_en: string
          body_fr: string
          created_at: string
          id: string
          published: boolean
          seo_description_en: string | null
          seo_description_fr: string | null
          slug: string
          sort_order: number
          title_en: string
          title_fr: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          body_en?: string
          body_fr?: string
          created_at?: string
          id?: string
          published?: boolean
          seo_description_en?: string | null
          seo_description_fr?: string | null
          slug: string
          sort_order?: number
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_fr?: string
          created_at?: string
          id?: string
          published?: boolean
          seo_description_en?: string | null
          seo_description_fr?: string | null
          slug?: string
          sort_order?: number
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          architect_id: string
          created_at: string
          id: string
          project_id: string
          reasons: NonNullable<Json>
          score: number
        }
        ComputedFields: never
        Insert: {
          architect_id: string
          created_at?: string
          id?: string
          project_id: string
          reasons?: NonNullable<Json>
          score: number
        }
        Update: {
          architect_id?: string
          created_at?: string
          id?: string
          project_id?: string
          reasons?: NonNullable<Json>
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
            foreignKeyName: "match_results_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles_anon"
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
      media_items: {
        Row: {
          created_at: string
          date: string | null
          excerpt_en: string | null
          excerpt_fr: string | null
          id: string
          image_url: string | null
          published: boolean
          read_time: string | null
          sort_order: number
          title_en: string
          title_fr: string
          url: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          date?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: string | null
          sort_order?: number
          title_en: string
          title_fr: string
          url?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: string | null
          sort_order?: number
          title_en?: string
          title_fr?: string
          url?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          architect_id: string
          charter_accepted: boolean
          created_at: string
          id: string
          notes: string | null
          project_id: string
          proposed_by: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          updated_at: string
          video_url: string | null
        }
        ComputedFields: never
        Insert: {
          architect_id: string
          charter_accepted?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          proposed_by?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["meeting_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          architect_id?: string
          charter_accepted?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          proposed_by?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          forwarded_from: string | null
          id: string
          message_id: string
          mime_type: string
          removed_at: string | null
          size_bytes: number
          storage_path: string
          thread_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          file_name: string
          forwarded_from?: string | null
          id?: string
          message_id: string
          mime_type: string
          removed_at?: string | null
          size_bytes: number
          storage_path: string
          thread_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          forwarded_from?: string | null
          id?: string
          message_id?: string
          mime_type?: string
          removed_at?: string | null
          size_bytes?: number
          storage_path?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_forwarded_from_fkey"
            columns: ["forwarded_from"]
            isOneToOne: false
            referencedRelation: "message_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_revisions: {
        Row: {
          action: string
          body: string
          id: string
          message_id: string
          revised_at: string
          revised_by: string | null
        }
        ComputedFields: never
        Insert: {
          action: string
          body: string
          id?: string
          message_id: string
          revised_at?: string
          revised_by?: string | null
        }
        Update: {
          action?: string
          body?: string
          id?: string
          message_id?: string
          revised_at?: string
          revised_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_revisions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_thread_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_thread_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          admin_notified_at: string | null
          architect_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at: string | null
          owner_notified_at: string | null
          project_id: string | null
        }
        ComputedFields: never
        Insert: {
          admin_notified_at?: string | null
          architect_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string | null
          owner_notified_at?: string | null
          project_id?: string | null
        }
        Update: {
          admin_notified_at?: string | null
          architect_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string | null
          owner_notified_at?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_architect_id_fkey"
            columns: ["architect_id"]
            isOneToOne: false
            referencedRelation: "architect_profiles_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string | null
          author_side: Database["public"]["Enums"]["message_side"]
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          thread_id: string
        }
        ComputedFields: never
        Insert: {
          author_id?: string | null
          author_side: Database["public"]["Enums"]["message_side"]
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string | null
          author_side?: Database["public"]["Enums"]["message_side"]
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
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
        ComputedFields: never
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
      architect_profiles_anon: {
        Row: {
          anon_handle: string | null
          availability:
            Database["public"]["Enums"]["availability_status"] | null
          diploma: string | null
          id: string | null
          languages: string[] | null
          project_types: Database["public"]["Enums"]["project_type"][] | null
          rating: number | null
          region: string | null
          specialties: string[] | null
          status: Database["public"]["Enums"]["architect_status"] | null
          years_bracket: string | null
        }
        ComputedFields: never
        Insert: {
          anon_handle?: string | null
          availability?:
            Database["public"]["Enums"]["availability_status"] | null
          diploma?: string | null
          id?: string | null
          languages?: string[] | null
          project_types?: Database["public"]["Enums"]["project_type"][] | null
          rating?: number | null
          region?: never
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["architect_status"] | null
          years_bracket?: never
        }
        Update: {
          anon_handle?: string | null
          availability?:
            Database["public"]["Enums"]["availability_status"] | null
          diploma?: string | null
          id?: string | null
          languages?: string[] | null
          project_types?: Database["public"]["Enums"]["project_type"][] | null
          rating?: number | null
          region?: never
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["architect_status"] | null
          years_bracket?: never
        }
        Relationships: []
      }
    }
    Functions: {
      message_unread_counts: {
        Args: {
          p_side: Database["public"]["Enums"]["message_side"]
          p_thread_ids: string[]
          p_user: string
        }
        Returns: {
          thread_id: string
          unread: number
        }[]
      }
    }
    Enums: {
      architect_status: "pending" | "verified" | "rejected" | "paused"
      availability_status: "available" | "busy" | "unavailable"
      engagement_status:
        "proposed" | "engaged" | "declined" | "cancelled" | "expired"
      fee_currency: "EUR" | "XOF"
      meeting_status:
        | "proposed"
        | "confirmed"
        | "declined"
        | "rescheduled"
        | "completed"
        | "cancelled"
      message_side: "admin" | "owner"
      project_status:
        | "new"
        | "matched"
        | "in_review"
        | "closed"
        | "selected"
        | "meeting_proposed"
        | "meeting_confirmed"
      project_type:
        | "residential"
        | "hospitality"
        | "commercial"
        | "urban"
        | "cultural"
        | "other"
      thread_kind:
        "project_client" | "project_architect" | "architect_admission"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      engagement_status: [
        "proposed",
        "engaged",
        "declined",
        "cancelled",
        "expired",
      ],
      fee_currency: ["EUR", "XOF"],
      meeting_status: [
        "proposed",
        "confirmed",
        "declined",
        "rescheduled",
        "completed",
        "cancelled",
      ],
      message_side: ["admin", "owner"],
      project_status: [
        "new",
        "matched",
        "in_review",
        "closed",
        "selected",
        "meeting_proposed",
        "meeting_confirmed",
      ],
      project_type: [
        "residential",
        "hospitality",
        "commercial",
        "urban",
        "cultural",
        "other",
      ],
      thread_kind: [
        "project_client",
        "project_architect",
        "architect_admission",
      ],
      user_role: ["client", "architect", "admin"],
    },
  },
} as const
