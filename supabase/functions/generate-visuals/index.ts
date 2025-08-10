import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    const { prompts, model = 'black-forest-labs/FLUX.1-schnell' } = await req.json();

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'prompts must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hf = new HfInference(token);

    const images: string[] = [];
for (const p of prompts.slice(0, 3)) {
      const image = await hf.textToImage({ inputs: p, model });
      const arrayBuffer = await image.arrayBuffer();
      const base64 = b64encode(new Uint8Array(arrayBuffer));
      images.push(`data:image/png;base64,${base64}`);
    }

    return new Response(JSON.stringify({ success: true, images }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-visuals function:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
