import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    const { houseType, style, roofing, interiorFinish, bedrooms, size, plotSize, location = 'Kenya' } = await req.json();

    const system = 'You are a Kenyan architectural visual prompt expert. Generate succinct, high-quality prompts for image models. Output JSON array of 3 strings only.';
    const user = `Create 3 diverse visual prompts for a ${bedrooms}-bedroom ${style} house (type: ${houseType}) in ${location}. Roofing: ${roofing}. Interior: ${interiorFinish}. Size: ${size}m² on ${plotSize}m² plot. Focus on realistic materials, lighting, and camera angles. Return only a JSON array of strings.`

    // 1) Try OpenRouter first (primary provider)
    if (openRouterApiKey) {
      try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Prompt Variations Generator'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ],
            temperature: 0.6,
            max_tokens: 800
          })
        });

        if (orRes.ok) {
          const data = await orRes.json();
          const content = data.choices?.[0]?.message?.content || '';
          const match = content.match(/\[[\s\S]*\]/s);
          const prompts: string[] = match ? JSON.parse(match[0]) : [];
          if (Array.isArray(prompts) && prompts.length) {
            return new Response(JSON.stringify({ success: true, prompts: prompts.slice(0, 3), meta: { source: 'openrouter' } }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.error('OpenRouter returned non-array response:', content);
        } else {
          const errText = await orRes.text();
          console.error(`OpenRouter error: ${orRes.status} - ${errText}`);
        }
      } catch (e) {
        console.error('OpenRouter call failed:', e);
      }
    }

    // 2) Fallback to Hugging Face LLM if available
    if (token) {
      try {
        const hf = new HfInference(token);
        const res: any = await hf.textGeneration({
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          inputs: `${system}\n\n${user}`,
          parameters: { max_new_tokens: 600, temperature: 0.7 }
        });
        const txt = res?.generated_text || '';
        const match = txt.match(/\[[\s\S]*\]/s);
        const prompts: string[] = match ? JSON.parse(match[0]) : [];
        if (Array.isArray(prompts) && prompts.length) {
          return new Response(JSON.stringify({ success: true, prompts: prompts.slice(0, 3), meta: { source: 'huggingface' } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('HF returned non-array response:', txt);
      } catch (e) {
        console.error('Hugging Face call failed:', e);
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
