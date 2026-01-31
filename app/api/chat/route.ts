import { NextRequest } from 'next/server';

const CLAWDBOT_API_URL = process.env.CLAWDBOT_API_URL || 'http://127.0.0.1:18789';
const CLAWDBOT_API_TOKEN = process.env.CLAWDBOT_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${CLAWDBOT_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CLAWDBOT_API_TOKEN && { 'Authorization': `Bearer ${CLAWDBOT_API_TOKEN}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Stream the response back
    if (body.stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return Response.json(data);
    
  } catch (error) {
    console.error('Chat API proxy error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
