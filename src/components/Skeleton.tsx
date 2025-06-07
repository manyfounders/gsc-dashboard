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
    <div className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-6 w-8" />
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <Skeleton className="h-4 w-8 mb-2" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}; 