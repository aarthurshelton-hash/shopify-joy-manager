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
      ai_art_bank: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string
          is_active: boolean | null
          prompt: string | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_locations: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path: string
          is_active?: boolean | null
          prompt?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_locations?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string
          is_active?: boolean | null
          prompt?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_locations?: string[] | null
        }
        Relationships: []
      }
      auto_heal_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          fixes_applied: number | null
          fixes_generated: number | null
          id: string
          issues_detected: number | null
          run_metadata: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          fixes_applied?: number | null
          fixes_generated?: number | null
          id?: string
          issues_detected?: number | null
          run_metadata?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          fixes_applied?: number | null
          fixes_generated?: number | null
          id?: string
          issues_detected?: number | null
          run_metadata?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      autonomous_trades: {
        Row: {
          actual_direction: string | null
          created_at: string
          direction: string
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          id: string
          pnl: number | null
          pnl_percent: number | null
          predicted_confidence: number
          predicted_direction: string
          prediction_id: string | null
          shares: number
          status: string
          symbol: string
        }
        Insert: {
          actual_direction?: string | null
          created_at?: string
          direction: string
          entry_price: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          pnl_percent?: number | null
          predicted_confidence: number
          predicted_direction: string
          prediction_id?: string | null
          shares: number
          status?: string
          symbol: string
        }
        Update: {
          actual_direction?: string | null
          created_at?: string
          direction?: string
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          pnl_percent?: number | null
          predicted_confidence?: number
          predicted_direction?: string
          prediction_id?: string | null
          shares?: number
          status?: string
          symbol?: string
        }
        Relationships: []
      }
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
      client_errors: {
        Row: {
          component_name: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string | null
          first_occurred_at: string | null
          id: string
          last_occurred_at: string | null
          metadata: Json | null
          occurrence_count: number | null
          resolved_at: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type?: string | null
          first_occurred_at?: string | null
          id?: string
          last_occurred_at?: string | null
          metadata?: Json | null
          occurrence_count?: number | null
          resolved_at?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string | null
          first_occurred_at?: string | null
          id?: string
          last_occurred_at?: string | null
          metadata?: Json | null
          occurrence_count?: number | null
          resolved_at?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      code_commit_analysis: {
        Row: {
          additions: number
          author: string | null
          author_email: string | null
          commit_hash: string
          commit_message: string | null
          commit_type: string
          committed_at: string
          created_at: string
          deletions: number
          file_categories: Json | null
          files_changed: number
          id: string
          impact_score: number | null
          repository_pattern_id: string | null
        }
        Insert: {
          additions?: number
          author?: string | null
          author_email?: string | null
          commit_hash: string
          commit_message?: string | null
          commit_type: string
          committed_at: string
          created_at?: string
          deletions?: number
          file_categories?: Json | null
          files_changed?: number
          id?: string
          impact_score?: number | null
          repository_pattern_id?: string | null
        }
        Update: {
          additions?: number
          author?: string | null
          author_email?: string | null
          commit_hash?: string
          commit_message?: string | null
          commit_type?: string
          committed_at?: string
          created_at?: string
          deletions?: number
          file_categories?: Json | null
          files_changed?: number
          id?: string
          impact_score?: number | null
          repository_pattern_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_commit_analysis_repository_pattern_id_fkey"
            columns: ["repository_pattern_id"]
            isOneToOne: false
            referencedRelation: "code_repository_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      code_issues: {
        Row: {
          auto_fixable: boolean | null
          confidence: number
          description: string
          detected_at: string
          file_path: string
          fix_applied: boolean | null
          id: string
          issue_type: string
          line_end: number | null
          line_start: number | null
          metadata: Json | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          auto_fixable?: boolean | null
          confidence?: number
          description: string
          detected_at?: string
          file_path: string
          fix_applied?: boolean | null
          id?: string
          issue_type: string
          line_end?: number | null
          line_start?: number | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          auto_fixable?: boolean | null
          confidence?: number
          description?: string
          detected_at?: string
          file_path?: string
          fix_applied?: boolean | null
          id?: string
          issue_type?: string
          line_end?: number | null
          line_start?: number | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      code_prediction_outcomes: {
        Row: {
          actual_outcome: string | null
          created_at: string
          id: string
          notes: string | null
          outcome_recorded_at: string | null
          predicted_archetype: string
          predicted_confidence: number
          predicted_outcome: string
          prediction_accuracy: number | null
          repository_pattern_id: string | null
        }
        Insert: {
          actual_outcome?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome_recorded_at?: string | null
          predicted_archetype: string
          predicted_confidence: number
          predicted_outcome: string
          prediction_accuracy?: number | null
          repository_pattern_id?: string | null
        }
        Update: {
          actual_outcome?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome_recorded_at?: string | null
          predicted_archetype?: string
          predicted_confidence?: number
          predicted_outcome?: string
          prediction_accuracy?: number | null
          repository_pattern_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_prediction_outcomes_repository_pattern_id_fkey"
            columns: ["repository_pattern_id"]
            isOneToOne: false
            referencedRelation: "code_repository_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      code_repository_patterns: {
        Row: {
          analysis_period_end: string | null
          analysis_period_start: string | null
          analyzed_by: string | null
          archetype: string
          code_metrics: Json
          created_at: string
          critical_moments: Json
          dominant_force: string
          fingerprint: string
          flow_direction: string
          id: string
          intensity: number
          outcome_confidence: number | null
          owner: string
          predicted_outcome: string | null
          quadrant_profile: Json
          recommendations: Json | null
          repository_name: string
          repository_url: string
          temporal_flow: Json
          total_commits: number
          total_contributors: number
          updated_at: string
        }
        Insert: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          analyzed_by?: string | null
          archetype: string
          code_metrics: Json
          created_at?: string
          critical_moments?: Json
          dominant_force: string
          fingerprint: string
          flow_direction: string
          id?: string
          intensity: number
          outcome_confidence?: number | null
          owner: string
          predicted_outcome?: string | null
          quadrant_profile: Json
          recommendations?: Json | null
          repository_name: string
          repository_url: string
          temporal_flow: Json
          total_commits?: number
          total_contributors?: number
          updated_at?: string
        }
        Update: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          analyzed_by?: string | null
          archetype?: string
          code_metrics?: Json
          created_at?: string
          critical_moments?: Json
          dominant_force?: string
          fingerprint?: string
          flow_direction?: string
          id?: string
          intensity?: number
          outcome_confidence?: number | null
          owner?: string
          predicted_outcome?: string | null
          quadrant_profile?: Json
          recommendations?: Json | null
          repository_name?: string
          repository_url?: string
          temporal_flow?: Json
          total_commits?: number
          total_contributors?: number
          updated_at?: string
        }
        Relationships: []
      }
      color_flow_patterns: {
        Row: {
          archetype: string
          characteristics: Json
          created_at: string
          created_by: string | null
          fingerprint: string
          game_metadata: Json | null
          id: string
          opening_eco: string | null
          outcome: string
          pgn_hash: string | null
          total_moves: number
        }
        Insert: {
          archetype: string
          characteristics: Json
          created_at?: string
          created_by?: string | null
          fingerprint: string
          game_metadata?: Json | null
          id?: string
          opening_eco?: string | null
          outcome: string
          pgn_hash?: string | null
          total_moves: number
        }
        Update: {
          archetype?: string
          characteristics?: Json
          created_at?: string
          created_by?: string | null
          fingerprint?: string
          game_metadata?: Json | null
          id?: string
          opening_eco?: string | null
          outcome?: string
          pgn_hash?: string | null
          total_moves?: number
        }
        Relationships: []
      }
      company_profit_pool: {
        Row: {
          created_at: string
          extractable_profit_cents: number
          gross_revenue_cents: number
          id: string
          net_profit_cents: number
          notes: string | null
          period_date: string
          reinvested_cents: number
          source_type: string
          stripe_fees_cents: number
          tax_collected_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          extractable_profit_cents?: number
          gross_revenue_cents?: number
          id?: string
          net_profit_cents?: number
          notes?: string | null
          period_date?: string
          reinvested_cents?: number
          source_type: string
          stripe_fees_cents?: number
          tax_collected_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          extractable_profit_cents?: number
          gross_revenue_cents?: number
          id?: string
          net_profit_cents?: number
          notes?: string | null
          period_date?: string
          reinvested_cents?: number
          source_type?: string
          stripe_fees_cents?: number
          tax_collected_cents?: number
          updated_at?: string
        }
        Relationships: []
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
      en_pensent_memory: {
        Row: {
          access_count: number | null
          category: string
          content: Json
          created_at: string
          created_by: string
          id: string
          importance: number
          last_accessed_at: string | null
          related_memories: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          access_count?: number | null
          category: string
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          importance?: number
          last_accessed_at?: string | null
          related_memories?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          access_count?: number | null
          category?: string
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          importance?: number
          last_accessed_at?: string | null
          related_memories?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      evolution_state: {
        Row: {
          adaptation_history: Json | null
          created_at: string
          fitness_score: number | null
          generation: number | null
          genes: Json
          id: string
          last_mutation_at: string | null
          learned_patterns: Json | null
          state_type: string
          total_predictions: number | null
          updated_at: string
        }
        Insert: {
          adaptation_history?: Json | null
          created_at?: string
          fitness_score?: number | null
          generation?: number | null
          genes: Json
          id?: string
          last_mutation_at?: string | null
          learned_patterns?: Json | null
          state_type?: string
          total_predictions?: number | null
          updated_at?: string
        }
        Update: {
          adaptation_history?: Json | null
          created_at?: string
          fitness_score?: number | null
          generation?: number | null
          genes?: Json
          id?: string
          last_mutation_at?: string | null
          learned_patterns?: Json | null
          state_type?: string
          total_predictions?: number | null
          updated_at?: string
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
      health_check_metrics: {
        Row: {
          api_requests: number | null
          avg_response_time_ms: number | null
          created_at: string
          date: string
          errors_reported: number | null
          errors_resolved: number | null
          hour: number
          id: string
          issues_fixed: number | null
          issues_found: number | null
          rate_limited_requests: number | null
          uptime_percentage: number | null
        }
        Insert: {
          api_requests?: number | null
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          errors_reported?: number | null
          errors_resolved?: number | null
          hour?: number
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          rate_limited_requests?: number | null
          uptime_percentage?: number | null
        }
        Update: {
          api_requests?: number | null
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          errors_reported?: number | null
          errors_resolved?: number | null
          hour?: number
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          rate_limited_requests?: number | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      market_collection_status: {
        Row: {
          created_at: string
          errors_today: number | null
          id: string
          is_collecting: boolean | null
          last_tick_at: string | null
          market_name: string
          status: string | null
          ticks_collected_today: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          errors_today?: number | null
          id?: string
          is_collecting?: boolean | null
          last_tick_at?: string | null
          market_name: string
          status?: string | null
          ticks_collected_today?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          errors_today?: number | null
          id?: string
          is_collecting?: boolean | null
          last_tick_at?: string | null
          market_name?: string
          status?: string | null
          ticks_collected_today?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      market_correlations: {
        Row: {
          calculated_at: string
          confidence_interval: number | null
          correlation_coefficient: number
          created_at: string
          id: string
          lag_ms: number | null
          sample_size: number
          symbol_a: string
          symbol_b: string
          timeframe: string
        }
        Insert: {
          calculated_at?: string
          confidence_interval?: number | null
          correlation_coefficient: number
          created_at?: string
          id?: string
          lag_ms?: number | null
          sample_size: number
          symbol_a: string
          symbol_b: string
          timeframe: string
        }
        Update: {
          calculated_at?: string
          confidence_interval?: number | null
          correlation_coefficient?: number
          created_at?: string
          id?: string
          lag_ms?: number | null
          sample_size?: number
          symbol_a?: string
          symbol_b?: string
          timeframe?: string
        }
        Relationships: []
      }
      market_tick_history: {
        Row: {
          ask: number | null
          bid: number | null
          created_at: string
          id: string
          price: number
          source: string | null
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          id?: string
          price: number
          source?: string | null
          symbol: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          id?: string
          price?: number
          source?: string | null
          symbol?: string
          timestamp?: string
          volume?: number | null
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
      opening_value_pool: {
        Row: {
          base_value_cents: number
          category: string
          created_at: string
          earned_value_cents: number
          id: string
          last_interaction_at: string | null
          opening_eco: string
          opening_name: string
          total_interactions: number
          total_marketplace_trades: number
          total_print_orders: number
          total_visions_using: number
          updated_at: string
          value_bonus_percent: number
        }
        Insert: {
          base_value_cents?: number
          category?: string
          created_at?: string
          earned_value_cents?: number
          id?: string
          last_interaction_at?: string | null
          opening_eco: string
          opening_name: string
          total_interactions?: number
          total_marketplace_trades?: number
          total_print_orders?: number
          total_visions_using?: number
          updated_at?: string
          value_bonus_percent?: number
        }
        Update: {
          base_value_cents?: number
          category?: string
          created_at?: string
          earned_value_cents?: number
          id?: string
          last_interaction_at?: string | null
          opening_eco?: string
          opening_name?: string
          total_interactions?: number
          total_marketplace_trades?: number
          total_print_orders?: number
          total_visions_using?: number
          updated_at?: string
          value_bonus_percent?: number
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
          total_marketplace_trades: number
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
          total_marketplace_trades?: number
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
          total_marketplace_trades?: number
          total_print_orders?: number
          total_visions_using?: number
          updated_at?: string
        }
        Relationships: []
      }
      pending_fixes: {
        Row: {
          ai_model: string | null
          applied_at: string | null
          approved_by: string | null
          confidence: number
          file_path: string
          fix_prompt: string
          fixed_code: string | null
          generated_at: string
          generation_metadata: Json | null
          id: string
          issue_id: string | null
          original_code: string | null
          status: string
        }
        Insert: {
          ai_model?: string | null
          applied_at?: string | null
          approved_by?: string | null
          confidence?: number
          file_path: string
          fix_prompt: string
          fixed_code?: string | null
          generated_at?: string
          generation_metadata?: Json | null
          id?: string
          issue_id?: string | null
          original_code?: string | null
          status?: string
        }
        Update: {
          ai_model?: string | null
          applied_at?: string | null
          approved_by?: string | null
          confidence?: number
          file_path?: string
          fix_prompt?: string
          fixed_code?: string | null
          generated_at?: string
          generation_metadata?: Json | null
          id?: string
          issue_id?: string | null
          original_code?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_fixes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "code_issues"
            referencedColumns: ["id"]
          },
        ]
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
      portfolio_balance: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_trade_at: string | null
          peak_balance: number
          target_balance: number
          total_trades: number
          trough_balance: number
          updated_at: string
          winning_trades: number
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_trade_at?: string | null
          peak_balance?: number
          target_balance?: number
          total_trades?: number
          trough_balance?: number
          updated_at?: string
          winning_trades?: number
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_trade_at?: string | null
          peak_balance?: number
          target_balance?: number
          total_trades?: number
          trough_balance?: number
          updated_at?: string
          winning_trades?: number
        }
        Relationships: []
      }
      prediction_outcomes: {
        Row: {
          actual_direction: string | null
          actual_magnitude: number | null
          calibration_accuracy: number | null
          composite_score: number | null
          correlated_assets: Json | null
          created_at: string
          direction_correct: boolean | null
          domain_contributions: Json | null
          engine_version: string | null
          entry_price: number
          exit_price: number | null
          genes_hash: string | null
          id: string
          magnitude_accuracy: number | null
          market_conditions: Json | null
          paper_mode: boolean | null
          predicted_confidence: number
          predicted_direction: string
          predicted_magnitude: number | null
          prediction_horizon_ms: number
          resolved_at: string | null
          session_id: string | null
          symbol: string
          timing_accuracy: number | null
        }
        Insert: {
          actual_direction?: string | null
          actual_magnitude?: number | null
          calibration_accuracy?: number | null
          composite_score?: number | null
          correlated_assets?: Json | null
          created_at?: string
          direction_correct?: boolean | null
          domain_contributions?: Json | null
          engine_version?: string | null
          entry_price: number
          exit_price?: number | null
          genes_hash?: string | null
          id?: string
          magnitude_accuracy?: number | null
          market_conditions?: Json | null
          paper_mode?: boolean | null
          predicted_confidence: number
          predicted_direction: string
          predicted_magnitude?: number | null
          prediction_horizon_ms: number
          resolved_at?: string | null
          session_id?: string | null
          symbol: string
          timing_accuracy?: number | null
        }
        Update: {
          actual_direction?: string | null
          actual_magnitude?: number | null
          calibration_accuracy?: number | null
          composite_score?: number | null
          correlated_assets?: Json | null
          created_at?: string
          direction_correct?: boolean | null
          domain_contributions?: Json | null
          engine_version?: string | null
          entry_price?: number
          exit_price?: number | null
          genes_hash?: string | null
          id?: string
          magnitude_accuracy?: number | null
          market_conditions?: Json | null
          paper_mode?: boolean | null
          predicted_confidence?: number
          predicted_direction?: string
          predicted_magnitude?: number | null
          prediction_horizon_ms?: number
          resolved_at?: string | null
          session_id?: string | null
          symbol?: string
          timing_accuracy?: number | null
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
      rate_limit_records: {
        Row: {
          blocked_until: string | null
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      revenue_stream_summary: {
        Row: {
          created_at: string
          id: string
          last_updated_at: string
          reinvestment_rate: number
          stream_type: string
          total_extractable_cents: number
          total_gross_revenue_cents: number
          total_net_profit_cents: number
          total_reinvested_cents: number
          total_stripe_fees_cents: number
          total_tax_collected_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated_at?: string
          reinvestment_rate?: number
          stream_type: string
          total_extractable_cents?: number
          total_gross_revenue_cents?: number
          total_net_profit_cents?: number
          total_reinvested_cents?: number
          total_stripe_fees_cents?: number
          total_tax_collected_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated_at?: string
          reinvestment_rate?: number
          stream_type?: string
          total_extractable_cents?: number
          total_gross_revenue_cents?: number
          total_net_profit_cents?: number
          total_reinvested_cents?: number
          total_stripe_fees_cents?: number
          total_tax_collected_cents?: number
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
          is_private: boolean
          original_creator_id: string | null
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
          is_private?: boolean
          original_creator_id?: string | null
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
          is_private?: boolean
          original_creator_id?: string | null
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
      security_accuracy_metrics: {
        Row: {
          best_timeframe_ms: number | null
          calibration_accuracy: number | null
          composite_accuracy: number | null
          correct_predictions: number | null
          correlation_strengths: Json | null
          created_at: string
          direction_accuracy: number | null
          id: string
          last_prediction_at: string | null
          magnitude_accuracy: number | null
          optimal_confidence_threshold: number | null
          symbol: string
          timing_accuracy: number | null
          total_predictions: number | null
          updated_at: string
          volatility_profile: Json | null
        }
        Insert: {
          best_timeframe_ms?: number | null
          calibration_accuracy?: number | null
          composite_accuracy?: number | null
          correct_predictions?: number | null
          correlation_strengths?: Json | null
          created_at?: string
          direction_accuracy?: number | null
          id?: string
          last_prediction_at?: string | null
          magnitude_accuracy?: number | null
          optimal_confidence_threshold?: number | null
          symbol: string
          timing_accuracy?: number | null
          total_predictions?: number | null
          updated_at?: string
          volatility_profile?: Json | null
        }
        Update: {
          best_timeframe_ms?: number | null
          calibration_accuracy?: number | null
          composite_accuracy?: number | null
          correct_predictions?: number | null
          correlation_strengths?: Json | null
          created_at?: string
          direction_accuracy?: number | null
          id?: string
          last_prediction_at?: string | null
          magnitude_accuracy?: number | null
          optimal_confidence_threshold?: number | null
          symbol?: string
          timing_accuracy?: number | null
          total_predictions?: number | null
          updated_at?: string
          volatility_profile?: Json | null
        }
        Relationships: []
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
      stock_predictions: {
        Row: {
          accuracy_score: number | null
          actual_direction: string | null
          actual_move: number | null
          archetype: string
          baseline_direction: string | null
          baseline_was_correct: boolean | null
          created_at: string
          expires_at: string
          id: string
          outcome_price: number | null
          predicted_confidence: number
          predicted_direction: string
          predicted_target_move: number
          price_at_prediction: number
          resolved_at: string | null
          signature_fingerprint: string
          symbol: string
          time_horizon: string
          user_id: string | null
          was_correct: boolean | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_direction?: string | null
          actual_move?: number | null
          archetype: string
          baseline_direction?: string | null
          baseline_was_correct?: boolean | null
          created_at?: string
          expires_at: string
          id?: string
          outcome_price?: number | null
          predicted_confidence: number
          predicted_direction: string
          predicted_target_move: number
          price_at_prediction: number
          resolved_at?: string | null
          signature_fingerprint: string
          symbol: string
          time_horizon: string
          user_id?: string | null
          was_correct?: boolean | null
        }
        Update: {
          accuracy_score?: number | null
          actual_direction?: string | null
          actual_move?: number | null
          archetype?: string
          baseline_direction?: string | null
          baseline_was_correct?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          outcome_price?: number | null
          predicted_confidence?: number
          predicted_direction?: string
          predicted_target_move?: number
          price_at_prediction?: number
          resolved_at?: string | null
          signature_fingerprint?: string
          symbol?: string
          time_horizon?: string
          user_id?: string | null
          was_correct?: boolean | null
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
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          check_type: string
          completed_at: string | null
          created_at: string | null
          details: Json | null
          id: string
          issues_fixed: number | null
          issues_found: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          check_type: string
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          check_type?: string
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          issues_fixed?: number | null
          issues_found?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      system_vitals: {
        Row: {
          created_at: string | null
          id: string
          last_pulse_at: string | null
          last_value: number | null
          metadata: Json | null
          pulse_count: number | null
          status: string | null
          target_value: number | null
          updated_at: string | null
          vital_name: string
          vital_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_pulse_at?: string | null
          last_value?: number | null
          metadata?: Json | null
          pulse_count?: number | null
          status?: string | null
          target_value?: number | null
          updated_at?: string | null
          vital_name: string
          vital_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_pulse_at?: string | null
          last_value?: number | null
          metadata?: Json | null
          pulse_count?: number | null
          status?: string | null
          target_value?: number | null
          updated_at?: string | null
          vital_name?: string
          vital_type?: string
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
      trading_evidence_log: {
        Row: {
          actual_direction: string | null
          confidence: number | null
          created_at: string
          data_source: string | null
          domain_contributions: Json | null
          engine_version: string | null
          entry_price: number | null
          evidence_id: string
          evidence_type: string
          evolution_fitness: number | null
          evolution_generation: number | null
          exit_price: number | null
          genes_hash: string | null
          id: string
          magnitude: number | null
          market_price: number | null
          market_spread: number | null
          paper_mode: boolean | null
          pnl: number | null
          pnl_percent: number | null
          predicted_direction: string | null
          quantity: number | null
          record_hash: string | null
          resolved_at: string | null
          session_id: string | null
          side: string | null
          symbol: string | null
          time_horizon_ms: number | null
          was_correct: boolean | null
        }
        Insert: {
          actual_direction?: string | null
          confidence?: number | null
          created_at?: string
          data_source?: string | null
          domain_contributions?: Json | null
          engine_version?: string | null
          entry_price?: number | null
          evidence_id: string
          evidence_type: string
          evolution_fitness?: number | null
          evolution_generation?: number | null
          exit_price?: number | null
          genes_hash?: string | null
          id?: string
          magnitude?: number | null
          market_price?: number | null
          market_spread?: number | null
          paper_mode?: boolean | null
          pnl?: number | null
          pnl_percent?: number | null
          predicted_direction?: string | null
          quantity?: number | null
          record_hash?: string | null
          resolved_at?: string | null
          session_id?: string | null
          side?: string | null
          symbol?: string | null
          time_horizon_ms?: number | null
          was_correct?: boolean | null
        }
        Update: {
          actual_direction?: string | null
          confidence?: number | null
          created_at?: string
          data_source?: string | null
          domain_contributions?: Json | null
          engine_version?: string | null
          entry_price?: number | null
          evidence_id?: string
          evidence_type?: string
          evolution_fitness?: number | null
          evolution_generation?: number | null
          exit_price?: number | null
          genes_hash?: string | null
          id?: string
          magnitude?: number | null
          market_price?: number | null
          market_spread?: number | null
          paper_mode?: boolean | null
          pnl?: number | null
          pnl_percent?: number | null
          predicted_direction?: string | null
          quantity?: number | null
          record_hash?: string | null
          resolved_at?: string | null
          session_id?: string | null
          side?: string | null
          symbol?: string | null
          time_horizon_ms?: number | null
          was_correct?: boolean | null
        }
        Relationships: []
      }
      trading_session_reports: {
        Row: {
          accuracy_metrics: Json | null
          best_trade_cents: number | null
          created_at: string
          end_time: string | null
          ending_balance_cents: number | null
          id: string
          lessons_learned: Json | null
          losing_trades: number | null
          market_conditions: Json | null
          securities_traded: Json | null
          session_id: string
          start_time: string
          starting_balance_cents: number
          total_pnl_cents: number | null
          total_trades: number | null
          user_id: string | null
          winning_trades: number | null
          worst_trade_cents: number | null
        }
        Insert: {
          accuracy_metrics?: Json | null
          best_trade_cents?: number | null
          created_at?: string
          end_time?: string | null
          ending_balance_cents?: number | null
          id?: string
          lessons_learned?: Json | null
          losing_trades?: number | null
          market_conditions?: Json | null
          securities_traded?: Json | null
          session_id: string
          start_time: string
          starting_balance_cents?: number
          total_pnl_cents?: number | null
          total_trades?: number | null
          user_id?: string | null
          winning_trades?: number | null
          worst_trade_cents?: number | null
        }
        Update: {
          accuracy_metrics?: Json | null
          best_trade_cents?: number | null
          created_at?: string
          end_time?: string | null
          ending_balance_cents?: number | null
          id?: string
          lessons_learned?: Json | null
          losing_trades?: number | null
          market_conditions?: Json | null
          securities_traded?: Json | null
          session_id?: string
          start_time?: string
          starting_balance_cents?: number
          total_pnl_cents?: number | null
          total_trades?: number | null
          user_id?: string | null
          winning_trades?: number | null
          worst_trade_cents?: number | null
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
          scan_count: number
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
          scan_count?: number
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
          scan_count?: number
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
      live_economics_summary: {
        Row: {
          active_gamecards: number | null
          active_openings: number | null
          active_palettes: number | null
          gamecard_pool_total_cents: number | null
          opening_pool_total_cents: number | null
          palette_pool_total_cents: number | null
          total_extractable_cents: number | null
          total_gross_revenue_cents: number | null
          total_net_profit_cents: number | null
          total_reinvested_cents: number | null
          total_stripe_fees_cents: number | null
          total_tax_collected_cents: number | null
          total_user_earnings_cents: number | null
          total_wallet_balance_cents: number | null
          wallets_with_balance: number | null
        }
        Relationships: []
      }
      prediction_accuracy_stats: {
        Row: {
          accuracy_percentage: number | null
          archetype: string | null
          avg_accuracy_score: number | null
          avg_confidence: number | null
          correct_predictions: number | null
          time_horizon: string | null
          total_predictions: number | null
        }
        Relationships: []
      }
      profit_pools_summary: {
        Row: {
          metric: string | null
          pool_type: string | null
          value_cents: number | null
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
      user_prediction_performance: {
        Row: {
          accuracy_percentage: number | null
          avg_confidence: number | null
          correct_predictions: number | null
          first_prediction_at: string | null
          last_prediction_at: string | null
          total_predictions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acknowledge_alert: { Args: { p_alert_id: string }; Returns: boolean }
      calculate_portfolio_value: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_vision_score:
        | {
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
        | {
            Args: {
              p_download_gif_count: number
              p_download_hd_count: number
              p_print_order_count: number
              p_print_revenue_cents: number
              p_scan_count?: number
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
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      check_scan_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_type: string
          just_earned: boolean
        }[]
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      create_system_alert: {
        Args: {
          p_alert_type: string
          p_message: string
          p_metadata?: Json
          p_severity: string
          p_title: string
        }
        Returns: string
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
      get_available_palettes_for_game: {
        Args: { p_pgn: string }
        Returns: {
          is_taken: boolean
          listing_price_cents: number
          owner_display_name: string
          owner_user_id: string
          palette_id: string
          visualization_id: string
        }[]
      }
      get_error_summary: { Args: { p_days?: number }; Returns: Json }
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
      get_health_trends: { Args: { p_days?: number }; Returns: Json }
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
      get_system_alerts: {
        Args: { p_include_resolved?: boolean; p_limit?: number }
        Returns: Json
      }
      get_system_vitals: {
        Args: never
        Returns: {
          is_healthy: boolean
          last_pulse_at: string
          last_value: number
          metadata: Json
          pulse_count: number
          seconds_since_pulse: number
          status: string
          target_value: number
          vital_name: string
          vital_type: string
        }[]
      }
      get_user_offense_count: { Args: { p_user_id: string }; Returns: number }
      get_user_portfolio_economics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_statistics: { Args: { p_user_id: string }; Returns: Json }
      get_user_streak: { Args: { p_user_id: string }; Returns: Json }
      get_vision_economics: {
        Args: { p_visualization_id: string }
        Returns: Json
      }
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
      perform_data_maintenance: {
        Args: {
          p_days_to_keep_expired_offers?: number
          p_days_to_keep_interactions?: number
          p_days_to_keep_notifications?: number
        }
        Returns: Json
      }
      process_marketplace_sale: {
        Args: {
          p_buyer_id: string
          p_listing_id: string
          p_sale_price_cents: number
        }
        Returns: boolean
      }
      publish_listing_with_validation: {
        Args: {
          p_max_price_cents?: number
          p_min_price_cents?: number
          p_price_cents: number
          p_visualization_id: string
        }
        Returns: Json
      }
      pulse_vital: {
        Args: {
          p_metadata?: Json
          p_status?: string
          p_value?: number
          p_vital_name: string
        }
        Returns: undefined
      }
      reclaim_orphaned_vision: {
        Args: { p_visualization_id: string }
        Returns: boolean
      }
      record_health_metric: {
        Args: {
          p_api_requests?: number
          p_errors_reported?: number
          p_errors_resolved?: number
          p_issues_fixed?: number
          p_issues_found?: number
          p_rate_limited?: number
        }
        Returns: undefined
      }
      record_marketplace_economics: {
        Args: {
          p_buyer_id: string
          p_game_id?: string
          p_listing_id: string
          p_palette_id?: string
          p_sale_price_cents: number
          p_seller_id: string
          p_visualization_id: string
        }
        Returns: Json
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
      record_print_order_economics: {
        Args: {
          p_fulfillment_costs_cents: number
          p_game_id?: string
          p_gross_revenue_cents: number
          p_order_reference: string
          p_palette_id?: string
          p_platform_fees_cents: number
          p_shipping_costs_cents?: number
          p_user_id: string
          p_visualization_id: string
        }
        Returns: Json
      }
      record_product_revenue: {
        Args: {
          p_fulfillment_cents: number
          p_game_id?: string
          p_gross_cents: number
          p_opening_eco?: string
          p_order_type: string
          p_palette_id?: string
          p_stripe_fee_cents?: number
          p_user_id: string
          p_visualization_id: string
        }
        Returns: undefined
      }
      record_revenue_profit: {
        Args: {
          p_gross_revenue_cents: number
          p_reinvested_cents?: number
          p_source_type: string
          p_stripe_fees_cents?: number
          p_tax_collected_cents?: number
        }
        Returns: string
      }
      record_subscription_revenue: {
        Args: {
          p_amount_cents: number
          p_stripe_fee_cents?: number
          p_tax_cents?: number
          p_user_id: string
        }
        Returns: undefined
      }
      record_vision_interaction: {
        Args: {
          p_interaction_type?: string
          p_ip_hash?: string
          p_user_id?: string
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
      report_client_error: {
        Args: {
          p_component_name?: string
          p_error_message: string
          p_error_stack?: string
          p_error_type?: string
          p_metadata?: Json
          p_url?: string
          p_user_agent?: string
        }
        Returns: string
      }
      resolve_alert: { Args: { p_alert_id: string }; Returns: boolean }
      snapshot_daily_financials: { Args: never; Returns: undefined }
      update_opening_pool: {
        Args: {
          p_category?: string
          p_is_marketplace_trade?: boolean
          p_is_print_order?: boolean
          p_opening_eco: string
          p_opening_name: string
          p_value_bonus_percent?: number
          p_value_cents?: number
        }
        Returns: undefined
      }
      update_scan_streak: { Args: { p_user_id: string }; Returns: Json }
      validate_and_fix_data_integrity: { Args: never; Returns: Json }
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
