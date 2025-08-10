import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');


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

    if (!googleApiKey) {
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = 'Missing GOOGLE_API_KEY';
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;
    const gr = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
      })
    });

    if (!gr.ok) {
      const errText = await gr.text();
      console.error(`Google API error: ${gr.status} - ${errText}`);
      const plan = buildFallbackPlan(budget, location, preferences);
      plan._fallbackReason = `Google API error: ${gr.status}`;
      return new Response(JSON.stringify({ success: true, plan, meta: { source: 'fallback', reason: plan._fallbackReason } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gdata = await gr.json();
    const aiText = gdata?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || gdata?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let planData: any;
    try {
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/s) || aiText.match(/\{[\s\S]*\}/s);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText;
      planData = JSON.parse(jsonString);
      planData.id = `ai-plan-${budget}-${Date.now()}`;
      planData.budget = budget;

      return new Response(JSON.stringify({ success: true, plan: planData, meta: { source: 'google' } }), {
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
