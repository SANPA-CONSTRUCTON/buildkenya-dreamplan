import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Missing HUGGING_FACE_ACCESS_TOKEN' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { houseType, style, roofing, interiorFinish, bedrooms, size, plotSize, location = 'Kenya' } = await req.json();

    const system = 'You are a Kenyan architectural visual prompt expert. Generate succinct, high-quality prompts for image models. Output JSON array of 3 strings only.';
    const user = `Create 3 diverse visual prompts for a ${bedrooms}-bedroom ${style} house (type: ${houseType}) in ${location}. Roofing: ${roofing}. Interior: ${interiorFinish}. Size: ${size}m² on ${plotSize}m² plot. Focus on realistic materials, lighting, and camera angles. Return only a JSON array of strings.`

    const hf = new HfInference(token);
    const res: any = await hf.textGeneration({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      inputs: `${system}\n\n${user}`,
      parameters: { max_new_tokens: 600, temperature: 0.7 }
    });

    const txt = res?.generated_text || '';
    const jsonMatch = txt.match(/\[[\s\S]*\]/s);
    const prompts: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [
      `Exterior ${houseType.toLowerCase()} in ${location}, ${style.toLowerCase()} style, ${roofing.toLowerCase()} roof, natural light, landscaping, photorealistic`,
      `Interior living room of a ${style.toLowerCase()} ${bedrooms}-bedroom house, ${interiorFinish.toLowerCase()} floors, Kenyan context, soft daylight, realistic`,
      `Aerial view of ${size}m² house on ${plotSize}m² plot in ${location}, driveway, garden, modern materials, high detail`
    ];

    return new Response(JSON.stringify({ success: true, prompts: prompts.slice(0, 3) }), {
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
