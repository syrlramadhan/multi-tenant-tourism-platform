"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import type { TenantData } from "@/lib/db/mock-data";

const MODULES = [
  { key: "destinations", label: "Destinasi Wisata", desc: "Objek wisata alam, bahari, cagar budaya" },
  { key: "accommodations", label: "Akomodasi", desc: "Hotel, resor pantai, homestay, vila, glamping" },
  { key: "fashion", label: "Fashion & Souvenir", desc: "Kain batik, tenun, kemeja pantai, suvenir khas" },
  { key: "vehicles", label: "Kendaraan", desc: "Speedboat, mobil car rental, motor, jeep 4x4" },
  { key: "culinary", label: "Kuliner", desc: "Resto seafood, kedai kopi lereng, kuliner tradisional" },
  { key: "tour_guides", label: "Tour Guide", desc: "Pemandu diving, pemandu sejarah cagar budaya" },
  { key: "groceries", label: "Sembako", desc: "Toko kebutuhan pokok pesisir & hasil bumi" },
  { key: "documentations", label: "Dokumentasi", desc: "Liputan festival tahunan, galeri acara, video" },
];

export function FeaturesTable({ initialTenants }: { initialTenants: TenantData[] }) {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantData[]>(initialTenants);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleToggle = async (tenantId: string, featureKey: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    const key = `${tenantId}-${featureKey}`;
    setLoadingKey(key);
    setNotification(null);

    try {
      const res = await fetch("/api/superadmin/features/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          featureKey,
          isEnabled: nextVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah fitur");
      }

      // Optimistically update local state
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id === tenantId) {
            return {
              ...t,
              features: {
                ...t.features,
                [featureKey]: nextVal,
              },
            };
          }
          return t;
        })
      );

      const tenantName = tenants.find((t) => t.id === tenantId)?.name || tenantId;
      setNotification(
        `Modul "${featureKey}" pada ${tenantName} berhasil diubah menjadi ${
          nextVal ? "ON" : "OFF"
        }.`
      );
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status modul");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="border border-[#e3e8ee] rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1c1e54] text-white">
            <tr>
              <th className="py-4 px-4 w-1/3">
                <span className="font-semibold text-xs tracking-tight">Modul CMS & Website Publik</span>
              </th>
              {tenants.map((t) => (
                <th key={t.id} className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: t.brandColor }}
                    />
                    <span className="font-semibold text-xs text-white">{t.name}</span>
                    <span className="text-[10px] text-white/60 font-mono">
                      {t.slug}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {MODULES.map((m) => (
              <tr key={m.key} className="hover:bg-[#f6f9fc]/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-[#0d253d] text-sm">{m.label}</div>
                  <div className="text-[11px] text-[#64748d]">{m.desc}</div>
                </td>

                {tenants.map((t) => {
                  const isEnabled = t.features[m.key] !== false;
                  const key = `${t.id}-${m.key}`;
                  const isLoading = loadingKey === key;

                  return (
                    <td key={t.id} className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(t.id, m.key, isEnabled)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                          isEnabled
                            ? "bg-[#533afd] text-white hover:bg-[#4434d4] active:scale-95"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300 active:scale-95"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isEnabled ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>ON</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5" />
                            <span>OFF</span>
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
