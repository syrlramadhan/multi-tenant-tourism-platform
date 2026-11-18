"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { formatIndonesianDateTime } from "@/lib/utils";
import type { ContentApprovalItem, UserData } from "@/lib/db/mock-data";

export function ApprovalsClient({
  initialApprovals,
  userMap,
}: {
  initialApprovals: ContentApprovalItem[];
  userMap: Record<string, UserData>;
}) {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ContentApprovalItem[]>(initialApprovals);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReview = async (
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          status,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses persetujuan");

      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? data.approval : a))
      );
      setRejectionModalId(null);
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
            <tr>
              <th className="py-3 px-4">Judul Konten</th>
              <th className="py-3 px-4">Tipe Entitas</th>
              <th className="py-3 px-4">Diajukan Oleh</th>
              <th className="py-3 px-4">Tanggal Pengajuan</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi Peninjauan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {approvals.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748d]">
                  Tidak ada permohonan persetujuan konten yang tertunda.
                </td>
              </tr>
            ) : (
              approvals.map((a) => {
                const requester = userMap[a.requestedById];
                const reviewer = a.reviewedById ? userMap[a.reviewedById] : null;

                return (
                  <tr key={a.id} className="hover:bg-[#f6f9fc]/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#0d253d] block">{a.title}</span>
                      {a.rejectionReason && (
                        <span className="text-[11px] text-rose-600 block mt-0.5">
                          Alasan ditolak: {a.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#64748d]">{a.entityType}</td>
                    <td className="py-3 px-4">
                      <UploaderAvatar
                        name={requester?.name || "Pengguna"}
                        avatarUrl={requester?.avatarUrl}
                        compact
                      />
                    </td>
                    <td className="py-3 px-4 tnum text-[#64748d]">
                      {formatIndonesianDateTime(a.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          a.status === "APPROVED"
                            ? "success"
                            : a.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {a.status === "APPROVED"
                          ? "Disetujui"
                          : a.status === "REJECTED"
                          ? "Ditolak"
                          : "Menunggu Review"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={loading}
                            onClick={() => handleReview(a.id, "APPROVED")}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={loading}
                            onClick={() => setRejectionModalId(a.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#64748d]">
                          Selesai ditinjau oleh {reviewer?.name || "Admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Rejection Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#e3e8ee] space-y-4 text-xs">
            <h3 className="font-medium text-sm text-[#0d253d]">
              Alasan Penolakan Konten
            </h3>
            <p className="text-[#64748d]">
              Berikan catatan perbaikan agar pembuat konten dapat merevisi permohonan.
            </p>
            <textarea
              className="w-full border border-[#a8c3de] rounded-lg p-2.5 text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] min-h-[90px]"
              placeholder="Misal: Foto utama kurang jelas, mohon ganti dengan resolusi tinggi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectionModalId(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!reason.trim() || loading}
                onClick={() => handleReview(rejectionModalId, "REJECTED", reason)}
              >
                Konfirmasi Penolakan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
