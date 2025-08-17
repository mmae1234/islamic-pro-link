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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          accused_id: string
          conversation_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          accused_id: string
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          accused_id?: string
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bio: string | null
          booking_url: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          languages: string[] | null
          linkedin_url: string | null
          logo_url: string | null
          name: string | null
          occupations: string[] | null
          owner_id: string
          phone: string | null
          postal_code: string | null
          sector: string | null
          services: string | null
          state: string | null
          status: string
          telegram_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          verified: boolean
          website: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          occupations?: string[] | null
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          status?: string
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          occupations?: string[] | null
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          status?: string
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_business_members_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_business_members_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_business_members_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_directory_internal"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          message: string | null
          skills_requested: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          message?: string | null
          skills_requested?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          message?: string | null
          skills_requested?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentorship_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          request_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          request_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          request_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          archived_at: string | null
          content: string
          conversation_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          report_reason: string | null
          reported_at: string | null
          request_id: string | null
          sender_id: string
        }
        Insert: {
          archived_at?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          report_reason?: string | null
          reported_at?: string | null
          request_id?: string | null
          sender_id: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          report_reason?: string | null
          reported_at?: string | null
          request_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      professional_business_links: {
        Row: {
          business_id: string
          created_at: string
          id: string
          professional_user_id: string
          role_title: string | null
          status: Database["public"]["Enums"]["link_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          professional_user_id: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["link_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          professional_user_id?: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["link_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_links_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_links_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_links_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_directory_internal"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          experience_years: number | null
          facebook_url: string | null
          first_name: string | null
          gender: string | null
          id: string
          instagram_url: string | null
          is_mentor: boolean | null
          is_seeking_mentor: boolean | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          occupation: string | null
          preferred_communication: string[] | null
          sector: string | null
          skills: string[] | null
          state_province: string | null
          telegram_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          university: string | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          experience_years?: number | null
          facebook_url?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_url?: string | null
          is_mentor?: boolean | null
          is_seeking_mentor?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          occupation?: string | null
          preferred_communication?: string[] | null
          sector?: string | null
          skills?: string[] | null
          state_province?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          experience_years?: number | null
          facebook_url?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_url?: string | null
          is_mentor?: boolean | null
          is_seeking_mentor?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          occupation?: string | null
          preferred_communication?: string[] | null
          sector?: string | null
          skills?: string[] | null
          state_province?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_profiles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          ip_address: unknown | null
          user_agent: string | null
          viewed_at: string
          viewed_profile_id: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
          viewed_profile_id: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
          viewed_profile_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_login: boolean
          first_name: string | null
          id: string
          last_name: string | null
          messaging_privacy: Database["public"]["Enums"]["messaging_privacy"]
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_login?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_login?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signup_events: {
        Row: {
          account_type: string | null
          created_at: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          created_at?: string
          id?: string
          source: string
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          created_at?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_message_limits: {
        Row: {
          created_at: string
          date: string
          id: string
          requests_declined: number
          requests_sent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          requests_declined?: number
          requests_sent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          requests_declined?: number
          requests_sent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_directory: {
        Row: {
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          sector: string | null
          services: string | null
          state: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      business_directory_internal: {
        Row: {
          bio: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string | null
          sector: string | null
          services: string | null
          state: string | null
          status: string | null
          telegram_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          verified: boolean | null
          website: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          status?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          services?: string | null
          state?: string | null
          status?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      professional_directory: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          experience_years: number | null
          first_name: string | null
          id: string | null
          is_mentor: boolean | null
          is_seeking_mentor: boolean | null
          last_name: string | null
          occupation: string | null
          sector: string | null
          skills: string[] | null
          state_province: string | null
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          first_name?: string | null
          id?: string | null
          is_mentor?: boolean | null
          is_seeking_mentor?: boolean | null
          last_name?: string | null
          occupation?: string | null
          sector?: string | null
          skills?: string[] | null
          state_province?: string | null
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          first_name?: string | null
          id?: string | null
          is_mentor?: boolean | null
          is_seeking_mentor?: boolean | null
          last_name?: string | null
          occupation?: string | null
          sector?: string | null
          skills?: string[] | null
          state_province?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "professional_profiles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_guest_profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_send_message: {
        Args: { recipient_id_param: string; sender_id_param: string }
        Returns: string
      }
      check_message_rate_limit: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      consolidate_conversations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_account: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_or_create_conversation: {
        Args: { user_a_param: string; user_b_param: string }
        Returns: string
      }
      has_active_mentorship: {
        Args: { user_a_param: string; user_b_param: string }
        Returns: boolean
      }
      has_business_role_safe: {
        Args: {
          _business_id: string
          _roles: Database["public"]["Enums"]["business_member_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_owner_safe: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_business_team_member_safe: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      business_member_role: "admin" | "editor" | "viewer"
      conversation_status: "request" | "active" | "blocked"
      link_status: "pending" | "approved" | "rejected"
      messaging_privacy: "open" | "mentorship_only" | "closed"
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
      business_member_role: ["admin", "editor", "viewer"],
      conversation_status: ["request", "active", "blocked"],
      link_status: ["pending", "approved", "rejected"],
      messaging_privacy: ["open", "mentorship_only", "closed"],
    },
  },
} as const
