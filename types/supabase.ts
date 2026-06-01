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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          artist_id: string
          canonical_album_id: string | null
          cover_url: string | null
          created_at: string | null
          genre: string[] | null
          id: string
          release_date: string | null
          title: string
        }
        Insert: {
          artist_id: string
          canonical_album_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          genre?: string[] | null
          id?: string
          release_date?: string | null
          title: string
        }
        Update: {
          artist_id?: string
          canonical_album_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          genre?: string[] | null
          id?: string
          release_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_canonical_album_id_fkey"
            columns: ["canonical_album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      chart_entries: {
        Row: {
          airplay: number | null
          current_week_points: number | null
          id: string
          is_new_peak: boolean | null
          is_repeak: boolean | null
          peak_position: number
          peak_streak: number | null
          previous_position: number | null
          previous_week_raw_points: number | null
          rank: number
          sales: number | null
          song_id: string
          streams: number | null
          total_points: number | null
          two_weeks_ago_raw_points: number | null
          week_id: string
          weeks_on_chart: number
        }
        Insert: {
          airplay?: number | null
          current_week_points?: number | null
          id?: string
          is_new_peak?: boolean | null
          is_repeak?: boolean | null
          peak_position: number
          peak_streak?: number | null
          previous_position?: number | null
          previous_week_raw_points?: number | null
          rank: number
          sales?: number | null
          song_id: string
          streams?: number | null
          total_points?: number | null
          two_weeks_ago_raw_points?: number | null
          week_id: string
          weeks_on_chart: number
        }
        Update: {
          airplay?: number | null
          current_week_points?: number | null
          id?: string
          is_new_peak?: boolean | null
          is_repeak?: boolean | null
          peak_position?: number
          peak_streak?: number | null
          previous_position?: number | null
          previous_week_raw_points?: number | null
          rank?: number
          sales?: number | null
          song_id?: string
          streams?: number | null
          total_points?: number | null
          two_weeks_ago_raw_points?: number | null
          week_id?: string
          weeks_on_chart?: number
        }
        Relationships: [
          {
            foreignKeyName: "chart_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_entries_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "chart_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_weeks: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
        }
        Relationships: []
      }
      scrobbles: {
        Row: {
          id: string
          listened_at: string
          song_id: string
        }
        Insert: {
          id?: string
          listened_at: string
          song_id: string
        }
        Update: {
          id?: string
          listened_at?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrobbles_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album_id: string
          artist_id: string
          canonical_song_id: string | null
          created_at: string | null
          genre: string[] | null
          id: string
          release_date: string | null
          title: string
        }
        Insert: {
          album_id: string
          artist_id: string
          canonical_song_id?: string | null
          created_at?: string | null
          genre?: string[] | null
          id?: string
          release_date?: string | null
          title: string
        }
        Update: {
          album_id?: string
          artist_id?: string
          canonical_song_id?: string | null
          created_at?: string | null
          genre?: string[] | null
          id?: string
          release_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_canonical_song_id_fkey"
            columns: ["canonical_song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      all_time_song_stats: {
        Row: {
          peak_rank: number | null
          song_id: string | null
          total_all_time_points: number | null
          total_all_time_streams: number | null
          total_weeks_on_chart: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
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
    Enums: {},
  },
} as const
