import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "eventradar — Türkiye Etkinlik Analitik",
  description:
    "Türkiye'deki etkinliklerin tek noktadan toplandığı, analiz edildiği platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-100 font-sans antialiased text-zinc-900">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
