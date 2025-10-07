import React from 'react';

interface LoadingIndicatorProps {
  className?: string;
  message?: string;
}

export function LoadingIndicator({ 
  className = '', 
  message = 'Processing your request...' 
}: LoadingIndicatorProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <div className="flex items-center gap-6 p-6 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm">
        {/* Avatar */}
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
        
        <div className="flex items-center gap-4">
          {/* Typing animation */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          <span className="text-gray-300 font-light text-lg">{message}</span>
        </div>
      </div>
    </div>
  );
}

// Alternative detailed loading indicator for complex operations
export function DetailedLoadingIndicator({ 
  currentStep = 'Processing your request...',
  steps = [],
  className = '' 
}: {
  currentStep?: string;
  steps?: string[];
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <div>
          <div className="font-medium text-gray-900">Processing Request</div>
          <div className="text-sm text-gray-600">{currentStep}</div>
        </div>
      </div>
      
      {steps.length > 0 && (
        <div className="ml-11 space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Steps:</div>
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">{currentStep}</span>
          </div>
        </div>
      )}
    </div>
  );
}