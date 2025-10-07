import React, { useState } from 'react';
import { Message } from './ChatBox';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
      <div className={`max-w-4xl w-full ${isUser ? 'ml-16' : 'mr-16'}`}>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          {!isUser && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg 
                className="w-7 h-7 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
          
          {/* Message Content */}
          <div className="flex-1">
            <div 
              className={`rounded-3xl px-8 py-6 ${
                isUser 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto max-w-2xl shadow-xl' 
                  : 'bg-gray-900 text-gray-100 border border-gray-800 shadow-lg backdrop-blur-sm'
              }`}
            >
              <div className="prose prose-lg max-w-none prose-invert">
                <div className="whitespace-pre-wrap break-words leading-relaxed font-light">
                  {message.content}
                </div>
              </div>
            </div>
            
            {/* Metadata for assistant messages */}
            {!isUser && message.metadata && (
              <div className="mt-4 ml-4">
                <button
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-sm text-gray-500 hover:text-gray-400 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <svg 
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      showMetadata ? 'rotate-90' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                  Processing details
                  {message.metadata.latency && (
                    <span className="ml-2 px-2 py-1 bg-gray-800 rounded-full text-xs">
                      {message.metadata.latency}ms
                    </span>
                  )}
                </button>
                
                {showMetadata && (
                  <div className="mt-4 p-6 bg-gray-900 border border-gray-800 rounded-2xl text-sm space-y-4 backdrop-blur-sm">
                    {message.metadata.steps && message.metadata.steps.length > 0 && (
                      <div>
                        <div className="font-medium text-gray-300 mb-3 text-base">Processing Steps</div>
                        <ol className="list-decimal list-inside space-y-2 text-gray-400">
                          {message.metadata.steps.map((step, index) => (
                            <li key={index} className="leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {message.metadata.toolCalls && message.metadata.toolCalls.length > 0 && (
                      <div>
                        <div className="font-medium text-gray-300 mb-3 text-base">Tools Used</div>
                        <div className="flex flex-wrap gap-3">
                          {message.metadata.toolCalls.map((tool, index) => (
                            <span 
                              key={index}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-blue-100 rounded-full text-sm font-medium shadow-lg"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.metadata.latency && (
                      <div className="pt-2 border-t border-gray-800">
                        <span className="font-medium text-gray-300">Response Time: </span>
                        <span className="text-gray-400">{message.metadata.latency}ms</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* User Avatar */}
          {isUser && (
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg 
                className="w-7 h-7 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}