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
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          offense_count: number
          reason: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offense_count?: number
          reason: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          offense_count?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      book_generation_progress: {
        Row: {
          created_at: string
          game_index: number
          game_title: string
          haiku: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
          visualization_data: string | null
        }
        Insert: {
          created_at?: string
          game_index: number
          game_title: string
          haiku?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          visualization_data?: string | null
        }
        Update: {
          created_at?: string
          game_index?: number
          game_title?: string
          haiku?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          visualization_data?: string | null
        }
        Relationships: []
      }
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
      dmca_counter_notifications: {
        Row: {
          admin_notes: string | null
          created_at: string
          electronic_signature: string
          good_faith_statement: boolean
          id: string
          jurisdiction_consent: boolean
          notifier_address: string
          notifier_email: string
          notifier_name: string
          notifier_phone: string | null
          original_report_id: string | null
          original_takedown_description: string
          perjury_statement: boolean
          removed_content_description: string
          removed_content_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          electronic_signature: string
          good_faith_statement?: boolean
          id?: string
          jurisdiction_consent?: boolean
          notifier_address: string
          notifier_email: string
          notifier_name: string
          notifier_phone?: string | null
          original_report_id?: string | null
          original_takedown_description: string
          perjury_statement?: boolean
          removed_content_description: string
          removed_content_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          electronic_signature?: string
          good_faith_statement?: boolean
          id?: string
          jurisdiction_consent?: boolean
          notifier_address?: string
          notifier_email?: string
          notifier_name?: string
          notifier_phone?: string | null
          original_report_id?: string | null
          original_takedown_description?: string
          perjury_statement?: boolean
          removed_content_description?: string
          removed_content_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dmca_counter_notifications_original_report_id_fkey"
            columns: ["original_report_id"]
            isOneToOne: false
            referencedRelation: "dmca_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      dmca_reports: {
        Row: {
          accuracy_statement: boolean
          admin_notes: string | null
          copyrighted_work_description: string
          created_at: string
          electronic_signature: string
          good_faith_statement: boolean
          id: string
          infringing_material_description: string
          infringing_material_url: string
          reporter_address: string | null
          reporter_email: string
          reporter_name: string
          reporter_phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accuracy_statement?: boolean
          admin_notes?: string | null
          copyrighted_work_description: string
          created_at?: string
          electronic_signature: string
          good_faith_statement?: boolean
          id?: string
          infringing_material_description: string
          infringing_material_url: string
          reporter_address?: string | null
          reporter_email: string
          reporter_name: string
          reporter_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accuracy_statement?: boolean
          admin_notes?: string | null
          copyrighted_work_description?: string
          created_at?: string
          electronic_signature?: string
          good_faith_statement?: boolean
          id?: string
          infringing_material_description?: string
          infringing_material_url?: string
          reporter_address?: string | null
          reporter_email?: string
          reporter_name?: string
          reporter_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      education_fund: {
        Row: {
          created_at: string
          event_type: string
          forfeited_value_cents: number
          fund_contribution_cents: number
          id: string
          notes: string | null
          platform_fee_cents: number
          source_user_id: string | null
          visions_released: number
        }
        Insert: {
          created_at?: string
          event_type?: string
          forfeited_value_cents?: number
          fund_contribution_cents?: number
          id?: string
          notes?: string | null
          platform_fee_cents?: number
          source_user_id?: string | null
          visions_released?: number
        }
        Update: {
          created_at?: string
          event_type?: string
          forfeited_value_cents?: number
          fund_contribution_cents?: number
          id?: string
          notes?: string | null
          platform_fee_cents?: number
          source_user_id?: string | null
          visions_released?: number
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
      financial_trends: {
        Row: {
          created_at: string
          daily_book_revenue_cents: number | null
          daily_churned_subscribers: number | null
          daily_creator_royalties_cents: number | null
          daily_downloads: number | null
          daily_education_fund_cents: number | null
          daily_gamecard_pool_cents: number | null
          daily_lulu_costs_cents: number | null
          daily_marketplace_fee_cents: number | null
          daily_marketplace_sales: number | null
          daily_new_subscribers: number | null
          daily_new_users: number | null
          daily_palette_pool_cents: number | null
          daily_print_orders: number | null
          daily_print_revenue_cents: number | null
          daily_printify_costs_cents: number | null
          daily_shopify_fees_cents: number | null
          daily_stripe_fees_cents: number | null
          daily_subscription_revenue_cents: number | null
          daily_trades: number | null
          daily_views: number | null
          daily_visions_created: number | null
          date: string
          id: string
          total_gamecard_pool_value_cents: number | null
          total_market_cap_cents: number | null
          total_palette_pool_value_cents: number | null
        }
        Insert: {
          created_at?: string
          daily_book_revenue_cents?: number | null
          daily_churned_subscribers?: number | null
          daily_creator_royalties_cents?: number | null
          daily_downloads?: number | null
          daily_education_fund_cents?: number | null
          daily_gamecard_pool_cents?: number | null
          daily_lulu_costs_cents?: number | null
          daily_marketplace_fee_cents?: number | null
          daily_marketplace_sales?: number | null
          daily_new_subscribers?: number | null
          daily_new_users?: number | null
          daily_palette_pool_cents?: number | null
          daily_print_orders?: number | null
          daily_print_revenue_cents?: number | null
          daily_printify_costs_cents?: number | null
          daily_shopify_fees_cents?: number | null
          daily_stripe_fees_cents?: number | null
          daily_subscription_revenue_cents?: number | null
          daily_trades?: number | null
          daily_views?: number | null
          daily_visions_created?: number | null
          date?: string
          id?: string
          total_gamecard_pool_value_cents?: number | null
          total_market_cap_cents?: number | null
          total_palette_pool_value_cents?: number | null
        }
        Update: {
          created_at?: string
          daily_book_revenue_cents?: number | null
          daily_churned_subscribers?: number | null
          daily_creator_royalties_cents?: number | null
          daily_downloads?: number | null
          daily_education_fund_cents?: number | null
          daily_gamecard_pool_cents?: number | null
          daily_lulu_costs_cents?: number | null
          daily_marketplace_fee_cents?: number | null
          daily_marketplace_sales?: number | null
          daily_new_subscribers?: number | null
          daily_new_users?: number | null
          daily_palette_pool_cents?: number | null
          daily_print_orders?: number | null
          daily_print_revenue_cents?: number | null
          daily_printify_costs_cents?: number | null
          daily_shopify_fees_cents?: number | null
          daily_stripe_fees_cents?: number | null
          daily_subscription_revenue_cents?: number | null
          daily_trades?: number | null
          daily_views?: number | null
          daily_visions_created?: number | null
          date?: string
          id?: string
          total_gamecard_pool_value_cents?: number | null
          total_market_cap_cents?: number | null
          total_palette_pool_value_cents?: number | null
        }
        Relationships: []
      }
      flagged_content: {
        Row: {
          content_id: string | null
          content_image_url: string | null
          content_text: string | null
          content_type: string
          created_at: string
          id: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_image_url?: string | null
          content_text?: string | null
          content_type: string
          created_at?: string
          id?: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_image_url?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gamecard_value_pool: {
        Row: {
          base_value_cents: number
          created_at: string
          earned_value_cents: number
          game_id: string
          game_title: string
          id: string
          last_interaction_at: string | null
          rarity_tier: string
          total_interactions: number
          total_print_orders: number
          total_visions: number
          updated_at: string
        }
        Insert: {
          base_value_cents?: number
          created_at?: string
          earned_value_cents?: number
          game_id: string
          game_title: string
          id?: string
          last_interaction_at?: string | null
          rarity_tier?: string
          total_interactions?: number
          total_print_orders?: number
          total_visions?: number
          updated_at?: string
        }
        Update: {
          base_value_cents?: number
          created_at?: string
          earned_value_cents?: number
          game_id?: string
          game_title?: string
          id?: string
          last_interaction_at?: string | null
          rarity_tier?: string
          total_interactions?: number
          total_print_orders?: number
          total_visions?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_offers: {
        Row: {
          buyer_id: string
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          offer_cents: number
          parent_offer_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offer_cents: number
          parent_offer_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offer_cents?: number
          parent_offer_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "visualization_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_funnel_events: {
        Row: {
          converted_to_premium: boolean | null
          converted_to_signup: boolean | null
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          session_id: string | null
          trigger_source: string | null
          user_id: string | null
        }
        Insert: {
          converted_to_premium?: boolean | null
          converted_to_signup?: boolean | null
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          session_id?: string | null
          trigger_source?: string | null
          user_id?: string | null
        }
        Update: {
          converted_to_premium?: boolean | null
          converted_to_signup?: boolean | null
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          session_id?: string | null
          trigger_source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_financials: {
        Row: {
          created_at: string
          creator_royalty_cents: number
          education_fund_cents: number
          fulfillment_costs_cents: number
          game_id: string | null
          gamecard_pool_cents: number
          gross_revenue_cents: number
          id: string
          net_revenue_cents: number
          order_reference: string | null
          order_type: string
          palette_id: string | null
          palette_pool_cents: number
          platform_fees_cents: number
          user_id: string | null
          visualization_id: string | null
        }
        Insert: {
          created_at?: string
          creator_royalty_cents?: number
          education_fund_cents?: number
          fulfillment_costs_cents?: number
          game_id?: string | null
          gamecard_pool_cents?: number
          gross_revenue_cents?: number
          id?: string
          net_revenue_cents?: number
          order_reference?: string | null
          order_type: string
          palette_id?: string | null
          palette_pool_cents?: number
          platform_fees_cents?: number
          user_id?: string | null
          visualization_id?: string | null
        }
        Update: {
          created_at?: string
          creator_royalty_cents?: number
          education_fund_cents?: number
          fulfillment_costs_cents?: number
          game_id?: string | null
          gamecard_pool_cents?: number
          gross_revenue_cents?: number
          id?: string
          net_revenue_cents?: number
          order_reference?: string | null
          order_type?: string
          palette_id?: string | null
          palette_pool_cents?: number
          platform_fees_cents?: number
          user_id?: string | null
          visualization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_financials_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      palette_overrides: {
        Row: {
          black_colors: Json
          created_at: string
          id: string
          modified_by: string
          palette_id: string
          updated_at: string
          version: number
          white_colors: Json
        }
        Insert: {
          black_colors: Json
          created_at?: string
          id?: string
          modified_by: string
          palette_id: string
          updated_at?: string
          version?: number
          white_colors: Json
        }
        Update: {
          black_colors?: Json
          created_at?: string
          id?: string
          modified_by?: string
          palette_id?: string
          updated_at?: string
          version?: number
          white_colors?: Json
        }
        Relationships: []
      }
      palette_value_pool: {
        Row: {
          base_value_cents: number
          created_at: string
          earned_value_cents: number
          id: string
          last_interaction_at: string | null
          palette_id: string
          palette_name: string
          total_interactions: number
          total_print_orders: number
          total_visions_using: number
          updated_at: string
        }
        Insert: {
          base_value_cents?: number
          created_at?: string
          earned_value_cents?: number
          id?: string
          last_interaction_at?: string | null
          palette_id: string
          palette_name: string
          total_interactions?: number
          total_print_orders?: number
          total_visions_using?: number
          updated_at?: string
        }
        Update: {
          base_value_cents?: number
          created_at?: string
          earned_value_cents?: number
          id?: string
          last_interaction_at?: string | null
          palette_id?: string
          palette_name?: string
          total_interactions?: number
          total_print_orders?: number
          total_visions_using?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_financials: {
        Row: {
          book_order_revenue_cents: number
          created_at: string
          creator_royalties_cents: number
          education_fund_cents: number
          gamecard_pool_cents: number
          id: string
          lulu_costs_cents: number
          marketplace_fee_revenue_cents: number
          net_profit_cents: number
          palette_pool_cents: number
          period_end: string
          period_start: string
          print_order_revenue_cents: number
          printify_costs_cents: number
          shopify_fees_cents: number
          stripe_fees_cents: number
          subscription_revenue_cents: number
          updated_at: string
        }
        Insert: {
          book_order_revenue_cents?: number
          created_at?: string
          creator_royalties_cents?: number
          education_fund_cents?: number
          gamecard_pool_cents?: number
          id?: string
          lulu_costs_cents?: number
          marketplace_fee_revenue_cents?: number
          net_profit_cents?: number
          palette_pool_cents?: number
          period_end: string
          period_start: string
          print_order_revenue_cents?: number
          printify_costs_cents?: number
          shopify_fees_cents?: number
          stripe_fees_cents?: number
          subscription_revenue_cents?: number
          updated_at?: string
        }
        Update: {
          book_order_revenue_cents?: number
          created_at?: string
          creator_royalties_cents?: number
          education_fund_cents?: number
          gamecard_pool_cents?: number
          id?: string
          lulu_costs_cents?: number
          marketplace_fee_revenue_cents?: number
          net_profit_cents?: number
          palette_pool_cents?: number
          period_end?: string
          period_start?: string
          print_order_revenue_cents?: number
          printify_costs_cents?: number
          shopify_fees_cents?: number
          stripe_fees_cents?: number
          subscription_revenue_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      premium_analytics: {
        Row: {
          analytics_type: string
          created_at: string
          data: Json
          expires_at: string
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          analytics_type: string
          created_at?: string
          data?: Json
          expires_at?: string
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analytics_type?: string
          created_at?: string
          data?: Json
          expires_at?: string
          generated_at?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      scan_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          confidence: number | null
          id: string
          image_preview: string | null
          matched: boolean
          scanned_at: string
          user_id: string | null
          visualization_id: string | null
        }
        Insert: {
          confidence?: number | null
          id?: string
          image_preview?: string | null
          matched?: boolean
          scanned_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Update: {
          confidence?: number | null
          id?: string
          image_preview?: string | null
          matched?: boolean
          scanned_at?: string
          user_id?: string | null
          visualization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action_category: string
          action_type: string
          admin_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_category?: string
          action_type: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_category?: string
          action_type?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      streak_rewards: {
        Row: {
          claimed_at: string
          claimed_date: string
          id: string
          reward_type: string
          reward_value: number
          streak_day: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          claimed_date?: string
          id?: string
          reward_type: string
          reward_value?: number
          streak_day: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          claimed_date?: string
          id?: string
          reward_type?: string
          reward_value?: number
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      subscription_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
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
      user_location_analytics: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_hash: string | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          region: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_offenses: {
        Row: {
          created_at: string
          created_by: string
          flagged_content_id: string | null
          id: string
          notes: string | null
          offense_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          flagged_content_id?: string | null
          id?: string
          notes?: string | null
          offense_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          flagged_content_id?: string | null
          id?: string
          notes?: string | null
          offense_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_offenses_flagged_content_id_fkey"
            columns: ["flagged_content_id"]
            isOneToOne: false
            referencedRelation: "flagged_content"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_notified_at: string | null
          grace_period_end: string | null
          id: string
          price_id: string | null
          product_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_notified_at?: string | null
          grace_period_end?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_notified_at?: string | null
          grace_period_end?: string | null
          id?: string
          price_id?: string | null
          product_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance_cents: number
          created_at: string
          id: string
          total_deposited_cents: number
          total_earned_cents: number
          total_spent_cents: number
          total_withdrawn_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          id?: string
          total_deposited_cents?: number
          total_earned_cents?: number
          total_spent_cents?: number
          total_withdrawn_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          id?: string
          total_deposited_cents?: number
          total_earned_cents?: number
          total_spent_cents?: number
          total_withdrawn_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          ip_hash: string | null
          user_id: string | null
          value_cents: number | null
          visualization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          ip_hash?: string | null
          user_id?: string | null
          value_cents?: number | null
          visualization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          ip_hash?: string | null
          user_id?: string | null
          value_cents?: number | null
          visualization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_interactions_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_scores: {
        Row: {
          download_gif_count: number
          download_hd_count: number
          id: string
          print_order_count: number
          print_revenue_cents: number
          royalty_cents_earned: number
          royalty_orders_count: number
          total_score: number
          trade_count: number
          unique_viewers: number
          updated_at: string
          view_count: number
          visualization_id: string
        }
        Insert: {
          download_gif_count?: number
          download_hd_count?: number
          id?: string
          print_order_count?: number
          print_revenue_cents?: number
          royalty_cents_earned?: number
          royalty_orders_count?: number
          total_score?: number
          trade_count?: number
          unique_viewers?: number
          updated_at?: string
          view_count?: number
          visualization_id: string
        }
        Update: {
          download_gif_count?: number
          download_hd_count?: number
          id?: string
          print_order_count?: number
          print_revenue_cents?: number
          royalty_cents_earned?: number
          royalty_orders_count?: number
          total_score?: number
          trade_count?: number
          unique_viewers?: number
          updated_at?: string
          view_count?: number
          visualization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_scores_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: true
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visualization_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          price_cents: number
          seller_id: string
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
          visualization_id: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price_cents?: number
          seller_id: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          visualization_id: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price_cents?: number
          seller_id?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          visualization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualization_listings_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visualization_transfers: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          to_user_id: string
          transfer_type: string
          visualization_id: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          to_user_id: string
          transfer_type: string
          visualization_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          to_user_id?: string
          transfer_type?: string
          visualization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualization_transfers_visualization_id_fkey"
            columns: ["visualization_id"]
            isOneToOne: false
            referencedRelation: "saved_visualizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          counterparty_id: string | null
          created_at: string
          description: string | null
          id: string
          related_listing_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          balance_after_cents: number
          counterparty_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_listing_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          counterparty_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_listing_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_related_listing_id_fkey"
            columns: ["related_listing_id"]
            isOneToOne: false
            referencedRelation: "visualization_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          completed_at: string | null
          created_at: string
          id: string
          payout_details: Json | null
          payout_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      education_fund_stats: {
        Row: {
          scholarships_funded: number | null
          total_contributions: number | null
          total_forfeited_value_cents: number | null
          total_fund_cents: number | null
          total_platform_fee_cents: number | null
          total_visions_released: number | null
        }
        Relationships: []
      }
      scan_leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          last_scan_at: string | null
          total_scans: number | null
          total_successful_scans: number | null
          unique_visions_scanned: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_portfolio_value: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_vision_score: {
        Args: {
          p_download_gif_count: number
          p_download_hd_count: number
          p_print_order_count: number
          p_print_revenue_cents: number
          p_trade_count: number
          p_view_count: number
        }
        Returns: number
      }
      can_transfer_visualization: {
        Args: { p_visualization_id: string }
        Returns: boolean
      }
      check_grace_period_expiration: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_scan_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_type: string
          just_earned: boolean
        }[]
      }
      create_withdrawal_request: {
        Args: {
          p_amount_cents: number
          p_payout_details?: Json
          p_user_id: string
        }
        Returns: string
      }
      generate_challenge_code: { Args: never; Returns: string }
      generate_premium_analytics: {
        Args: { p_analytics_type: string; p_user_id: string }
        Returns: string
      }
      generate_share_id: { Args: never; Returns: string }
      get_funnel_stats: {
        Args: { days_back?: number }
        Returns: {
          conversion_rate: number
          event_type: string
          total_count: number
          trigger_source: string
          unique_users: number
        }[]
      }
      get_or_create_wallet: {
        Args: { p_user_id: string }
        Returns: {
          balance_cents: number
          created_at: string
          id: string
          total_deposited_cents: number
          total_earned_cents: number
          total_spent_cents: number
          total_withdrawn_cents: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_remaining_transfers: {
        Args: { p_visualization_id: string }
        Returns: number
      }
      get_user_offense_count: { Args: { p_user_id: string }; Returns: number }
      get_user_streak: { Args: { p_user_id: string }; Returns: Json }
      get_withdrawable_balance: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium_user: { Args: { p_user_id: string }; Returns: boolean }
      is_user_banned: { Args: { p_user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_action_category?: string
          p_action_type: string
          p_admin_id?: string
          p_ip_address?: string
          p_metadata?: Json
          p_severity?: string
          p_target_id?: string
          p_target_type?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      process_marketplace_sale: {
        Args: {
          p_buyer_id: string
          p_listing_id: string
          p_sale_price_cents: number
        }
        Returns: boolean
      }
      record_order_with_distribution: {
        Args: {
          p_fulfillment_costs_cents: number
          p_game_id?: string
          p_gross_revenue_cents: number
          p_order_reference: string
          p_order_type: string
          p_palette_id?: string
          p_platform_fees_cents: number
          p_user_id?: string
          p_visualization_id?: string
        }
        Returns: string
      }
      record_vision_interaction: {
        Args: {
          p_interaction_type: string
          p_ip_hash?: string
          p_user_id: string
          p_value_cents?: number
          p_visualization_id: string
        }
        Returns: boolean
      }
      release_user_visions: { Args: { p_user_id: string }; Returns: number }
      release_user_visions_with_value: {
        Args: { p_user_id: string }
        Returns: {
          forfeited_value_cents: number
          released_count: number
        }[]
      }
      snapshot_daily_financials: { Args: never; Returns: undefined }
      update_scan_streak: { Args: { p_user_id: string }; Returns: Json }
      validate_withdrawal_request: {
        Args: { p_amount_cents: number; p_user_id: string }
        Returns: {
          error_message: string
          is_valid: boolean
          max_withdrawable_cents: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      chess_game_result: "white_wins" | "black_wins" | "draw" | "abandoned"
      chess_game_status: "waiting" | "active" | "completed" | "abandoned"
      listing_status: "active" | "sold" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      chess_game_result: ["white_wins", "black_wins", "draw", "abandoned"],
      chess_game_status: ["waiting", "active", "completed", "abandoned"],
      listing_status: ["active", "sold", "cancelled"],
      testimonial_status: ["pending", "approved", "rejected"],
      time_control: ["bullet_1", "blitz_5", "rapid_15", "untimed"],
    },
  },
} as const
