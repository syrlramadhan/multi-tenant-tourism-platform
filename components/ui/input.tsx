import React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-md border border-[#a8c3de] bg-white px-3 py-2 text-sm text-[#0d253d] placeholder:text-[#64748d]/60",
          "focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border border-[#a8c3de] bg-white px-3 py-2 text-sm text-[#0d253d] placeholder:text-[#64748d]/60",
          "focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 transition-all min-h-[90px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-md border border-[#a8c3de] bg-white px-3 py-2 text-sm text-[#0d253d]",
          "focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
