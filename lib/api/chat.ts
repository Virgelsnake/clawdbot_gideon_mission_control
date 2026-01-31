const API_BASE_URL = process.env.NEXT_PUBLIC_CLAWDBOT_API_URL || 'http://127.0.0.1:18789';
const USE_PROXY = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';

function getApiUrl(): string {
  if (USE_PROXY) {
    return '/api/chat';
  }
  return `${API_BASE_URL}/v1/chat/completions`;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

export type StreamCallback = (token: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = () => void;

export interface SendMessageOptions {
  model: string;
  messages: ChatMessage[];
  onToken: StreamCallback;
  onError: ErrorCallback;
  onComplete: CompleteCallback;
  apiToken?: string;
}

export async function sendMessage({
  model,
  messages,
  onToken,
  onError,
  onComplete,
  apiToken,
}: SendMessageOptions): Promise<void> {
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Process SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(':')) continue;
        
        // SSE data lines start with "data: "
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          
          // Check for stream end
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const chunk: ChatCompletionChunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              onToken(content);
            }
          } catch {
            // Skip malformed JSON
            console.warn('Failed to parse SSE chunk:', data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
