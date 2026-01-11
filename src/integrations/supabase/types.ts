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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chess_games: {
        Row: {
          black_palette: Json | null
          black_player_id: string | null
          black_time_remaining: number | null
          challenge_code: string | null
          completed_at: string | null
          created_at: string
          current_fen: string | null
          id: string
          is_public: boolean | null
          last_move_at: string | null
          move_count: number | null
          pgn: string | null
          result: Database["public"]["Enums"]["chess_game_result"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["chess_game_status"]
          time_control: Database["public"]["Enums"]["time_control"]
          updated_at: string
          white_palette: Json | null
          white_player_id: string | null
          white_time_remaining: number | null
          winner_id: string | null
        }
        Insert: {
          black_palette?: Json | null
          black_player_id?: string | null
          black_time_remaining?: number | null
          challenge_code?: string | null
          completed_at?: string | null
          created_at?: string
          current_fen?: string | null
          id?: string
          is_public?: boolean | null
          last_move_at?: string | null
          move_count?: number | null
          pgn?: string | null
          result?: Database["public"]["Enums"]["chess_game_result"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["chess_game_status"]
          time_control?: Database["public"]["Enums"]["time_control"]
          updated_at?: string
          white_palette?: Json | null
          white_player_id?: string | null
          white_time_remaining?: number | null
          winner_id?: string | null
        }
        Update: {
          black_palette?: Json | null
          black_player_id?: string | null
          black_time_remaining?: number | null
          challenge_code?: string | null
          completed_at?: string | null
          created_at?: string
          current_fen?: string | null
          id?: string
          is_public?: boolean | null
          last_move_at?: string | null
          move_count?: number | null
          pgn?: string | null
          result?: Database["public"]["Enums"]["chess_game_result"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["chess_game_status"]
          time_control?: Database["public"]["Enums"]["time_control"]
          updated_at?: string
          white_palette?: Json | null
          white_player_id?: string | null
          white_time_remaining?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      chess_moves: {
        Row: {
          created_at: string
          fen_after: string
          game_id: string
          id: string
          move_number: number
          move_san: string
          move_uci: string
          player_id: string
          time_spent: number | null
        }
        Insert: {
          created_at?: string
          fen_after: string
          game_id: string
          id?: string
          move_number: number
          move_san: string
          move_uci: string
          player_id: string
          time_spent?: number | null
        }
        Update: {
          created_at?: string
          fen_after?: string
          game_id?: string
          id?: string
          move_number?: number
          move_san?: string
          move_uci?: string
          player_id?: string
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chess_moves_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "chess_games"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_designs: {
        Row: {
          created_at: string
          description: string | null
          fen: string
          id: string
          image_path: string | null
          is_public: boolean | null
          palette: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fen: string
          id?: string
          image_path?: string | null
          is_public?: boolean | null
          palette: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fen?: string
          id?: string
          image_path?: string | null
          is_public?: boolean | null
          palette?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_games: {
        Row: {
          created_at: string
          game_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          elo_rating: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          elo_rating?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          elo_rating?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_palettes: {
        Row: {
          black_colors: Json
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
          white_colors: Json
        }
        Insert: {
          black_colors: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
          white_colors: Json
        }
        Update: {
          black_colors?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          white_colors?: Json
        }
        Relationships: []
      }
      saved_visualizations: {
        Row: {
          created_at: string
          game_data: Json
          id: string
          image_path: string
          pgn: string | null
          public_share_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_data: Json
          id?: string
          image_path: string
          pgn?: string | null
          public_share_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_data?: Json
          id?: string
          image_path?: string
          pgn?: string | null
          public_share_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          display_name: string
          featured: boolean
          id: string
          quote: string
          rating: number
          role_title: string
          status: Database["public"]["Enums"]["testimonial_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          featured?: boolean
          id?: string
          quote: string
          rating?: number
          role_title: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          featured?: boolean
          id?: string
          quote?: string
          rating?: number
          role_title?: string
          status?: Database["public"]["Enums"]["testimonial_status"]
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
      generate_challenge_code: { Args: never; Returns: string }
      generate_share_id: { Args: never; Returns: string }
    }
    Enums: {
      chess_game_result: "white_wins" | "black_wins" | "draw" | "abandoned"
      chess_game_status: "waiting" | "active" | "completed" | "abandoned"
      testimonial_status: "pending" | "approved" | "rejected"
      time_control: "bullet_1" | "blitz_5" | "rapid_15" | "untimed"
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
      chess_game_result: ["white_wins", "black_wins", "draw", "abandoned"],
      chess_game_status: ["waiting", "active", "completed", "abandoned"],
      testimonial_status: ["pending", "approved", "rejected"],
      time_control: ["bullet_1", "blitz_5", "rapid_15", "untimed"],
    },
  },
} as const
