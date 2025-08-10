import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { budget, location = "Kenya", preferences = "" } = await req.json();
    
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
        'HTTP-Referer': 'https://your-site.com',
        'X-Title': 'House Plan Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert Kenyan architect who generates realistic, buildable house plans with accurate cost breakdowns based on current Kenyan construction costs.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      console.error(`OpenRouter API error: ${response.status}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    console.log('AI Response received:', aiContent.substring(0, 200) + '...');
    
    // Try to parse JSON, fallback to structured response if needed
    let planData;
    try {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = aiContent.match(/```json\n(.*?)\n```/s) || aiContent.match(/\{.*\}/s);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiContent;
      planData = JSON.parse(jsonString);
      
      // Ensure we have an ID
      planData.id = `ai-plan-${budget}-${Date.now()}`;
      planData.budget = budget;
      
      console.log('Successfully parsed AI-generated plan');
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback plan:', parseError);
      
      // Create a structured fallback if JSON parsing fails
      const bedrooms = budget < 1000000 ? 2 : budget < 3000000 ? 3 : budget < 8000000 ? 4 : 5;
      const size = budget < 1000000 ? 50 : budget < 3000000 ? 100 : budget < 8000000 ? 150 : 250;
      
      planData = {
        id: `ai-plan-${budget}-${Date.now()}`,
        budget,
        houseType: `${bedrooms}-Bedroom AI-Generated House`,
        style: "Modern Kenyan",
        bedrooms,
        size,
        plotSize: size * 4,
        roofing: "Mabati (iron sheets)",
        interiorFinish: "Ceramic tiles",
        costBreakdown: {
          land: Math.floor(budget * 0.25),
          foundation: Math.floor(budget * 0.12),
          walls: Math.floor(budget * 0.30),
          roofing: Math.floor(budget * 0.15),
          windows: Math.floor(budget * 0.08),
          interior: Math.floor(budget * 0.20),
          plumbing: Math.floor(budget * 0.10),
          electrical: Math.floor(budget * 0.08),
          labour: Math.floor(budget * 0.25),
          permits: Math.floor(budget * 0.03),
          furniture: Math.floor(budget * 0.10),
          landscaping: Math.floor(budget * 0.05)
        },
        timeline: `${Math.ceil(size / 25)} months`,
        notes: [
          "💡 AI-generated plan based on your budget",
          "📋 Consider getting multiple contractor quotes",
          "🏛️ Ensure compliance with local building codes"
        ],
        aiPrompts: [
          `Modern ${bedrooms}-bedroom house in Kenya, realistic architecture, natural lighting`,
          `Exterior view of affordable Kenyan home, well-designed and practical`,
          `Interior of comfortable Kenyan house with natural materials`
        ],
        recommendations: "AI-powered architectural recommendations",
        costOptimization: "Smart cost-saving suggestions",
        materials: "Climate-appropriate material recommendations"
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      plan: planData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-house-plan function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});