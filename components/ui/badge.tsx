import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "subdued" | "success" | "warning" | "danger" | "neutral" | "cream";
}

export function Badge({
  className,
  variant = "subdued",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-[#533afd] text-white",
    subdued: "bg-[#b9b9f9]/40 text-[#4434d4] font-medium border border-[#b9b9f9]/60",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
    danger: "bg-rose-50 text-rose-700 border border-rose-200 font-medium",
    neutral: "bg-[#f6f9fc] text-[#64748d] border border-[#e3e8ee] font-medium",
    cream: "bg-[#f5e9d4] text-[#0d253d] border border-[#ecd5af] font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "PUBLISHED" | "DRAFT" | "PENDING_REVIEW" | "ARCHIVED" | "ACTIVE" | "INACTIVE" }) {
  switch (status) {
    case "PUBLISHED":
    case "ACTIVE":
      return <Badge variant="success">Published</Badge>;
    case "PENDING_REVIEW":
      return <Badge variant="warning">Pending Review</Badge>;
    case "DRAFT":
      return <Badge variant="neutral">Draft</Badge>;
    case "ARCHIVED":
    case "INACTIVE":
      return <Badge variant="danger">Inactive</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
