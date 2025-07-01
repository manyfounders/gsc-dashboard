import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};

interface SiteCardSkeletonProps {
  className?: string;
}

export const SiteCardSkeleton: React.FC<SiteCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-xl ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-4 h-4 rounded mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-20 mb-3" />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white rounded p-2 border border-gray-200">
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="bg-white rounded p-2 border border-gray-200">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="bg-white rounded p-2 border border-gray-200">
              <Skeleton className="h-3 w-6 mb-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 