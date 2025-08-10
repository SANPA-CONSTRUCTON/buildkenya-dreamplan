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

  try {
    const { budget, location = "Kenya", preferences = "" } = await req.json();

    const prompt = `You are an expert architect and construction consultant specializing in Kenyan housing development. Generate enhanced house plan recommendations for a budget of KES ${budget.toLocaleString()}.

Location: ${location}
Additional preferences: ${preferences}

Please provide:
1. Detailed architectural recommendations with specific Kenyan considerations
2. Cost optimization suggestions
3. Material recommendations suitable for Kenyan climate
4. Timeline insights
5. 3 highly detailed visual prompts for AI image generation that capture the essence of the recommended house design

Focus on practical, buildable solutions that maximize value within the budget while considering local building codes, climate, and available materials in Kenya.

Respond in JSON format with these fields:
{
  "recommendations": "detailed architectural advice",
  "costOptimization": "specific cost-saving suggestions",
  "materials": "recommended materials for Kenyan climate",
  "timeline": "construction timeline insights",
  "aiPrompts": ["prompt1", "prompt2", "prompt3"]
}`;

    if (!googleApiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing GOOGLE_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API error: ${response.status} - ${errText}`);
    }

    const gdata = await response.json();
    const aiContent = gdata?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || gdata?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON, fallback to structured text if needed
    let enhancedData;
    try {
      enhancedData = JSON.parse(aiContent);
    } catch {
      // If JSON parsing fails, create structured response
      enhancedData = {
        recommendations: aiContent.substring(0, 500),
        costOptimization: "AI-generated cost optimization suggestions",
        materials: "AI-recommended materials for Kenyan climate",
        timeline: "AI-enhanced timeline insights",
        aiPrompts: [
          "A modern Kenyan house with traditional touches, realistic architecture",
          "Exterior view of an affordable house in Kenya, well-designed and practical",
          "Interior of a comfortable Kenyan home, natural lighting and local materials"
        ]
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      enhancedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhance-plan-with-ai function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});