import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200/80 ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white border border-brand-border rounded-card p-5 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-pill" />
    </div>
    <div className="space-y-2 pt-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="pt-3 border-t border-brand-border flex justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);
