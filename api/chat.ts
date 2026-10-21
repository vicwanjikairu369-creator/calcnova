// Vercel serverless function — runs on the server, not in the browser.
// Configure OPENAI_API_KEY in Vercel's project environment variables.
// If the key is missing, this endpoint returns 501 so the client falls
// back to the offline engine.

export const config = { runtime: 'edge' };

interface Body {
  question?: string;
}

const SYSTEM_PROMPT = `You are the CalcNova math assistant.
Rules:
- Always compute precisely. Never guess a numeric result.
- If the user's request is not a maths question you can answer reliably, say so plainly.
- Show working briefly when it helps; otherwise give the direct answer.
- Never claim a value is exact if it is approximate.
- Do not invent units, currencies or live data.
Keep answers under 200 words.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'Online assistant not configured. Set OPENAI_API_KEY in Vercel environment variables.',
      }),
      { status: 501, headers: { 'content-type': 'application/json' } },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const question = (body.question ?? '').trim();
  if (!question) {
    return new Response(JSON.stringify({ error: 'Empty question' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (question.length > 2000) {
    return new Response(JSON.stringify({ error: 'Question too long' }), {
      status: 413,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error ${upstream.status}` }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? '(No response)';

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Assistant request failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}