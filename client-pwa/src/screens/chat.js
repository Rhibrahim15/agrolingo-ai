export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Read the SECURE environment variable (Notice there is NO VITE_ prefix)
  // This lives exclusively on Vercel's secure servers!
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: { message: "Server configuration error: Missing API Key in Vercel" } });
  }

  try {
    const modelName = 'anthropic/claude-3.5-sonnet,openai/gpt-4o,meta-llama/llama-3.2-90b-vision-instruct';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://agrolingo-ai.vercel.app',
        'X-Title': 'AgroLingo AI'
      },
      body: JSON.stringify({
        models: modelName.split(','),
        messages: req.body.messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}