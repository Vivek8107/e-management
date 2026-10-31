"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Receipt, Settings, PlusCircle } from "lucide-react";
import { useApp } from "./AppContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t, locale } = useApp();

  const navItems = [
    {
      name: locale === "hi" ? "डैशबोर्ड" : "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: locale === "hi" ? "खाता" : "Khata",
      href: "/customers",
      icon: Users,
      active: pathname.startsWith("/customers"),
    },
    {
      name: locale === "hi" ? "नया बिल" : "Billing",
      href: "/invoices",
      icon: Receipt,
      active: pathname.startsWith("/invoices"),
      special: true,
    },
    {
      name: locale === "hi" ? "सेटिंग्स" : "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors ${
                item.active
                  ? "text-emerald-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    item.active ? "stroke-[2.5px] scale-110" : ""
                  } transition-transform`}
                />
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
