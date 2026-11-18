"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import type { UserData } from "@/lib/db/mock-data";

export function TenantUsersClient({
  tenantId,
  tenantName,
  initialUsers,
  activeCount,
}: {
  tenantId: string;
  tenantName: string;
  initialUsers: UserData[];
  activeCount: number;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"WEBSITE_ADMIN" | "CONTENT_MANAGER">("CONTENT_MANAGER");

  const isFull = activeCount >= 30;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          tenantId,
          role,
          isSuperadmin: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pengguna.");
      }

      setUsers((prev) => [data.user, ...prev]);
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          disabled={isFull}
          onClick={() => setShowModal(true)}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          {isFull ? "Batas Kuota 30 Penuh" : "Tambah Pengelola Website"}
        </Button>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
            <tr>
              <th className="py-3 px-4">Nama Pengguna</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">WhatsApp / Telp</th>
              <th className="py-3 px-4">Peran</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {users.map((u) => {
              const membership = u.tenantMemberships.find((m) => m.tenantId === tenantId);
              return (
                <tr key={u.id} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3 px-4">
                    <UploaderAvatar name={u.name} avatarUrl={u.avatarUrl} compact />
                  </td>
                  <td className="py-3 px-4 text-[#0d253d] font-medium">{u.email}</td>
                  <td className="py-3 px-4 text-[#64748d]">{u.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <Badge variant={membership?.role === "WEBSITE_ADMIN" ? "subdued" : "neutral"}>
                      {membership?.role === "WEBSITE_ADMIN" ? "Website Admin" : "Content Manager"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                      {u.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal Add User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e3e8ee] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e3e8ee]">
              <h3 className="font-medium text-sm text-[#0d253d]">
                Tambah Pengelola untuk {tenantName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748d] hover:text-[#0d253d] text-lg font-bold"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Nama Lengkap</label>
                <Input
                  required
                  placeholder="Misal: Rina Wardani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Email</label>
                <Input
                  type="email"
                  required
                  placeholder="rina@wisata.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Kata Sandi</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Nomor WhatsApp</label>
                <Input
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Peran Akses</label>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "WEBSITE_ADMIN" | "CONTENT_MANAGER")}
                >
                  <option value="CONTENT_MANAGER">Content Manager (Dapat membuat & mengedit konten)</option>
                  <option value="WEBSITE_ADMIN">Website Admin (Kelola staf & persetujuan konten)</option>
                </Select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e3e8ee]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                >
                  Simpan Pengguna
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
