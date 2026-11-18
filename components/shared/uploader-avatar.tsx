import React from "react";
import Image from "next/image";
import { formatIndonesianDateTime, formatIndonesianDate } from "@/lib/utils";

export interface UploaderInfoProps {
  name: string;
  avatarUrl?: string | null;
  role?: string;
  timestamp?: string | Date;
  actionText?: string;
  compact?: boolean;
}

export function UploaderAvatar({
  name,
  avatarUrl,
  timestamp,
  actionText = "Diunggah oleh",
  compact = false,
}: UploaderInfoProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-8 w-8 flex-shrink-0 rounded-full overflow-hidden bg-[#e3e8ee] border border-white shadow-sm flex items-center justify-center text-xs font-medium text-[#1c1e54]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-[#0d253d] truncate hover:text-[#533afd] transition-colors">
          {name}
        </span>
        {timestamp && (
          <span className="text-[11px] text-[#64748d] tnum font-light truncate">
            {compact ? (
              formatIndonesianDate(timestamp)
            ) : (
              <>
                {actionText} {formatIndonesianDateTime(timestamp)}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export function ContentAttributionBox({
  createdByName,
  createdByAvatar,
  createdAt,
  updatedByName,
  updatedByAvatar,
  updatedAt,
  publishedByName,
  publishedByAvatar,
  publishedAt,
}: {
  createdByName: string;
  createdByAvatar?: string | null;
  createdAt: string;
  updatedByName: string;
  updatedByAvatar?: string | null;
  updatedAt: string;
  publishedByName?: string | null;
  publishedByAvatar?: string | null;
  publishedAt?: string | null;
}) {
  return (
    <div className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-4 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#e3e8ee]/80 font-medium text-[#0d253d]">
        <span>INFORMASI KEPEMILIKAN & ATRIBUSI KONTEN</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div>
          <span className="text-[10px] text-[#64748d] uppercase tracking-wider block mb-1">
            Dibuat Oleh
          </span>
          <UploaderAvatar
            name={createdByName}
            avatarUrl={createdByAvatar}
            timestamp={createdAt}
            actionText=""
          />
        </div>

        <div>
          <span className="text-[10px] text-[#64748d] uppercase tracking-wider block mb-1">
            Terakhir Diedit Oleh
          </span>
          <UploaderAvatar
            name={updatedByName}
            avatarUrl={updatedByAvatar}
            timestamp={updatedAt}
            actionText=""
          />
        </div>

        {publishedByName && (
          <div>
            <span className="text-[10px] text-[#64748d] uppercase tracking-wider block mb-1">
              Dipublikasikan Oleh
            </span>
            <UploaderAvatar
              name={publishedByName}
              avatarUrl={publishedByAvatar}
              timestamp={publishedAt || undefined}
              actionText=""
            />
          </div>
        )}
      </div>
    </div>
  );
}
