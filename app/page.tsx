"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Receipt,
  Users,
  Send,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { generateWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useApp } from "@/components/AppContext";

export default function DashboardPage() {
  const { t, locale, user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalPendingUdhaar: 0,
    totalAdvanceReceived: 0,
    todayCollections: 0,
    todaySales: 0,
    customerCount: 0,
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1. Main Udhaar Card (Highlight) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl p-5 shadow-md">
        <div className="absolute right-[-15px] top-[-15px] opacity-10">
          <TrendingDown className="w-36 h-36" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-300 animate-ping"></span>
              {t.totalUdhaar}
            </span>
            <Link
              href="/customers"
              className="text-xs font-medium text-rose-100 hover:text-white underline underline-offset-2 flex items-center"
            >
              {locale === "hi" ? "सभी ग्राहक देखें" : "View All"}
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="text-3xl font-black mt-2 tracking-tight">
            {formatINR(stats.totalPendingUdhaar)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-rose-100 border-t border-rose-500/40 pt-2.5">
            <span>
              {locale === "hi"
                ? `कुल ${stats.customerCount} ग्राहक पंजीकृत`
                : `${stats.customerCount} Active Customers`}
            </span>
            <Link
              href="/customers"
              className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-medium flex items-center gap-1 text-[11px]"
            >
              <Send className="w-3 h-3" />
              {locale === "hi" ? "तकाजा भेजें" : "Remind"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Today's Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.todaySale}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5">
            {formatINR(stats.todaySales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "आज के पक्के बिल" : "Today's Bills"}
          </div>
        </div>

        {/* Today's Cash Collected */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.todayCollection}</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1.5">
            {formatINR(stats.todayCollections)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "जमा / रिकवरी" : "Recoveries / Cash"}
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {locale === "hi" ? "त्वरित कार्य (Quick Actions)" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/customers?openAdd=true"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-colors"
          >
            <Users className="w-5 h-5 mb-1.5 text-emerald-600" />
            <span className="text-xs font-bold text-center leading-tight">
              {locale === "hi" ? "नया ग्राहक" : "Add Grahak"}
            </span>
          </Link>

          <Link
            href="/invoices"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors"
          >
            <Receipt className="w-5 h-5 mb-1.5 text-blue-600" />
            <span className="text-xs font-bold text-center leading-tight">
              {locale === "hi" ? "नया बिल" : "New Bill"}
            </span>
          </Link>

          <Link
            href="/customers"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-colors"
          >
            <Send className="w-5 h-5 mb-1.5 text-rose-600" />
            <span className="text-xs font-bold text-center leading-tight">
              {locale === "hi" ? "उधार तकाजा" : "Reminders"}
            </span>
          </Link>
        </div>
      </div>

      {/* 4. Recent Khata Transactions Feed */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {locale === "hi" ? "हाल के लेनदेन (Recent Activity)" : "Recent Transactions"}
          </h2>
          <Link
            href="/customers"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            {locale === "hi" ? "खाता देखें" : "View Khata"}
          </Link>
        </div>

        {data?.recentTransactions?.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {locale === "hi" ? "अभी कोई लेनदेन दर्ज नहीं हुआ" : "No recent transactions found"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.recentTransactions?.map((tx: any) => {
              const isCredit = tx.type === "CREDIT_GIVEN"; // You gave / Udhaar
              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                        isCredit
                          ? "bg-rose-100 text-rose-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {tx.customer?.name || "Customer"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                        {tx.note || (isCredit ? "उधार दिया" : "जमा हुआ")}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        isCredit ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatINR(tx.amount)}
                    </span>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {isCredit
                        ? locale === "hi"
                          ? "आपने दिए"
                          : "You Gave"
                        : locale === "hi"
                        ? "आपको मिले"
                        : "You Got"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Indian SMB UPI Banner */}
      {user?.upiId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <div>
              <p className="font-bold">{locale === "hi" ? "दुकान का UPI लिंक सक्रिय" : "Merchant UPI Active"}</p>
              <p className="text-[11px] text-emerald-700">{user.upiId}</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-2.5 py-1 bg-white border border-emerald-300 rounded text-emerald-800 text-[11px] font-bold shadow-2xs"
          >
            {locale === "hi" ? "बदलें" : "Edit"}
          </Link>
        </div>
      )}
    </div>
  );
}
