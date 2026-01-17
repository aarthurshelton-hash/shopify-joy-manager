import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogMemoryRequest {
  category: 'decisions' | 'breakthroughs' | 'milestones' | 'configurations' | 'vision' | 'conversations';
  title: string;
  content: Record<string, unknown>;
  importance?: number;
  tags?: string[];
  createdBy?: string;
  relatedMemories?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      category, 
      title, 
      content, 
      importance = 5, 
      tags = [], 
      createdBy = 'ai_system',
      relatedMemories = []
    }: LogMemoryRequest = await req.json();

    // Validate category
    const validCategories = ['decisions', 'breakthroughs', 'milestones', 'configurations', 'vision', 'conversations'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Insert the memory
    const { data: memory, error } = await supabase
      .from("en_pensent_memory")
      .insert({
        category,
        title,
        content,
        importance: Math.min(10, Math.max(1, importance)),
        tags,
        created_by: createdBy,
        related_memories: relatedMemories
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[En Pensent Memory] Logged: ${category}/${title} (importance: ${importance})`);

    // Auto-log milestone if it's a significant event
    if (category !== 'milestones' && importance >= 9) {
      await supabase
        .from("en_pensent_memory")
        .insert({
          category: 'milestones',
          title: `High-importance ${category} recorded: ${title}`,
          content: { 
            original_category: category,
            original_title: title,
            auto_logged: true 
          },
          importance: 6,
          tags: ['auto-logged', category],
          created_by: 'ai_system',
          related_memories: [memory.id]
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        memory,
        message: `Memory logged: ${title}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("En Pensent Log Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
