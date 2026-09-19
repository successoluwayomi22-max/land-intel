import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-800 text-slate-100 border-slate-700",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
