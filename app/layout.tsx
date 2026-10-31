import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Anay Enterprises - Digital Khata & Billing",
  description: "Digital Khata, Instant Invoices and WhatsApp Payment Reminders for Anay Enterprises",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-900 antialiased selection:bg-emerald-100 min-h-screen flex justify-center">
        {/* Mobile Viewport Container */}
        <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col relative shadow-2xl border-x border-slate-200">
          <AppProvider>
            <Header />
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
