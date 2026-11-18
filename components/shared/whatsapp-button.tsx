import React from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface WhatsAppButtonProps {
  phone?: string | null;
  message?: string;
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function WhatsAppButton({
  phone,
  message,
  className,
  label = "Hubungi Pengelola via WhatsApp",
  size = "md",
}: WhatsAppButtonProps) {
  const url = getWhatsAppUrl(phone, message);

  // If no valid phone number exists, do not render according to requirement
  if (!url) return null;

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-2.5 gap-2.5 font-medium",
  };

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm hover:bg-[#1EBE5D] active:scale-[0.99] transition-all font-medium select-none",
        sizeClasses[size],
        className
      )}
    >
      <MessageCircle className="h-4 w-4 fill-white" />
      <span>{label}</span>
    </Link>
  );
}
