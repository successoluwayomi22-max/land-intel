import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-dashed border-brand-border rounded-card ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-brand-textMuted mb-4">
        {icon || <FolderSearch className="w-6 h-6 text-brand-textSecondary" />}
      </div>
      <h4 className="text-base font-bold text-brand-textPrimary font-heading">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-brand-textSecondary max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <a
            href={actionHref}
            className="inline-flex items-center justify-center font-medium rounded-button transition-all px-4 py-2 text-sm bg-brand-blue hover:bg-brand-blueHover text-white shadow-subtle"
          >
            {actionLabel}
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
};
