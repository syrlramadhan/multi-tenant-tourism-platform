import React from "react";
import Link from "next/link";
import { Info, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { FeaturesTable } from "./features-table";
import { Card } from "@/components/ui/card";

export default async function SuperadminFeaturesPage() {
  const tenants = await db.getTenants();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/superadmin"
              className="text-[#64748d] hover:text-[#0d253d] p-1 rounded-full hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
              Feature Management — Matriks Ketersediaan Modul
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Superadmin dapat mengaktifkan (ON) atau menonaktifkan (OFF) modul CMS pada masing-masing website secara independen.
          </p>
        </div>
      </div>

      {/* Info card describing behavior according to Section 9 of writing-block.md */}
      <Card variant="cream" className="p-4 text-xs space-y-2 border border-[#ecd5af]">
        <div className="flex items-center gap-2 font-medium text-[#0d253d]">
          <Info className="h-4 w-4 text-[#9b6829] flex-shrink-0" />
          <span>Aturan & Perilaku Feature Toggle Sesuai Dokumen Arsitektur:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[#273951] pl-1">
          <li>
            <strong>Jika modul dinonaktifkan (OFF):</strong> Menu navigasi modul disembunyikan pada CMS tenant dan navigasi website publik.
          </li>
          <li>
            <strong>Keamanan Server:</strong> Akses ke endpoint modul terkait ditolak secara server-side.
          </li>
          <li>
            <strong>Integritas Data:</strong> Data lama sama sekali tidak dihapus. Mengaktifkan kembali modul (ON) akan mengembalikan akses penuh terhadap data sebelumnya.
          </li>
        </ul>
      </Card>

      {/* Interactive Table Component */}
      <FeaturesTable initialTenants={tenants} />
    </div>
  );
}
