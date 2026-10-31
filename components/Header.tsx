"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Languages, ShieldCheck } from "lucide-react";
import { useApp } from "./AppContext";

export function Header() {
  const { user, locale, setLocale, t } = useApp();
  const pathname = usePathname();

  const toggleLanguage = () => {
    setLocale(locale === "hi" ? "en" : "hi");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
            <img
              src="/logo.png"
              alt="Anay Enterprises Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[170px]">
                {user?.businessName || "Anay Enterprises"}
              </h1>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {user?.phoneNumber ? `+91 ${user.phoneNumber}` : "+91 9049822762"} • {user?.upiId ? "UPI Active" : "No UPI"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
          title="Switch Language / भाषा बदलें"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-700" />
          <span>{locale === "hi" ? "English" : "हिंदी"}</span>
        </button>
      </div>
    </header>
  );
}
