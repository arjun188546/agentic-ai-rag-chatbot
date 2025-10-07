// API utility functions for the frontend
import type { Message } from '@/components/ChatBox';

export interface ApiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatApiRequest {
  message: string;
  conversationHistory: ApiMessage[];
}

export interface ChatApiResponse {
  response: string;
  steps?: string[];
  toolCalls?: string[];
  latency: number;
  success: boolean;
  error?: string;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

/**
 * Send a message to the chat API
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ApiMessage[] = []
): Promise<ChatApiResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        conversationHistory,
      }),
    });

    const data: ChatApiResponse = await response.json();

    if (!response.ok) {
      throw new ChatApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data.error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ChatApiError) {
      throw error;
    }

    // Network or other errors
    throw new ChatApiError(
      'Failed to connect to the chat service. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Check API health and configuration
 */
export async function checkApiHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  info?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const response = await fetch('/api/chat', {
      method: 'GET',
    });

    if (response.ok) {
      const info = await response.json();
      return { status: 'healthy', info };
    } else {
      return { 
        status: 'unhealthy', 
        error: `API returned ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Format error messages for user display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ChatApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the AI service. Please check your internet connection and try again.';
      case 'REQUEST_TIMEOUT':
        return 'The request took too long to process. Please try again with a shorter message.';
      case 'SERVICE_UNAVAILABLE':
        return 'The AI service is temporarily unavailable. Please try again in a few moments.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Validate message before sending
 */
export function validateMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Message is too long. Please keep it under 2000 characters.' };
  }

  return { valid: true };
}

/**
 * Convert conversation history to API format
 */
export function formatConversationHistory(messages: Message[]): ApiMessage[] {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));
}