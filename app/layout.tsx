import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tourism CMS — Multi-Tenant Tourism Platform",
  description: "Platform CMS Multi-Tenant Terpadu untuk Pengelolaan Destinasi & Layanan Wisata",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
