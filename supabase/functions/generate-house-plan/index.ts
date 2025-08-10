import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Helper to distribute budget deterministically and sum exactly to budget
  const buildFallbackPlan = (budget: number, location: string, preferences: string) => {
    const bedrooms = budget < 1_000_000 ? 2 : budget < 3_000_000 ? 3 : budget < 8_000_000 ? 4 : 5;
    const size = budget < 1_000_000 ? 50 : budget < 3_000_000 ? 100 : budget < 8_000_000 ? 150 : 250;

    // Weights must sum to 1.0
    const weights: Record<string, number> = {
      land: 0.20,
      foundation: 0.10,
      walls: 0.18,
      roofing: 0.12,
      windows: 0.05,
      interior: 0.10,
      plumbing: 0.06,
      electrical: 0.06,
      labour: 0.08,
      permits: 0.02,
      furniture: 0.02,
      landscaping: 0.01,
    };

    // First pass rounding
    const categories = Object.keys(weights);
    const breakdown: Record<string, number> = {};
    let allocated = 0;
    for (const key of categories) {
      const amount = Math.floor(budget * weights[key]);
      breakdown[key] = amount;
      allocated += amount;
    }
    // Adjust the last category to hit exact budget
    const lastKey = categories[categories.length - 1];
    breakdown[lastKey] += Math.max(0, budget - allocated);

    return {
      id: `ai-plan-${budget}-${Date.now()}`,
      budget,
      houseType: `${bedrooms}-Bedroom AI-Generated House`,
      style: "Modern Kenyan",
      bedrooms,
      size,
      plotSize: size * 4,
      roofing: "Mabati (iron sheets)",
      interiorFinish: "Ceramic tiles",
      costBreakdown: breakdown,
      timeline: `${Math.max(4, Math.ceil(size / 25))} months`,
      notes: [
        "AI template used due to upstream error",
        "Consider getting multiple contractor quotes",
        "Ensure compliance with local building codes",
      ],
      aiPrompts: [
        `Modern ${bedrooms}-bedroom house in ${location}, realistic architecture, natural lighting`,
        `Exterior view of affordable Kenyan home, practical layout, durable materials`,
        `Interior of comfortable Kenyan house with natural materials, bright daylight`,
      ],
      recommendations: "Template-based recommendations tailored from your budget.",
      costOptimization: "Use local materials, optimize spans to reduce steel, standardize window/door sizes.",
      materials: "Stabilized soil blocks or concrete blocks, mabati roofing, UPVC windows, ceramic tiles",
      _fallbackReason: '',
    };
  };

  try {
    const { budget, location = "Kenya", preferences = "" } = await req.json();

    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid budget provided',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prefer OpenRouter if available; otherwise fall back to Hugging Face LLM
    if (!openRouterApiKey) {
      if (hfToken) {
        try {
          const hf = new HfInference(hfToken);
          const hfRes: any = await hf.textGeneration({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
            inputs: prompt,
            parameters: { max_new_tokens: 1200, temperature: 0.6 }
          });
          const aiContent = hfRes?.generated_text || '';
          const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/s) || aiContent.match(/\{[\s\S]*\}/s);
          const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
          const planData = JSON.parse(jsonString);
          planData.id = `ai-plan-${budget}-${Date.now()}`;
          planData.budget = budget;
          return new Response(JSON.stringify({ success: true, plan: planData, meta: { source: 'huggingface' } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (e) {
          console.error('Hugging Face generation failed:', e);
        }
      }
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = 'Missing OPENROUTER_API_KEY and HF fallback failed or missing token';
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating house plan for budget: KES ${budget}`);

    const prompt = `You are an expert Kenyan architect and construction consultant. Generate a comprehensive house plan for a budget of KES ${budget.toLocaleString()} in ${location}.

Additional preferences: ${preferences}

Consider Kenyan building costs, materials, labor rates, permits, and regulations. Provide realistic and buildable recommendations.

Respond with a JSON object containing:
{
  "houseType": "descriptive house type (e.g., 3-Bedroom Modern Family House)",
  "style": "architectural style",
  "bedrooms": number,
  "size": number (square meters),
  "plotSize": number (square meters for the plot),
  "roofing": "roofing material type",
  "interiorFinish": "interior finish type",
  "costBreakdown": {
    "land": number,
    "foundation": number,
    "walls": number,
    "roofing": number,
    "windows": number,
    "interior": number,
    "plumbing": number,
    "electrical": number,
    "labour": number,
    "permits": number,
    "furniture": number,
    "landscaping": number
  },
  "timeline": "construction timeline (e.g., 6-8 months)",
  "notes": ["practical tip 1", "practical tip 2", "practical tip 3"],
  "aiPrompts": ["detailed AI image prompt 1", "detailed AI image prompt 2", "detailed AI image prompt 3"],
  "recommendations": "architectural recommendations specific to this budget",
  "costOptimization": "specific cost-saving suggestions",
  "materials": "recommended materials for Kenyan climate"
}

Ensure all costs add up to approximately the given budget. Make recommendations practical and achievable in Kenya.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        // Only X-Title is required; omit HTTP-Referer to avoid domain validation issues
        'X-Title': 'House Plan Generator',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are an expert Kenyan architect who generates realistic, buildable house plans with accurate cost breakdowns based on current Kenyan construction costs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} - ${errorText}`);
      // Try Hugging Face LLM as secondary provider when OpenRouter fails (e.g., 402 insufficient credits)
      if (hfToken) {
        try {
          const hf = new HfInference(hfToken);
          const hfRes: any = await hf.textGeneration({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
            inputs: prompt,
            parameters: { max_new_tokens: 1200, temperature: 0.6 }
          });
          const aiContentHF = hfRes?.generated_text || '';
          const jsonMatchHF = aiContentHF.match(/```json\n([\s\S]*?)\n```/s) || aiContentHF.match(/\{[\s\S]*\}/s);
          const jsonStringHF = jsonMatchHF ? (jsonMatchHF[1] || jsonMatchHF[0]) : aiContentHF;
          const planDataHF = JSON.parse(jsonStringHF);
          planDataHF.id = `ai-plan-${budget}-${Date.now()}`;
          planDataHF.budget = budget;
          return new Response(JSON.stringify({ success: true, plan: planDataHF, meta: { source: 'huggingface', reason: `OpenRouter failed: ${response.status}` } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (hfErr) {
          console.error('Hugging Face fallback failed:', hfErr);
        }
      }
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = `OpenRouter API error: ${response.status} - ${errorText}`;
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent || typeof aiContent !== 'string') {
      console.error('Invalid AI response structure');
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = 'Invalid AI response structure';
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI Response received:', aiContent.substring(0, 200) + '...');

    // Try to parse JSON, fallback to structured response if needed
    let planData: any;
    try {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = aiContent.match(/```json\n(.*?)\n```/s) || aiContent.match(/\{[\s\S]*\}/s);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      planData = JSON.parse(jsonString);

      // Ensure we have an ID and budget fields
      planData.id = `ai-plan-${budget}-${Date.now()}`;
      planData.budget = budget;

      return new Response(JSON.stringify({ success: true, plan: planData, meta: { source: 'openrouter' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('JSON parsing failed, returning fallback plan:', parseError);
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = 'AI returned non-JSON content';
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in generate-house-plan function:', error);
    // As a last resort, provide a fallback so the user still gets a plan and we surface the reason
    try {
      const { budget = 1_500_000, location = 'Kenya', preferences = '' } = await req.json().catch(() => ({}));
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = error?.message || 'Unknown error';
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});
