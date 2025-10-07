import React from 'react';
import { Message } from './ChatBox';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className = '' }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="relative mb-8 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-float relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
              <svg 
                className="w-12 h-12 text-white drop-shadow-lg relative z-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
          <h1 className="text-4xl font-extralight text-white mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Hello
            </span>
          </h1>
          <p className="text-gray-400 text-lg font-light leading-relaxed animate-slide-up opacity-80" style={{ animationDelay: '0.4s' }}>
            How can I assist you today?
          </p>
          <div className="mt-8 flex justify-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto px-8 py-8 space-y-8 ${className} scroll-smooth`}>
      <style jsx>{`
        /* Custom scrollbar for smooth experience */
        .scroll-smooth::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-smooth::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-smooth::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 3px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
      `}</style>
      {messages.map((message, index) => (
        <div 
          key={message.id} 
          className="animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <MessageItem message={message} />
        </div>
      ))}
    </div>
  );
}