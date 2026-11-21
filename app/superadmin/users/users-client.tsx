"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { DEFAULT_PAGE_SIZE, PaginationBar } from "@/components/ui/pagination";
import type { UserData, TenantData } from "@/lib/db/mock-data";

export function SuperadminUsersClient({
  initialUsers,
  tenants,
  tenantCounts,
}: {
  initialUsers: UserData[];
  tenants: TenantData[];
  tenantCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [selectedTenant, setSelectedTenant] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [phone, setPhone] = useState("");
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [role, setRole] = useState<"WEBSITE_ADMIN" | "CONTENT_MANAGER">("CONTENT_MANAGER");
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (selectedTenant !== "ALL") {
      const isMember = u.tenantMemberships.some((m) => m.tenantId === selectedTenant);
      if (!isMember) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });
  const pageUsers = filteredUsers.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const handleCreateUser = async (e: React.FormEvent) => {
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
          tenantId: isSuperadmin ? undefined : tenantId,
          role: isSuperadmin ? undefined : role,
          isSuperadmin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pengguna.");
      }

      setUsers((prev) => [data.user, ...prev]);
      setPage(1);
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
    <div className="space-y-6">
      {/* Quota overview across the 3 websites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tenants.map((t) => {
          const count = tenantCounts[t.id] || 0;
          const isFull = count >= 30;
          return (
            <Card key={t.id} variant="light" className="p-4 border-[#e3e8ee]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#0d253d] flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.brandColor }}
                  />
                  <span className="truncate">{t.name}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tnum ${
                    isFull
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-indigo-50 text-[#533afd] border border-indigo-100"
                  }`}
                >
                  {count} / 30 User
                </span>
              </div>
              <div className="w-full bg-[#e3e8ee] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${isFull ? "bg-rose-500" : "bg-[#533afd]"}`}
                  style={{ width: `${Math.min(100, (count / 30) * 100)}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter & Action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#64748d]" />
            <Input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#64748d]">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-[#a8c3de] bg-white px-3 py-1.5 text-xs text-[#0d253d] focus:outline-none"
            >
              <option value="ALL">Semua Website</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="whitespace-nowrap"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Users Data Table */}
      <Card variant="light" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak / Email</th>
                <th className="py-3 px-4">Penugasan Website</th>
                <th className="py-3 px-4">Peran (RBAC)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]">
              {pageUsers.map((u) => {
                return (
                  <tr key={u.id} className="hover:bg-[#f6f9fc]/50 transition-colors">
                    <td className="py-3 px-4">
                      <UploaderAvatar
                        name={u.name}
                        avatarUrl={u.avatarUrl}
                        actionText=""
                        compact
                      />
                    </td>
                    <td className="py-3 px-4 text-[#0d253d]">
                      <div className="font-medium text-[11px]">{u.email}</div>
                      <div className="text-[10px] text-[#64748d]">{u.phone || "-"}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isSuperadmin ? (
                        <span className="text-amber-700 font-medium text-[11px]">
                          Global (Seluruh Website)
                        </span>
                      ) : u.tenantMemberships.length > 0 ? (
                        <div className="space-y-0.5">
                          {u.tenantMemberships.map((m) => {
                            const t = tenants.find((item) => item.id === m.tenantId);
                            return (
                              <div
                                key={m.tenantId}
                                className="flex items-center gap-1.5 text-[11px] text-[#0d253d]"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: t?.brandColor }}
                                />
                                <span>{t?.name || m.tenantId}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[#64748d] text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.isSuperadmin ? (
                        <Badge variant="primary" className="bg-[#1c1e54]">
                          Superadmin
                        </Badge>
                      ) : (
                        u.tenantMemberships.map((m) => (
                          <Badge
                            key={m.tenantId}
                            variant={m.role === "WEBSITE_ADMIN" ? "subdued" : "neutral"}
                          >
                            {m.role === "WEBSITE_ADMIN" ? "Website Admin" : "Content Manager"}
                          </Badge>
                        ))
                      )}
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
        </div>
      </Card>

      <PaginationBar
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={filteredUsers.length}
        noun="pengguna"
        onPageChange={setPage}
      />

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e3e8ee] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e3e8ee]">
              <h3 className="font-medium text-sm text-[#0d253d] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#533afd]" />
                <span>Tambah Pengguna Baru</span>
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

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Nama Lengkap</label>
                <Input
                  required
                  placeholder="Misal: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[#0d253d] font-medium mb-1">Alamat Email</label>
                <Input
                  type="email"
                  required
                  placeholder="nama@wisata.com"
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
                <label className="block text-[#0d253d] font-medium mb-1">Nomor WhatsApp / HP</label>
                <Input
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSuperadmin}
                    onChange={(e) => setIsSuperadmin(e.target.checked)}
                    className="rounded text-[#533afd] focus:ring-[#533afd]"
                  />
                  <span className="font-medium text-[#0d253d]">
                    Jadikan Superadmin (Akses Global, tanpa batas kuota tenant)
                  </span>
                </label>
              </div>

              {!isSuperadmin && (
                <>
                  <div>
                    <label className="block text-[#0d253d] font-medium mb-1">
                      Pilih Website / Tenant (Maksimal 30 Pengguna)
                    </label>
                    <Select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                    >
                      {tenants.map((t) => {
                        const count = tenantCounts[t.id] || 0;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({count}/30 user terpakai)
                          </option>
                        );
                      })}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[#0d253d] font-medium mb-1">Peran (Role)</label>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "WEBSITE_ADMIN" | "CONTENT_MANAGER")}
                    >
                      <option value="CONTENT_MANAGER">Content Manager (Pengelola Konten)</option>
                      <option value="WEBSITE_ADMIN">Website Admin (Administrator Tenant)</option>
                    </Select>
                  </div>
                </>
              )}

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
