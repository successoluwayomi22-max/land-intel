import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "outline-dark" | "dark" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps & { loadingText?: string }> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-button transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-semibold gap-1.5",
    md: "px-4 py-2 text-sm font-semibold gap-2",
    lg: "px-6 py-2.5 text-base font-bold gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-subtle hover:shadow-card focus:ring-emerald-500",
    secondary:
      "bg-brand-darkNavy hover:bg-slate-800 text-white shadow-subtle hover:shadow-card focus:ring-brand-darkNavy",
    outline:
      "border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold focus:ring-brand-blue shadow-2xs",
    "outline-dark":
      "border border-slate-700 hover:border-slate-600 bg-slate-900/95 hover:bg-slate-800 text-slate-100 hover:text-white font-semibold focus:ring-slate-500 shadow-2xs",
    dark:
      "border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-white shadow-subtle focus:ring-slate-600 font-semibold",
    ghost:
      "bg-transparent hover:bg-slate-100 text-brand-textPrimary focus:ring-slate-300",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-subtle focus:ring-rose-500",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-subtle focus:ring-emerald-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {isLoading && loadingText ? <span>{loadingText}</span> : children}
    </button>
  );
};
