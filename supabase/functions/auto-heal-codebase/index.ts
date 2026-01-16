import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodeIssue {
  file_path: string;
  issue_type: string;
  severity: string;
  description: string;
  confidence: number;
  line_start?: number;
  line_end?: number;
  auto_fixable: boolean;
  metadata?: Record<string, unknown>;
}

interface FixRequest {
  issue_id: string;
  file_path: string;
  issue_description: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { action, issues, fix_request, auto_apply_threshold } = await req.json();
    
    console.log(`[AutoHeal] Action: ${action}`);
    
    if (action === 'detect_issues') {
      // Store detected issues from frontend analysis
      const codeIssues: CodeIssue[] = issues || [];
      
      // Create a new heal run
      const { data: healRun, error: runError } = await supabase
        .from('auto_heal_runs')
        .insert({
          issues_detected: codeIssues.length,
          status: 'analyzing'
        })
        .select()
        .single();
      
      if (runError) {
        console.error('[AutoHeal] Failed to create heal run:', runError);
        throw runError;
      }
      
      // Insert issues
      for (const issue of codeIssues) {
        const { error: issueError } = await supabase
          .from('code_issues')
          .insert({
            file_path: issue.file_path,
            issue_type: issue.issue_type,
            severity: issue.severity,
            description: issue.description,
            confidence: issue.confidence,
            line_start: issue.line_start,
            line_end: issue.line_end,
            auto_fixable: issue.auto_fixable,
            metadata: issue.metadata || {}
          });
        
        if (issueError) {
          console.error('[AutoHeal] Failed to insert issue:', issueError);
        }
      }
      
      // Update heal run
      await supabase
        .from('auto_heal_runs')
        .update({
          status: 'issues_stored',
          run_metadata: { issues_stored: codeIssues.length }
        })
        .eq('id', healRun.id);
      
      return new Response(JSON.stringify({
        success: true,
        run_id: healRun.id,
        issues_stored: codeIssues.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'generate_fix') {
      const request: FixRequest = fix_request;
      
      if (!lovableApiKey) {
        // Generate a detailed prompt without AI
        const fixPrompt = generateFixPrompt(request);
        
        const { data: pendingFix, error: fixError } = await supabase
          .from('pending_fixes')
          .insert({
            issue_id: request.issue_id,
            file_path: request.file_path,
            fix_prompt: fixPrompt,
            confidence: request.confidence,
            status: 'prompt_generated',
            ai_model: 'manual'
          })
          .select()
          .single();
        
        if (fixError) throw fixError;
        
        return new Response(JSON.stringify({
          success: true,
          fix_id: pendingFix.id,
          fix_prompt: fixPrompt,
          requires_manual_application: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Use Lovable AI to generate fix
      const fixPrompt = generateFixPrompt(request);
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert code refactoring assistant. Generate precise, minimal fixes for code issues. 
              Return ONLY the fixed code block without explanations. 
              Focus on: performance, readability, maintainability, and following best practices.
              The fix should be a drop-in replacement that maintains all existing functionality.`
            },
            {
              role: 'user',
              content: fixPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      
      const aiData = await aiResponse.json();
      const fixedCode = aiData.choices?.[0]?.message?.content || '';
      
      const { data: pendingFix, error: fixError } = await supabase
        .from('pending_fixes')
        .insert({
          issue_id: request.issue_id,
          file_path: request.file_path,
          fix_prompt: fixPrompt,
          fixed_code: fixedCode,
          confidence: request.confidence,
          status: 'generated',
          ai_model: 'google/gemini-2.5-flash',
          generation_metadata: {
            tokens_used: aiData.usage?.total_tokens,
            model: aiData.model
          }
        })
        .select()
        .single();
      
      if (fixError) throw fixError;
      
      return new Response(JSON.stringify({
        success: true,
        fix_id: pendingFix.id,
        fixed_code: fixedCode,
        confidence: request.confidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'get_pending_fixes') {
      const threshold = auto_apply_threshold || 0.85;
      
      const { data: fixes, error } = await supabase
        .from('pending_fixes')
        .select(`
          *,
          code_issues (*)
        `)
        .eq('status', 'generated')
        .gte('confidence', threshold)
        .order('confidence', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        fixes: fixes || [],
        threshold
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'apply_fix') {
      const { fix_id, approved_by } = fix_request;
      
      const { error } = await supabase
        .from('pending_fixes')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          approved_by: approved_by || 'auto'
        })
        .eq('id', fix_id);
      
      if (error) throw error;
      
      // Also mark the issue as resolved
      const { data: fix } = await supabase
        .from('pending_fixes')
        .select('issue_id')
        .eq('id', fix_id)
        .single();
      
      if (fix?.issue_id) {
        await supabase
          .from('code_issues')
          .update({
            resolved_at: new Date().toISOString(),
            fix_applied: true
          })
          .eq('id', fix.issue_id);
      }
      
      return new Response(JSON.stringify({
        success: true,
        fix_id,
        status: 'applied'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'get_stats') {
      const { data: issues } = await supabase
        .from('code_issues')
        .select('id, severity, resolved_at, auto_fixable')
        .order('detected_at', { ascending: false })
        .limit(100);
      
      const { data: fixes } = await supabase
        .from('pending_fixes')
        .select('id, status, confidence')
        .order('generated_at', { ascending: false })
        .limit(100);
      
      const { data: runs } = await supabase
        .from('auto_heal_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      const stats = {
        total_issues: issues?.length || 0,
        unresolved_issues: issues?.filter(i => !i.resolved_at).length || 0,
        auto_fixable: issues?.filter(i => i.auto_fixable).length || 0,
        critical_issues: issues?.filter(i => i.severity === 'critical').length || 0,
        pending_fixes: fixes?.filter(f => f.status === 'pending' || f.status === 'generated').length || 0,
        applied_fixes: fixes?.filter(f => f.status === 'applied').length || 0,
        high_confidence_fixes: fixes?.filter(f => f.confidence >= 0.85).length || 0,
        recent_runs: runs || []
      };
      
      return new Response(JSON.stringify({
        success: true,
        stats
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[AutoHeal] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateFixPrompt(request: FixRequest): string {
  return `## Code Issue Fix Request

**File:** ${request.file_path}
**Issue:** ${request.issue_description}
**Confidence:** ${(request.confidence * 100).toFixed(0)}%

### Instructions:
1. Analyze the issue described above
2. Generate a minimal, targeted fix
3. Preserve all existing functionality
4. Follow TypeScript/React best practices
5. Ensure the fix is production-ready

### Expected Output:
Provide ONLY the fixed code that should replace the problematic section.
Include necessary imports if adding new dependencies.
Do not include explanations - just the code.`;
}
