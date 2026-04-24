// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// You will set this in your Supabase Dashboard:
// supabase secrets set OPENAI_API_KEY=sk-...
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, imageUrl, lang } = await req.json();

    // Prepare the system prompt instructing the AI how to behave
    const systemPrompt = `
      You are AgroLingo AI, a highly advanced, expert agricultural assistant designed to help farmers in Africa.
      You must reply in the language requested: ${lang === 'ha' ? 'Hausa' : lang === 'fr' ? 'French' : 'English'}.
      Provide practical, localized advice regarding crop diseases, weather impact, and market strategies.
      Keep answers concise, professional, and easy to read. Use emojis sparingly.
    `;

    const userContent: any[] = [{ type: 'text', text: message || "Analyze this image." }];

    // If the frontend passed an image (e.g., a scanned crop leaf), append it to the GPT-4o vision request
    if (imageUrl) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    // Call OpenAI API (GPT-4o supports both text and vision)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing AI chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});