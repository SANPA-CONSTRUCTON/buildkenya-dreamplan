import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    const { prompts, model = 'black-forest-labs/FLUX.1-schnell' } = await req.json();

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'prompts must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prefer Google Gemini Image Generation if available
    if (googleApiKey) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleApiKey}`;
        const images: string[] = [];
        for (const p of prompts.slice(0, 3)) {
          const payload = {
            contents: [
              { role: 'user', parts: [{ text: `Generate a photorealistic architectural image. ${p}` }] }
            ],
            generationConfig: { responseModalities: ['TEXT','IMAGE'] }
          };
          const gr = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!gr.ok) {
            console.error('Google image gen error:', gr.status, await gr.text());
            continue;
          }
          const gdata = await gr.json();
          const parts = gdata?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            const data = part?.inline_data?.data;
            const mime = part?.inline_data?.mime_type || 'image/png';
            if (data) {
              images.push(`data:${mime};base64,${data}`);
              break;
            }
          }
        }
        if (images.length) {
          return new Response(JSON.stringify({ success: true, images, meta: { provider: 'google' } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error('Google image generation failed:', e);
      }
    }

    // Fallback to Hugging Face if token available
    if (token) {
      const hf = new HfInference(token);
      const images: string[] = [];
      for (const p of prompts.slice(0, 3)) {
        const image = await hf.textToImage({ inputs: p, model });
        const arrayBuffer = await image.arrayBuffer();
        const base64 = b64encode(new Uint8Array(arrayBuffer));
        images.push(`data:image/png;base64,${base64}`);
      }
      return new Response(JSON.stringify({ success: true, images, meta: { provider: 'huggingface', model } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'No image provider configured. Please add GOOGLE_API_KEY or HUGGING_FACE_ACCESS_TOKEN.' }), {
      status: 500,
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
