import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none";

    const variantStyles = {
      primary:
        "bg-[#533afd] text-white hover:bg-[#4434d4] active:bg-[#2e2b8c] shadow-sm",
      secondary:
        "bg-white text-[#533afd] border border-[#e3e8ee] hover:bg-[#f6f9fc] hover:border-[#a8c3de]",
      dark:
        "bg-[#1c1e54] text-white hover:bg-[#12143b] active:bg-[#0d0f2b]",
      danger:
        "bg-[#ea2261] text-white hover:bg-[#cf1b52] active:bg-[#b01343]",
      outline:
        "bg-transparent text-[#0d253d] border border-[#e3e8ee] hover:bg-[#f6f9fc] hover:text-[#533afd]",
      ghost:
        "bg-transparent text-[#273951] hover:bg-[#f6f9fc] hover:text-[#0d253d]",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 min-h-[32px] gap-1.5",
      md: "text-sm px-4 py-2 min-h-[40px] gap-2",
      lg: "text-base px-6 py-2.5 min-h-[44px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
