import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecallRequest {
  context?: string;
  categories?: string[];
  tags?: string[];
  limit?: number;
  minImportance?: number;
}

interface Memory {
  id: string;
  category: string;
  title: string;
  content: Record<string, unknown>;
  importance: number;
  tags: string[];
  created_at: string;
  created_by: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { context, categories, tags, limit = 20, minImportance = 1 }: RecallRequest = await req.json();

    // Build query
    let query = supabase
      .from("en_pensent_memory")
      .select("*")
      .gte("importance", minImportance)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by categories if provided
    if (categories && categories.length > 0) {
      query = query.in("category", categories);
    }

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    // Update access counts for retrieved memories
    if (memories && memories.length > 0) {
      const memoryIds = memories.map((m: Memory) => m.id);
      await supabase
        .from("en_pensent_memory")
        .update({ 
          last_accessed_at: new Date().toISOString(),
          access_count: supabase.rpc('increment_access_count')
        })
        .in("id", memoryIds);
    }

    // Build context summary
    const summary = buildContextSummary(memories || []);

    // Get system state
    const { data: evolutionState } = await supabase
      .from("evolution_state")
      .select("*")
      .eq("state_type", "market_prediction")
      .single();

    const { data: portfolio } = await supabase
      .from("portfolio_balance")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        memories: memories || [],
        summary,
        currentState: {
          generation: evolutionState?.generation || 0,
          fitness: evolutionState?.fitness_score || 0,
          portfolioBalance: portfolio?.balance || 1000,
          totalPredictions: evolutionState?.total_predictions || 0
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("En Pensent Recall Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildContextSummary(memories: Memory[]): string {
  const byCategory: Record<string, Memory[]> = {};
  
  for (const memory of memories) {
    if (!byCategory[memory.category]) {
      byCategory[memory.category] = [];
    }
    byCategory[memory.category].push(memory);
  }

  let summary = "## En Pensent Memory Context\n\n";
  
  // Decisions first
  if (byCategory.decisions) {
    summary += "### CEO Decisions\n";
    for (const m of byCategory.decisions) {
      summary += `- **${m.title}**: ${JSON.stringify(m.content.decision || m.content)}\n`;
    }
    summary += "\n";
  }

  // Vision
  if (byCategory.vision) {
    summary += "### Vision & Philosophy\n";
    for (const m of byCategory.vision) {
      summary += `- **${m.title}**: ${JSON.stringify(m.content.vision || m.content)}\n`;
    }
    summary += "\n";
  }

  // Breakthroughs
  if (byCategory.breakthroughs) {
    summary += "### Breakthroughs\n";
    for (const m of byCategory.breakthroughs) {
      summary += `- **${m.title}**: ${JSON.stringify(m.content.insight || m.content)}\n`;
    }
    summary += "\n";
  }

  // Milestones
  if (byCategory.milestones) {
    summary += "### Milestones Achieved\n";
    for (const m of byCategory.milestones) {
      summary += `- **${m.title}**\n`;
    }
    summary += "\n";
  }

  // Configurations
  if (byCategory.configurations) {
    summary += "### System Configuration\n";
    for (const m of byCategory.configurations) {
      summary += `- **${m.title}**\n`;
    }
  }

  return summary;
}
