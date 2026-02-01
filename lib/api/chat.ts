// Client-side chat must always go through the Next.js proxy.
// The browser must never talk to the Gateway directly (no token exposure).
function getApiUrl(): string {
  return '/api/chat-bridge';
}

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
  // model is kept for UI compatibility, but in bridge mode the canonical session
  // owns the real model selection.
  model: string;
  messages: ChatMessage[];
  onToken: StreamCallback;
  onError: ErrorCallback;
  onComplete: CompleteCallback;
}

export async function sendMessage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  model,
  messages,
  onToken,
  onError,
  onComplete,
}: SendMessageOptions): Promise<void> {
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // In bridge mode, we send only the latest user message into the canonical session.
        // The server bridges it into the Telegram DM session.
        message: messages[messages.length - 1]?.content ?? '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const reply = String(data?.reply ?? '');
    if (reply) onToken(reply);
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
