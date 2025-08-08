import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`skeleton-shimmer ${className}`} />;
};

interface SiteCardSkeletonProps {
  className?: string;
}

export const SiteCardSkeleton: React.FC<SiteCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`px-4 py-4 transition-all duration-300 skeleton-card ${className}`}>
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Website Column */}
        <div className="col-span-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-50 skeleton-pulse"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full skeleton-gradient"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 skeleton-gradient rounded mb-1"></div>
                <div className="h-3 w-24 skeleton-gradient rounded"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Metrics Columns */}
        <div className="col-span-2 text-center">
          <div className="h-4 w-12 skeleton-gradient rounded mx-auto mb-1"></div>
          <div className="h-3 w-8 skeleton-gradient rounded mx-auto"></div>
        </div>
        
        <div className="col-span-2 text-center">
          <div className="h-4 w-12 skeleton-gradient rounded mx-auto"></div>
        </div>
        
        <div className="col-span-2 text-center">
          <div className="h-4 w-8 skeleton-gradient rounded mx-auto"></div>
        </div>
        
        <div className="col-span-2 text-center">
          <div className="h-4 w-10 skeleton-gradient rounded mx-auto"></div>
        </div>

        {/* Comments Column */}
        <div className="col-span-1 text-center">
          <div className="h-5 w-6 skeleton-gradient rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className = '', 
  size = 'md',
  text = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const innerSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className="relative mx-auto">
        <div className={`${sizeClasses[size]} rounded-full bg-slate-100 flex items-center justify-center loading-spinner-glow`}>
          <div className={`${innerSizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center inner-pulse`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 spinner-smooth ${sizeClasses[size]}`}></div>
      </div>
      {text && (
        <div className="mt-4">
          <p className={`loading-spinner-text ${textSizeClasses[size]}`}>{text}</p>
        </div>
      )}
    </div>
  );
}; 