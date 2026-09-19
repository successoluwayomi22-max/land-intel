import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
            {label}
            {props.required && <span className="text-brand-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-input text-sm text-brand-textPrimary placeholder:text-brand-textMuted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed ${
              rightElement ? "pr-11" : ""
            } ${
              error ? "border-brand-danger ring-1 ring-brand-danger" : "border-brand-border"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-brand-danger font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-brand-textSecondary leading-relaxed break-words">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
