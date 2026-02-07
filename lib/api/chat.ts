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

// --- Bridge polling via /api/chat-bridge ---

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
  // Gateway /v1/chat/completions is no longer available (HTTP API removed).
  // Use the bridge path which communicates via /tools/invoke (sessions_send).
  try {
    await sendBridgeMessage(options);
  } catch (bridgeError) {
    options.onError(
      bridgeError instanceof Error ? bridgeError : new Error(String(bridgeError))
    );
  }
}
