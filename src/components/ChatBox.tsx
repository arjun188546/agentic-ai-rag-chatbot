import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { LoadingIndicator } from './LoadingIndicator';
import { sendChatMessage, formatApiError, validateMessage, formatConversationHistory } from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    steps?: string[];
    latency?: number;
    toolCalls?: string[];
  };
}

interface ChatBoxProps {
  className?: string;
}

export function ChatBox({ className = '' }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const validation = validateMessage(content);
    if (!validation.valid) {
      console.error('Message validation failed:', validation.error);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = formatConversationHistory(messages);
      const response = await sendChatMessage(content.trim(), conversationHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          steps: response.steps || [],
          latency: response.latency || 0,
          toolCalls: response.toolCalls || [],
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatApiError(error),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-black overflow-hidden ${className}`}>
      {/* Header with subtle animation */}
      <div className="bg-black border-b border-gray-800/50 px-8 py-6 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extralight text-white tracking-widest text-center animate-fade-in relative">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              RAG
            </span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
          </h1>
        </div>
      </div>

      {/* Messages Container with smooth transitions */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-30 pointer-events-none z-10" />
        <MessageList 
          messages={messages} 
          className="h-full relative z-20"
        />
        {isLoading && (
          <div className="px-8 py-6 relative z-30 animate-slide-up">
            <LoadingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with enhanced styling */}
      <div className="bg-black/95 border-t border-gray-800/50 backdrop-blur-xl relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent opacity-50" />
        <InputArea 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          className="p-8"
        />
      </div>
    </div>
  );
}