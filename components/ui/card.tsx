import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "cream" | "dark" | "flat";
}

export function Card({
  className,
  variant = "light",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    light:
      "bg-white border border-[#e3e8ee] rounded-xl shadow-[0_1px_3px_rgba(0,55,112,0.08)]",
    cream:
      "bg-[#f5e9d4] rounded-xl text-[#0d253d] border border-[#ecd5af]/50",
    dark:
      "bg-[#1c1e54] text-white rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.12)]",
    flat:
      "bg-[#f6f9fc] border border-[#e3e8ee] rounded-xl",
  };

  return (
    <div
      className={cn("p-6 transition-all", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-light tracking-tight text-inherit",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-[#64748d] font-normal", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-inherit", className)} {...props}>
      {children}
    </div>
  );
}
