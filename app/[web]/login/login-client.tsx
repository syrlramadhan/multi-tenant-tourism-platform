"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { TenantData } from "@/lib/db/mock-data";

interface LoginClientProps {
  web: string;
  tenant: TenantData;
}

export function WebLoginClient({ web, tenant }: LoginClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, web }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      const targetPath = data.redirectTo || (data.user?.isSuperadmin ? "/superadmin" : `/${web}/dashboard`);
      router.push(targetPath);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("password123");
    setError(null);
  };

  // Demo accounts configured for this specific website
  const getDemoAccounts = () => {
    if (web === "web-b") {
      return {
        admin: { name: "Rahmawati Kusuma (Website Admin)", email: "rahma@wisata-b.com" },
        author: { name: "Budi Santoso (Content Manager)", email: "budi@wisata-b.com" },
        other: { name: "Ahmad Fadillah (Akun Web A - Tes Blokir)", email: "ahmad@wisata-a.com" },
      };
    }
    if (web === "web-c") {
      return {
        admin: { name: "Siti Nurhaliza (Website Admin)", email: "siti@wisata-c.com" },
        author: { name: "Dimas Wicaksono (Content Manager)", email: "dimas@wisata-c.com" },
        other: { name: "Budi Santoso (Akun Web B - Tes Blokir)", email: "budi@wisata-b.com" },
      };
    }
    // Default Web A
    return {
      admin: { name: "Syahrul Ramadhan (Website Admin)", email: "syahrul@wisata-a.com" },
      author: { name: "Ahmad Fadillah (Content Manager)", email: "ahmad@wisata-a.com" },
      other: { name: "Rahmawati Kusuma (Akun Web B - Tes Blokir)", email: "rahma@wisata-b.com" },
    };
  };

  const demo = getDemoAccounts();

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Stripe-inspired atmospheric gradient header background */}
      <div className="absolute top-0 left-0 right-0 h-64 stripe-hero-mesh opacity-70 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4">
        <Link
          href={`/${web}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#533afd] hover:underline font-medium mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Website Publik ({tenant.name})</span>
        </Link>
        <h2 className="text-2xl font-light tracking-tight text-[#0d253d]">
          Masuk ke CMS {tenant.name}
        </h2>
        <p className="text-xs text-[#64748d] leading-relaxed">
          Halaman login terisolasi untuk <strong>{tenant.name}</strong>. Pengguna hanya dapat masuk jika memiliki akses ke website ini, atau sebagai <strong>Superadmin</strong>.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card variant="light" className="p-6 md:p-8 shadow-[0_8px_24px_rgba(0,55,112,0.08)]">
          <CardContent className="p-0 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-[#0d253d] block mb-1.5">
                  Alamat Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="nama@wisata.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#0d253d] block mb-1.5">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full mt-2"
              >
                <Lock className="h-4 w-4 mr-1.5" />
                Masuk ke CMS
              </Button>
            </form>

            {/* Quick-fill demo section */}
            <div className="mt-8 pt-6 border-t border-[#e3e8ee] space-y-3">
              <span className="text-[11px] font-semibold text-[#64748d] uppercase tracking-wider block">
                Akun Demo Uji Coba
              </span>

              <div className="space-y-2 text-xs">
                {/* Superadmin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("superadmin@tourism.id")}
                  className="w-full p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-amber-900 block flex items-center gap-1">
                      <Shield className="h-3 w-3 text-amber-600" />
                      Superadmin Global
                    </span>
                    <span className="text-[11px] text-amber-800">
                      superadmin@tourism.id (Otomatis ke /superadmin)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold bg-white px-2 py-0.5 rounded border border-amber-200">
                    Isi Form
                  </span>
                </button>

                {/* Tenant Admin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(demo.admin.email)}
                  className="w-full p-2.5 rounded-lg border border-[#e3e8ee] bg-[#f6f9fc] hover:bg-[#e3e8ee]/60 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-[#0d253d] block">
                      {demo.admin.name}
                    </span>
                    <span className="text-[11px] text-[#64748d]">
                      {demo.admin.email}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#533afd] font-semibold bg-white px-2 py-0.5 rounded border border-[#e3e8ee]">
                    Isi Form
                  </span>
                </button>

                {/* Tenant Content Manager Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(demo.author.email)}
                  className="w-full p-2.5 rounded-lg border border-[#e3e8ee] bg-[#f6f9fc] hover:bg-[#e3e8ee]/60 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-[#0d253d] block">
                      {demo.author.name}
                    </span>
                    <span className="text-[11px] text-[#64748d]">
                      {demo.author.email}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#533afd] font-semibold bg-white px-2 py-0.5 rounded border border-[#e3e8ee]">
                    Isi Form
                  </span>
                </button>

                {/* Other Tenant Button to test blocked login */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(demo.other.email)}
                  className="w-full p-2.5 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-rose-900 block text-[11px]">
                      {demo.other.name}
                    </span>
                    <span className="text-[10px] text-rose-700">
                      {demo.other.email} (Uji Penolakan Akses)
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-700 font-semibold bg-white px-2 py-0.5 rounded border border-rose-200">
                    Coba Tes
                  </span>
                </button>
              </div>

              <div className="pt-2 text-[11px] text-[#64748d] flex items-center justify-between">
                <span>Kata sandi default semua akun:</span>
                <code className="bg-[#e3e8ee] px-1.5 py-0.5 rounded text-[#0d253d] font-mono">
                  password123
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
