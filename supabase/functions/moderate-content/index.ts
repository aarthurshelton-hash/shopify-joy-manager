import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of blocked words and patterns for text moderation
const BLOCKED_PATTERNS = [
  // Profanity and slurs (examples - should be expanded)
  /\b(f+u+c+k+|sh+i+t+|a+s+s+h+o+l+e+|b+i+t+c+h+|c+u+n+t+|d+i+c+k+|n+i+g+g+|f+a+g+|r+e+t+a+r+d+)\b/gi,
  // Hate speech patterns
  /\b(kill\s*(all|the)|death\s*to|exterminate)\b/gi,
  // Sexual content
  /\b(porn|xxx|sex|nude|naked)\b/gi,
  // Violence threats
  /\b(bomb|terrorist|shoot|murder)\b/gi,
];

// Characters commonly used to evade filters
const EVASION_REPLACEMENTS: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace common evasion characters
  for (const [char, replacement] of Object.entries(EVASION_REPLACEMENTS)) {
    normalized = normalized.split(char).join(replacement);
  }
  
  // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  // Remove spaces between characters that might be evasion
  normalized = normalized.replace(/\s+/g, '');
  
  return normalized;
}

function checkText(text: string): { safe: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  const normalizedText = normalizeText(text);
  const originalLower = text.toLowerCase();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalizedText) || pattern.test(originalLower)) {
      return { 
        safe: false, 
        reason: 'Content contains inappropriate language or themes' 
      };
    }
  }

  return { safe: true };
}

async function moderateImage(imageBase64: string): Promise<{ safe: boolean; reason?: string }> {
  // Use Lovable AI for image moderation
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, skipping AI image moderation');
    return { safe: true };
  }

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image for content moderation. Is this image safe for a family-friendly chess visualization platform? 

Check for:
1. Nudity or sexual content
2. Violence, gore, or disturbing imagery
3. Hate symbols or offensive gestures
4. Profanity or offensive text in the image
5. Drug-related content

Respond with ONLY a JSON object in this exact format:
{"safe": true} or {"safe": false, "reason": "brief explanation"}

Do not include any other text, markdown formatting, or code blocks.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('Image moderation API error:', await response.text());
      // Fail open - allow if moderation service fails
      return { safe: true };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { safe: true };
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content;
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    try {
      const result = JSON.parse(cleanContent);
      return {
        safe: result.safe === true,
        reason: result.reason,
      };
    } catch {
      console.error('Failed to parse moderation response:', content);
      return { safe: true };
    }
  } catch (error) {
    console.error('Image moderation error:', error);
    // Fail open - allow if moderation fails
    return { safe: true };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content } = await req.json();

    if (type === 'text') {
      const result = checkText(content);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'image') {
      const result = await moderateImage(content);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid content type. Use "text" or "image"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: 'Moderation service error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
