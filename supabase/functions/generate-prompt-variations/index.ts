import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Using Google AI Studio only

    const { houseType, style, roofing, interiorFinish, bedrooms, size, plotSize, location = 'Kenya' } = await req.json();

    const system = 'You are a Kenyan architectural visual prompt expert. Generate succinct, high-quality prompts for image models. Output JSON array of 3 strings only.';
    const user = `Create 3 diverse visual prompts for a ${bedrooms}-bedroom ${style} house (type: ${houseType}) in ${location}. Roofing: ${roofing}. Interior: ${interiorFinish}. Size: ${size}m² on ${plotSize}m² plot. Focus on realistic materials, lighting, and camera angles. Return only a JSON array of strings.`

    // 1) Try Google AI Studio (Gemini) first
    if (googleApiKey) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;
        const gr = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${system}\n\n${user}\n\nReturn only a JSON array of 3 strings.` }] }
            ],
            generationConfig: { temperature: 0.6, maxOutputTokens: 800 }
          })
        });

        if (gr.ok) {
          const gdata = await gr.json();
          const text = gdata?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || gdata?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const matchG = text?.match(/\[[\s\S]*\]/s);
          const promptsG: string[] = matchG ? JSON.parse(matchG[0]) : [];
          if (Array.isArray(promptsG) && promptsG.length) {
            return new Response(JSON.stringify({ success: true, prompts: promptsG.slice(0, 3), meta: { source: 'google' } }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.error('Google returned non-array response:', text);
        } else {
          const errText = await gr.text();
          console.error(`Google error: ${gr.status} - ${errText}`);
        }
      } catch (e) {
        console.error('Google call failed:', e);
      }
    }



    // 3) Final static prompts fallback
    const fallback = [
      `Exterior ${houseType.toLowerCase()} in ${location}, ${style.toLowerCase()} style, ${roofing.toLowerCase()} roof, natural light, landscaping, photorealistic`,
      `Interior living room of a ${style.toLowerCase()} ${bedrooms}-bedroom house, ${interiorFinish.toLowerCase()} floors, Kenyan context, soft daylight, realistic`,
      `Aerial view of ${size}m² house on ${plotSize}m² plot in ${location}, driveway, garden, modern materials, high detail`
    ];
    return new Response(JSON.stringify({ success: true, prompts: fallback, meta: { source: 'fallback', reason: 'No AI provider available' } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-prompt-variations:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
