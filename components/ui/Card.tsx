import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-brand-border rounded-card shadow-subtle p-5 ${
        hover ? "hover:shadow-card hover:border-slate-300 transition-all duration-200" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`mb-4 border-b border-brand-border pb-3.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`text-base font-bold text-brand-textPrimary font-heading tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-xs text-brand-textSecondary mt-1 ${className}`} {...props}>
    {children}
  </p>
);
