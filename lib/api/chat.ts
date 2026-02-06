// Client-side chat goes through Next.js API routes.
// Primary: /api/chat (SSE streaming via gateway)
// Fallback: /api/chat-bridge (polling via canonical session)

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
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
}

// --- SSE parser ---

async function consumeSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onToken: StreamCallback,
  onError: ErrorCallback,
  onComplete: CompleteCallback
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(':')) continue;

        // Handle data lines
        if (trimmed.startsWith('data:')) {
          const payload = trimmed.slice(5).trim();

          // [DONE] signal
          if (payload === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              onToken(delta);
            }
          } catch {
            // Non-JSON data line — skip
          }
        }

        // Handle SSE error events
        if (trimmed.startsWith('event:') && trimmed.includes('error')) {
          // Next data line will contain the error — handled above via JSON parse
        }
      }
    }

    // Stream ended without [DONE] — still complete
    onComplete();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// --- Primary: SSE streaming via /api/chat ---

async function sendStreamingMessage({
  model,
  messages,
  onToken,
  onError,
  onComplete,
}: SendMessageOptions): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    throw new Error('No response body for streaming');
  }

  const reader = response.body.getReader();
  await consumeSSEStream(reader, onToken, onError, onComplete);
}

// --- Fallback: bridge polling via /api/chat-bridge ---

async function sendBridgeMessage({
  messages,
  onToken,
  onComplete,
}: Pick<SendMessageOptions, 'messages' | 'onToken' | 'onComplete'>): Promise<void> {
  const response = await fetch('/api/chat-bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: messages[messages.length - 1]?.content ?? '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bridge error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const reply = String(data?.reply ?? '');
  if (reply) onToken(reply);
  onComplete();
}

// --- Public API ---

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  try {
    await sendStreamingMessage(options);
  } catch (streamError) {
    // If SSE streaming fails (gateway down, etc.), fall back to bridge
    console.warn('SSE streaming failed, falling back to bridge:', streamError);
    try {
      await sendBridgeMessage(options);
    } catch (bridgeError) {
      options.onError(
        bridgeError instanceof Error ? bridgeError : new Error(String(bridgeError))
      );
    }
  }
}
