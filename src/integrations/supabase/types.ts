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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          accused_id: string
          admin_note: string | null
          business_id: string | null
          conversation_id: string | null
          created_at: string
          details: string | null
          event_id: string | null
          evidence: Json | null
          id: string
          message_id: string | null
          opportunity_id: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          accused_id: string
          admin_note?: string | null
          business_id?: string | null
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          event_id?: string | null
          evidence?: Json | null
          id?: string
          message_id?: string | null
          opportunity_id?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          accused_id?: string
          admin_note?: string | null
          business_id?: string | null
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          event_id?: string | null
          evidence?: Json | null
          id?: string
          message_id?: string | null
          opportunity_id?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "org_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
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
          kind: string
          languages: string[] | null
          linkedin_url: string | null
          logo_url: string | null
          name: string | null
          occupations: string[] | null
          org_type: string | null
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
          kind?: string
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          occupations?: string[] | null
          org_type?: string | null
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
          kind?: string
          languages?: string[] | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string | null
          occupations?: string[] | null
          org_type?: string | null
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
        ]
      }
      conversation_hides: {
        Row: {
          hidden_before: string
          partner_id: string
          user_id: string
        }
        Insert: {
          hidden_before?: string
          partner_id: string
          user_id: string
        }
        Update: {
          hidden_before?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          requested_by: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_by?: string | null
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
          business_id: string | null
          created_at: string
          id: string
          professional_id: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          professional_id?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          professional_id?: string | null
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
      image_approvals: {
        Row: {
          approved_at: string
          object_id: string
          owner_id: string
          path: string
        }
        Insert: {
          approved_at?: string
          object_id: string
          owner_id: string
          path: string
        }
        Update: {
          approved_at?: string
          object_id?: string
          owner_id?: string
          path?: string
        }
        Relationships: []
      }
      member_suspensions: {
        Row: {
          reason: string | null
          suspended_at: string
          suspended_by: string | null
          user_id: string
        }
        Insert: {
          reason?: string | null
          suspended_at?: string
          suspended_by?: string | null
          user_id: string
        }
        Update: {
          reason?: string | null
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string
        }
        Relationships: []
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
      message_hides: {
        Row: {
          hidden_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_hides_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      opportunities: {
        Row: {
          apply_url: string | null
          business_id: string
          city: string | null
          closes_on: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hidden: boolean
          id: string
          kind: string
          pay: string | null
          state: string | null
          title: string
          updated_at: string
          workplace: string
        }
        Insert: {
          apply_url?: string | null
          business_id: string
          city?: string | null
          closes_on?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          pay?: string | null
          state?: string | null
          title: string
          updated_at?: string
          workplace?: string
        }
        Update: {
          apply_url?: string | null
          business_id?: string
          city?: string | null
          closes_on?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          pay?: string | null
          state?: string | null
          title?: string
          updated_at?: string
          workplace?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      org_events: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          hidden: boolean
          id: string
          mode: string
          org_id: string
          rsvp_url: string | null
          starts_at: string
          state: string | null
          timezone: string
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          hidden?: boolean
          id?: string
          mode?: string
          org_id: string
          rsvp_url?: string | null
          starts_at: string
          state?: string | null
          timezone?: string
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          hidden?: boolean
          id?: string
          mode?: string
          org_id?: string
          rsvp_url?: string | null
          starts_at?: string
          state?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
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
          open_to: string[]
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
          verified_work_at: string | null
          verified_work_domain: string | null
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
          open_to?: string[]
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
          verified_work_at?: string | null
          verified_work_domain?: string | null
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
          open_to?: string[]
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
          verified_work_at?: string | null
          verified_work_domain?: string | null
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
          viewed_at: string
          viewed_profile_id: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          viewed_at?: string
          viewed_profile_id: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
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
          email_alerts: boolean
          first_login: boolean
          first_name: string | null
          id: string
          invite_code: string | null
          last_name: string | null
          messaging_privacy: Database["public"]["Enums"]["messaging_privacy"]
          public_preview: boolean
          referred_by: string | null
          role: string | null
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_alerts?: boolean
          first_login?: boolean
          first_name?: string | null
          id?: string
          invite_code?: string | null
          last_name?: string | null
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          public_preview?: boolean
          referred_by?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_alerts?: boolean
          first_login?: boolean
          first_name?: string | null
          id?: string
          invite_code?: string | null
          last_name?: string | null
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          public_preview?: boolean
          referred_by?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_email_codes: {
        Row: {
          attempts: number
          code_hash: string
          domain: string
          email: string
          expires_at: string
          sends_in_window: number
          sends_window_start: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          domain: string
          email: string
          expires_at: string
          sends_in_window?: number
          sends_window_start?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          domain?: string
          email?: string
          expires_at?: string
          sends_in_window?: number
          sends_window_start?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
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
      admin_list_organizations: {
        Args: never
        Returns: {
          city: string
          country: string
          created_at: string
          email: string
          id: string
          name: string
          org_type: string
          owner_name: string
          state: string
          verified: boolean
          website: string
        }[]
      }
      admin_set_business_verified: {
        Args: { _business_id: string; _verified: boolean }
        Returns: boolean
      }
      admin_set_event_hidden: {
        Args: { _event_id: string; _hidden: boolean }
        Returns: boolean
      }
      admin_set_opportunity_hidden: {
        Args: { _hidden: boolean; _id: string }
        Returns: boolean
      }
      admin_stats: { Args: never; Returns: Json }
      admin_update_report: {
        Args: { _note?: string; _report_id: string; _status: string }
        Returns: boolean
      }
      can_manage_listing: { Args: { _business_id: string }; Returns: boolean }
      can_manage_org: { Args: { _org_id: string }; Returns: boolean }
      can_send_message: {
        Args: { recipient_id_param: string; sender_id_param: string }
        Returns: string
      }
      can_view_profile: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      check_message_rate_limit: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      claim_invite: { Args: { _code: string }; Returns: boolean }
      confirm_work_email: { Args: { _code: string }; Returns: string }
      consolidate_conversations: { Args: never; Returns: undefined }
      delete_user_account: { Args: { user_id_param: string }; Returns: boolean }
      display_name: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      get_business_by_id: {
        Args: { _id: string }
        Returns: {
          bio: string
          city: string
          country: string
          created_at: string
          id: string
          kind: string
          logo_url: string
          name: string
          org_type: string
          sector: string
          services: string
          state: string
          verified: boolean
          website: string
        }[]
      }
      get_business_contact: {
        Args: { _business_id: string }
        Returns: {
          address_line1: string
          address_line2: string
          booking_url: string
          email: string
          facebook_url: string
          instagram_url: string
          linkedin_url: string
          owner_id: string
          phone: string
          postal_code: string
          telegram_url: string
          tiktok_url: string
          twitter_url: string
          whatsapp_number: string
          youtube_url: string
        }[]
      }
      get_business_owner_id: { Args: { _business_id: string }; Returns: string }
      get_business_sectors: {
        Args: never
        Returns: {
          sector: string
        }[]
      }
      get_business_team: {
        Args: { _business_id: string }
        Returns: {
          avatar_url: string
          first_name: string
          last_name: string
          occupation: string
          role_title: string
          user_id: string
        }[]
      }
      get_event: {
        Args: { _id: string }
        Returns: {
          address: string
          city: string
          country: string
          description: string
          ends_at: string
          id: string
          mode: string
          org_id: string
          org_logo_url: string
          org_name: string
          rsvp_url: string
          starts_at: string
          state: string
          timezone: string
          title: string
          venue_name: string
        }[]
      }
      get_member_profiles: { Args: { _user_ids: string[] }; Returns: Json[] }
      get_my_blocked_users: {
        Args: never
        Returns: {
          avatar_url: string
          blocked_id: string
          created_at: string
          display_name: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_my_invite: {
        Args: never
        Returns: {
          code: string
          joined: number
        }[]
      }
      get_or_create_conversation: {
        Args: { user_a_param: string; user_b_param: string }
        Returns: string
      }
      has_active_mentorship: {
        Args: { user_a_param: string; user_b_param: string }
        Returns: boolean
      }
      has_business_role: {
        Args: {
          _business_id: string
          _roles: Database["public"]["Enums"]["business_member_role"][]
          _user_id: string
        }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_business_owner_safe: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_business_team_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_business_team_member_safe: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_suspended: { Args: { _user_id: string }; Returns: boolean }
      list_events: {
        Args: { _include_past?: boolean; _limit?: number; _org_id?: string }
        Returns: {
          address: string
          city: string
          country: string
          description: string
          ends_at: string
          id: string
          mode: string
          org_id: string
          org_logo_url: string
          org_name: string
          rsvp_url: string
          starts_at: string
          state: string
          timezone: string
          title: string
          venue_name: string
        }[]
      }
      list_opportunities: {
        Args: {
          _business_id?: string
          _id?: string
          _kind?: string
          _limit?: number
          _search?: string
        }
        Returns: {
          apply_url: string
          business_id: string
          business_kind: string
          business_logo_url: string
          business_name: string
          city: string
          closes_on: string
          country: string
          created_at: string
          description: string
          id: string
          kind: string
          pay: string
          state: string
          title: string
          workplace: string
        }[]
      }
      list_organizations: {
        Args: {
          _city?: string
          _country?: string
          _limit?: number
          _org_type?: string
          _search?: string
          _state?: string
        }
        Returns: {
          bio: string
          city: string
          country: string
          id: string
          logo_url: string
          name: string
          org_type: string
          state: string
          upcoming_events: number
          website: string
        }[]
      }
      list_professional_directory: {
        Args: {
          _city?: string
          _country?: string
          _gender?: string
          _is_mentor?: boolean
          _is_seeking_mentor?: boolean
          _languages?: string[]
          _limit?: number
          _max_experience?: number
          _min_experience?: number
          _occupation?: string
          _offset?: number
          _open_to?: string[]
          _search?: string
          _sector?: string
          _skills?: string[]
          _state_province?: string
          _universities?: string[]
        }
        Returns: {
          avatar_url: string
          city: string
          country: string
          experience_years: number
          first_name: string
          is_mentor: boolean
          is_seeking_mentor: boolean
          last_name: string
          occupation: string
          open_to: string[]
          sector: string
          state_province: string
          user_id: string
        }[]
      }
      lookup_profile_basic: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          city: string
          country: string
          first_name: string
          last_name: string
          occupation: string
          sector: string
          user_id: string
        }[]
      }
      ping_org_approvals: {
        Args: { _mode: string; _org_id?: string }
        Returns: undefined
      }
      public_directory_preview: {
        Args: { _limit?: number }
        Returns: {
          city: string
          country: string
          first_name: string
          is_mentor: boolean
          last_initial: string
          occupation: string
          sector: string
          state_province: string
        }[]
      }
      public_profile_preview: {
        Args: { _user_id: string }
        Returns: {
          city: string
          country: string
          first_name: string
          is_mentor: boolean
          last_initial: string
          occupation: string
          sector: string
          state_province: string
        }[]
      }
      queue_email_alert: {
        Args: { _actor: string; _kind: string; _recipient: string }
        Returns: undefined
      }
      record_image_approval: {
        Args: { _owner: string; _path: string }
        Returns: undefined
      }
      remove_work_verification: { Args: never; Returns: undefined }
      request_mentorship: {
        Args: {
          _mentor_id: string
          _message: string
          _skills_requested?: string[]
        }
        Returns: string
      }
      run_member_digest: { Args: never; Returns: undefined }
      search_business_directory: {
        Args: {
          filter_city?: string
          filter_country?: string
          filter_sector?: string
          filter_state?: string
          result_limit?: number
          search_term?: string
          verified_only?: boolean
        }
        Returns: {
          bio: string
          city: string
          country: string
          created_at: string
          id: string
          logo_url: string
          name: string
          sector: string
          services: string
          state: string
          verified: boolean
          website: string
        }[]
      }
      send_message: {
        Args: { _content: string; _recipient_id: string }
        Returns: string
      }
      set_account_type: { Args: { _type: string }; Returns: undefined }
      update_conversation_status: {
        Args: { _conversation_id: string; _new_status: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
      app_role: ["admin", "moderator", "user"],
      business_member_role: ["admin", "editor", "viewer"],
      conversation_status: ["request", "active", "blocked"],
      link_status: ["pending", "approved", "rejected"],
      messaging_privacy: ["open", "mentorship_only", "closed"],
    },
  },
} as const
