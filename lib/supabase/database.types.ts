export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
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
      contributor_claims: {
        Row: {
          claimant_note: string | null
          created_at: string
          evidence_urls: string[]
          id: string
          project_contributor_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          year: number
        }
        Insert: {
          claimant_note?: string | null
          created_at?: string
          evidence_urls?: string[]
          id?: string
          project_contributor_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          year: number
        }
        Update: {
          claimant_note?: string | null
          created_at?: string
          evidence_urls?: string[]
          id?: string
          project_contributor_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contributor_claims_project_contributor_id_fkey"
            columns: ["project_contributor_id"]
            isOneToOne: false
            referencedRelation: "project_contributors"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          completed_at: string | null
          counts: Json
          errors: Json
          id: string
          source: string
          source_checksum: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          counts?: Json
          errors?: Json
          id?: string
          source: string
          source_checksum?: string | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          counts?: Json
          errors?: Json
          id?: string
          source?: string
          source_checksum?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      organization_technologies: {
        Row: {
          organization_id: string
          technology_id: string
        }
        Insert: {
          organization_id: string
          technology_id: string
        }
        Update: {
          organization_id?: string
          technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_technologies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_technologies_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_topics: {
        Row: {
          organization_id: string
          topic_id: string
        }
        Insert: {
          organization_id: string
          topic_id: string
        }
        Update: {
          organization_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_years: {
        Row: {
          archive_url: string | null
          organization_id: string
          project_count: number
          source_payload: Json
          year: number
        }
        Insert: {
          archive_url?: string | null
          organization_id: string
          project_count?: number
          source_payload?: Json
          year: number
        }
        Update: {
          archive_url?: string | null
          organization_id?: string
          project_count?: number
          source_payload?: Json
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_years_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active_years: number[]
          canonical_id: string | null
          category: string
          contact: Json
          created_at: string
          description: string
          first_time: boolean
          first_year: number | null
          id: string
          image_background_color: string | null
          image_url: string | null
          is_currently_active: boolean
          last_year: number | null
          legacy_id: string | null
          logo_r2_url: string | null
          name: string
          slug: string
          socials: Json
          source_payload: Json
          total_projects: number
          updated_at: string
          website: string | null
        }
        Insert: {
          active_years?: number[]
          canonical_id?: string | null
          category?: string
          contact?: Json
          created_at?: string
          description?: string
          first_time?: boolean
          first_year?: number | null
          id?: string
          image_background_color?: string | null
          image_url?: string | null
          is_currently_active?: boolean
          last_year?: number | null
          legacy_id?: string | null
          logo_r2_url?: string | null
          name: string
          slug: string
          socials?: Json
          source_payload?: Json
          total_projects?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          active_years?: number[]
          canonical_id?: string | null
          category?: string
          contact?: Json
          created_at?: string
          description?: string
          first_time?: boolean
          first_year?: number | null
          id?: string
          image_background_color?: string | null
          image_url?: string | null
          is_currently_active?: boolean
          last_year?: number | null
          legacy_id?: string | null
          logo_r2_url?: string | null
          name?: string
          slug?: string
          socials?: Json
          source_payload?: Json
          total_projects?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profile_links: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          label: string | null
          platform: string
          position: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          label?: string | null
          platform: string
          position?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          label?: string | null
          platform?: string
          position?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_public: boolean
          avatar_r2_key: string | null
          bio: string | null
          bio_public: boolean
          created_at: string
          display_name: string
          google_avatar_url: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_public?: boolean
          avatar_r2_key?: string | null
          bio?: string | null
          bio_public?: boolean
          created_at?: string
          display_name: string
          google_avatar_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_public?: boolean
          avatar_r2_key?: string | null
          bio?: string | null
          bio_public?: boolean
          created_at?: string
          display_name?: string
          google_avatar_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_contributors: {
        Row: {
          archived_name: string
          archived_profile_url: string | null
          created_at: string
          id: string
          ordinal: number
          project_id: string
        }
        Insert: {
          archived_name: string
          archived_profile_url?: string | null
          created_at?: string
          id?: string
          ordinal?: number
          project_id: string
        }
        Update: {
          archived_name?: string
          archived_profile_url?: string | null
          created_at?: string
          id?: string
          ordinal?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contributors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_mentors: {
        Row: {
          name: string
          ordinal: number
          project_id: string
        }
        Insert: {
          name: string
          ordinal?: number
          project_id: string
        }
        Update: {
          name?: string
          ordinal?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_mentors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_technologies: {
        Row: {
          project_id: string
          technology_id: string
        }
        Insert: {
          project_id: string
          technology_id: string
        }
        Update: {
          project_id?: string
          technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_technologies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_technologies_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          abstract_short: string | null
          code_url: string | null
          created_at: string
          external_id: string
          id: string
          info_html: string | null
          legacy_id: string | null
          organization_id: string
          project_url: string | null
          source_created_at: string | null
          source_payload: Json
          source_updated_at: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          abstract_short?: string | null
          code_url?: string | null
          created_at?: string
          external_id: string
          id?: string
          info_html?: string | null
          legacy_id?: string | null
          organization_id: string
          project_url?: string | null
          source_created_at?: string | null
          source_payload?: Json
          source_updated_at?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          abstract_short?: string | null
          code_url?: string | null
          created_at?: string
          external_id?: string
          id?: string
          info_html?: string | null
          legacy_id?: string | null
          organization_id?: string
          project_url?: string | null
          source_created_at?: string | null
          source_payload?: Json
          source_updated_at?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_files: {
        Row: {
          byte_size: number
          created_at: string
          etag: string | null
          id: string
          mime_type: string
          original_filename: string
          proposal_id: string
          r2_key: string
          sha256: string
          validation_error: string | null
          validation_status: Database["public"]["Enums"]["file_validation_status"]
          version: number
        }
        Insert: {
          byte_size: number
          created_at?: string
          etag?: string | null
          id?: string
          mime_type: string
          original_filename: string
          proposal_id: string
          r2_key: string
          sha256: string
          validation_error?: string | null
          validation_status: Database["public"]["Enums"]["file_validation_status"]
          version: number
        }
        Update: {
          byte_size?: number
          created_at?: string
          etag?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          proposal_id?: string
          r2_key?: string
          sha256?: string
          validation_error?: string | null
          validation_status?: Database["public"]["Enums"]["file_validation_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_files_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "approved_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_files_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          claim_id: string
          created_at: string
          current_file_id: string | null
          id: string
          license_accepted_at: string | null
          license_code: string | null
          license_version: string | null
          moderator_reason: string | null
          public_slug: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          current_file_id?: string | null
          id?: string
          license_accepted_at?: string | null
          license_code?: string | null
          license_version?: string | null
          moderator_reason?: string | null
          public_slug: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          current_file_id?: string | null
          id?: string
          license_accepted_at?: string | null
          license_code?: string | null
          license_version?: string | null
          moderator_reason?: string | null
          public_slug?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "contributor_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_current_file_fk"
            columns: ["current_file_id"]
            isOneToOne: false
            referencedRelation: "proposal_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_user_profile_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      technologies: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          converted_at: string | null
          created_at: string
          email: string
          id: string
          interests: string[]
          invited_at: string | null
          source: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          email: string
          id?: string
          interests?: string[]
          invited_at?: string | null
          source?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          interests?: string[]
          invited_at?: string | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      approved_proposals: {
        Row: {
          abstract_short: string | null
          approved_at: string | null
          archived_contributor_name: string | null
          avatar_r2_key: string | null
          bio: string | null
          display_name: string | null
          id: string | null
          license_code: string | null
          organization_name: string | null
          organization_slug: string | null
          pdf_byte_size: number | null
          pdf_sha256: string | null
          profile_links: Json | null
          project_external_id: string | null
          project_title: string | null
          public_slug: string | null
          year: number | null
        }
        Relationships: []
      }
      year_stats: {
        Row: {
          contributors: number | null
          organizations: number | null
          projects: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_users: { Args: never; Returns: Json }
      attach_proposal_file: {
        Args: {
          new_byte_size: number
          new_etag?: string
          new_file_id: string
          new_original_filename: string
          new_r2_key: string
          new_sha256: string
          target_proposal_id: string
          target_user_id: string
        }
        Returns: string
      }
      bootstrap_admin: { Args: { target_email: string }; Returns: undefined }
      consume_rate_limit: {
        Args: { requested_action: string }
        Returns: boolean
      }
      create_contributor_claim: {
        Args: {
          contributor_slot_id: string
          private_evidence_urls?: string[]
          private_note?: string
        }
        Returns: string
      }
      delete_my_draft: { Args: { target_proposal_id: string }; Returns: Json }
      get_moderation_events: {
        Args: { target_entity_id: string }
        Returns: Json
      }
      get_my_roles: { Args: never; Returns: string[] }
      moderate_proposal: {
        Args: {
          decision: string
          decision_reason?: string
          target_proposal_id: string
        }
        Returns: undefined
      }
      set_user_role: {
        Args: { enabled: boolean; target_role: string; target_user_id: string }
        Returns: undefined
      }
      submit_my_proposal: {
        Args: { target_proposal_id: string; target_user_id: string }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          new_avatar_public: boolean
          new_bio: string
          new_bio_public: boolean
          new_display_name: string
          new_links: Json
        }
        Returns: undefined
      }
      update_my_proposal_evidence: {
        Args: {
          private_evidence_urls: string[]
          private_note: string
          should_update_evidence: boolean
          should_update_note: boolean
          target_proposal_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "deleted"
      claim_status: "pending" | "verified" | "rejected"
      file_validation_status: "quarantined" | "valid" | "invalid" | "superseded"
      proposal_status:
        | "draft"
        | "pending"
        | "changes_requested"
        | "approved"
        | "rejected"
        | "withdrawn"
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
      account_status: ["active", "suspended", "deleted"],
      claim_status: ["pending", "verified", "rejected"],
      file_validation_status: ["quarantined", "valid", "invalid", "superseded"],
      proposal_status: [
        "draft",
        "pending",
        "changes_requested",
        "approved",
        "rejected",
        "withdrawn",
      ],
    },
  },
} as const
