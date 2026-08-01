import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { DataProvider } from "@/lib/data-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Serenity Co-Living | Quotation System",
  description: "Internal quotation system for Serenity Co-Living",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark`}>
      <body className="h-full min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <DataProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-8 py-8">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
