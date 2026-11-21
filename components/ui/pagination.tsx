import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const itemStyles =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-3 text-xs font-medium tnum transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/40 pointer-coarse:h-11 pointer-coarse:min-w-11";
const linkStyles = "border-[#e3e8ee] bg-white text-[#273951] hover:border-[#a8c3de] hover:text-[#533afd]";
// Opaque tint so the current page looks the same on white, cream, and gray section backgrounds.
const currentStyles = "border-[#d5d5fb] bg-[#e3e3fd] text-[#4434d4]";
const disabledStyles = "border-[#e3e8ee] bg-white text-[#64748d]/50";

export const DEFAULT_PAGE_SIZE = 20;

export type PageSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Single-list pages keep the page number in ?halaman=N (page 1 has no parameter).
export const pageHref = (basePath: string) => (page: number) =>
  page > 1 ? `${basePath}?halaman=${page}` : basePath;

export const requestedPage = async (searchParams: PageSearchParams) => Number((await searchParams).halaman);

interface PageNavigation {
  hrefForPage?: (page: number) => string;
  // Client-side lists only: event handlers cannot be passed from Server Components.
  onPageChange?: (page: number) => void;
}

function PageControl({
  page,
  rel,
  label,
  hrefForPage,
  onPageChange,
  children,
}: PageNavigation & { page: number; rel?: "prev" | "next"; label: string; children: React.ReactNode }) {
  const className = cn(itemStyles, linkStyles);
  return hrefForPage ? (
    <Link href={hrefForPage(page)} rel={rel} aria-label={label} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={() => onPageChange?.(page)} aria-label={label} className={className}>
      {children}
    </button>
  );
}

/** First, last, and the current page with its neighbours; longer gaps collapse into an ellipsis. */
function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined && p - previous === 2) result.push(previous + 1);
    if (previous !== undefined && p - previous > 2) result.push("gap");
    result.push(p);
  });
  return result;
}

export function Pagination({
  page,
  totalPages,
  hrefForPage,
  onPageChange,
  label,
  className,
}: PageNavigation & {
  page: number;
  totalPages: number;
  label: string;
  className?: string;
}) {
  const previousLabel = "Halaman sebelumnya";
  const nextLabel = "Halaman berikutnya";
  const navigation = { hrefForPage, onPageChange };

  return (
    <nav aria-label={label} className={cn("flex items-center gap-1.5", className)}>
      {page > 1 ? (
        <PageControl {...navigation} page={page - 1} rel="prev" label={previousLabel}>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </PageControl>
      ) : (
        <span role="link" aria-disabled="true" aria-label={previousLabel} className={cn(itemStyles, disabledStyles)}>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </span>
      )}

      <ol className="hidden sm:flex items-center gap-1.5">
        {visiblePages(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-xs text-[#64748d]">
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span aria-current="page" className={cn(itemStyles, currentStyles)}>
                  {p}
                </span>
              ) : (
                <PageControl {...navigation} page={p} label={`Halaman ${p}`}>
                  {p}
                </PageControl>
              )}
            </li>
          )
        )}
      </ol>
      <span className="sm:hidden px-2 text-xs text-[#64748d] tnum">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <PageControl {...navigation} page={page + 1} rel="next" label={nextLabel}>
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </PageControl>
      ) : (
        <span role="link" aria-disabled="true" aria-label={nextLabel} className={cn(itemStyles, disabledStyles)}>
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}

/** "Menampilkan x–y dari z" summary plus page navigation; renders nothing when everything fits on one page. */
export function PaginationBar({
  page,
  pageSize,
  total,
  noun,
  hrefForPage,
  onPageChange,
  className,
}: PageNavigation & {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  className?: string;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-3", className)}>
      <p className="text-xs text-[#64748d] tnum">
        Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} {noun}
      </p>
      <Pagination
        page={page}
        totalPages={totalPages}
        hrefForPage={hrefForPage}
        onPageChange={onPageChange}
        label={`Navigasi halaman ${noun}`}
      />
    </div>
  );
}
