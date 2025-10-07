import React, { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function InputArea({ onSendMessage, disabled = false, className = '' }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
        <div className="flex items-end gap-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={disabled}
              rows={1}
              className={`
                w-full resize-none rounded-3xl border border-gray-800 px-6 py-4 pr-16
                bg-gray-900 text-white placeholder-gray-500
                focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50
                max-h-32 overflow-y-auto font-light text-lg
                transition-all duration-200 backdrop-blur-sm
                ${disabled ? 'bg-gray-800' : 'bg-gray-900 hover:bg-gray-800/80'}
              `}
              style={{ minHeight: '56px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || !input.trim() || input.length > 2000}
            className={`
              flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200
              ${
                disabled || !input.trim() || input.length > 2000
                  ? 'bg-gray-800 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {disabled ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            )}
          </button>
        </div>
        
        {/* Quick suggestions */}
        {input.length === 0 && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {[
              "Explain machine learning",
              "Latest in AI research",
              "Cloud security best practices",
              "Web development trends"
            ].map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setInput(suggestion)}
                disabled={disabled}
                className="px-6 py-3 text-sm bg-gray-900 hover:bg-gray-800 disabled:hover:bg-gray-900 disabled:opacity-50 rounded-2xl text-gray-300 border border-gray-800 transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm font-light"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Input validation */}
        {input.length > 1800 && (
          <div className="mt-3 text-sm text-amber-400 text-center">
            Approaching character limit ({input.length}/2000)
          </div>
        )}
        
        {input.length > 2000 && (
          <div className="mt-3 text-sm text-red-400 text-center">
            Message too long. Please shorten your message.
          </div>
        )}
      </form>
    </div>
  );
}