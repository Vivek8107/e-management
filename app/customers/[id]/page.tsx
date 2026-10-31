"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Send,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { generateWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useApp } from "@/components/AppContext";

export default function CustomerPassbookPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t, locale, user } = useApp();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Transaction Modal State
  const [modalType, setModalType] = useState<"CREDIT_GIVEN" | "PAYMENT_GOT" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.customer);
      }
    } catch (err) {
      console.error("Failed to load customer details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(locale === "hi" ? "कृपया सही राशि दर्ज करें" : "Enter a valid amount");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: id,
          type: modalType,
          amount: numAmount,
          note,
          date,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalType(null);
        setAmount("");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
        fetchCustomer();
      } else {
        setErrorMsg(json.error || "Failed to record transaction");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl"></div>
        <div className="h-36 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-200 rounded-xl"></div>
          <div className="h-16 bg-slate-200 rounded-xl"></div>
          <div className="h-16 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-bold text-slate-800">Customer not found</p>
        <Link href="/customers" className="text-xs text-emerald-600 mt-2 block font-semibold">
          ← Back to customer list
        </Link>
      </div>
    );
  }

  const isUdhaar = customer.currentBalance > 0;
  const isAdvance = customer.currentBalance < 0;

  const reminderUrl = generateWhatsAppReminderUrl({
    customerName: customer.name,
    customerPhone: customer.phoneNumber,
    shopName: user?.businessName || "Anay Enterprises",
    balanceAmount: customer.currentBalance,
    merchantUpiId: user?.upiId,
    locale,
  });

  return (
    <div className="pb-28">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/customers")}
            className="p-1 -ml-1 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {customer.name}
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {customer.category === "LABOUR"
                  ? "👷 लेबर / ठेकेदार"
                  : customer.category === "TRANSPORT"
                  ? "🚚 ट्रांसपोर्ट / क्रेन"
                  : customer.category === "TRAVEL"
                  ? "🚗 यात्रा / पेट्रोल खर्च"
                  : customer.category === "SUPPLIER"
                  ? "🏭 सप्लायर"
                  : "🏢 ग्राहक / पार्टी"}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {customer.phoneNumber}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Reminder Button */}
        <a
          href={reminderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
          title="Send Statement via WhatsApp"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{locale === "hi" ? "तकाजा" : "Remind"}</span>
        </a>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Balance Summary Card */}
        <div
          className={`rounded-2xl p-5 border text-center transition-all ${
            isUdhaar
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : isAdvance
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-slate-100 border-slate-200 text-slate-800"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            {isUdhaar
              ? locale === "hi"
                ? "कुल उधार बाकी (Aapko Lena Hai)"
                : "Total Receivable (You'll Get)"
              : isAdvance
              ? locale === "hi"
                ? "एडवांस जमा (Aapko Dena Hai)"
                : "Advance Received (You'll Give)"
              : locale === "hi"
              ? "हिसाब चुकता (No Dues)"
              : "All Settled (₹0)"}
          </span>
          <div
            className={`text-3xl font-black mt-1 tracking-tight ${
              isUdhaar
                ? "text-rose-600"
                : isAdvance
                ? "text-emerald-700"
                : "text-slate-700"
            }`}
          >
            {formatINR(Math.abs(customer.currentBalance))}
          </div>

          {/* Quick Info text */}
          <p className="text-[11px] text-slate-500 mt-2">
            {locale === "hi"
              ? "खाते में नया हिसाब जोड़ने के लिए नीचे दिए गए बटन दबाएं"
              : "Use the sticky buttons below to record credit or payment"}
          </p>
        </div>

        {/* 3. Transaction Timeline (Passbook Entries) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {locale === "hi" ? "खाता विवरण (Passbook)" : "Passbook Entries"}
            </h2>
            <span className="text-[11px] text-slate-400">
              {customer.transactions?.length || 0} entries
            </span>
          </div>

          {customer.transactions?.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                {locale === "hi" ? "अभी कोई एंट्री नहीं है" : "No entries yet"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {locale === "hi"
                  ? "नीचे दिए लाल या हरे बटन से पहली एंट्री दर्ज करें"
                  : "Tap the Red or Green button below to add your first entry"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.transactions.map((tx: any) => {
                const isCredit = tx.type === "CREDIT_GIVEN"; // Red: You Gave / Udhaar
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCredit
                            ? "bg-rose-100 text-rose-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {tx.note ||
                            (isCredit
                              ? locale === "hi"
                                ? "सामान दिया (उधार)"
                                : "Items Given (Credit)"
                              : locale === "hi"
                              ? "रकम प्राप्त हुई (जमा)"
                              : "Payment Received")}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(tx.date)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-base font-black tracking-tight ${
                          isCredit ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatINR(tx.amount)}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {isCredit
                          ? locale === "hi"
                            ? "आपने दिए"
                            : "You Gave"
                          : locale === "hi"
                          ? "आपको मिले"
                          : "You Got"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Sticky Bottom Action Buttons (Khatabook Style) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-slate-200 p-2.5 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          {/* Aapne Diye (Red Button) */}
          <button
            onClick={() => setModalType("CREDIT_GIVEN")}
            className="flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white py-3 px-3 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>
              {locale === "hi" ? "आपने दिए (उधार)" : "YOU GAVE (Credit)"}
            </span>
          </button>

          {/* Aapko Mile (Green Button) */}
          <button
            onClick={() => setModalType("PAYMENT_GOT")}
            className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 px-3 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>
              {locale === "hi" ? "आपको मिले (जमा)" : "YOU GOT (Payment)"}
            </span>
          </button>
        </div>
      </div>

      {/* 5. Transaction Entry Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    modalType === "CREDIT_GIVEN" ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-base font-bold text-slate-900">
                  {modalType === "CREDIT_GIVEN"
                    ? locale === "hi"
                      ? `${customer.name} को दिए (उधार जोड़ें)`
                      : `Give Credit to ${customer.name}`
                    : locale === "hi"
                    ? `${customer.name} से मिले (जमा दर्ज करें)`
                    : `Receive Payment from ${customer.name}`}
                </h2>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecordTransaction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "रकम दर्ज करें (₹) *" : "Enter Amount (₹) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-xl font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "विवरण / काम का नाम" : "Work / Item Note"}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    customer.category === "LABOUR"
                      ? "e.g. हाजिरी / एडवांस / पाइप फिटिंग"
                      : customer.category === "TRANSPORT"
                      ? "e.g. क्रेन चार्ज / गाड़ी भाड़ा Wakad"
                      : customer.category === "TRAVEL"
                      ? "e.g. साइट डीजल / टोल टैक्स"
                      : "e.g. काम का बिल / पार्ट पेमेंट"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />

                {/* Quick Chips for Anay Enterprises */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(customer.category === "LABOUR"
                    ? ["हाजिरी (Wage)", "एडवांस (Advance)", "खाना खर्च", "ओवरटाइम (OT)", "हफ्ते का हिसाब"]
                    : customer.category === "TRANSPORT"
                    ? ["गाड़ी भाड़ा (Freight)", "डीजल (Fuel)", "टोल टैक्स (Toll)", "क्रेन चार्ज (Crane)", "लोडिंग"]
                    : customer.category === "TRAVEL"
                    ? ["डीजल / पेट्रोल", "होटल / रूम", "टोल पर्ची", "खाना / नाश्ता", "साइट वाहन"]
                    : customer.category === "SUPPLIER"
                    ? ["पाइप मटेरियल", "वाल्व व फिटिंग", "हार्डवेयर सामान", "पार्ट पेमेंट"]
                    : ["पाइपलाइन वर्क", "कैनोपी मेंटेनेंस", "पंप फिटिंग", "पार्ट पेमेंट (UPI)"]
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setNote((prev) => (prev ? `${prev}, ${chip}` : chip))}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "तारीख" : "Date"}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-xl text-white text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 ${
                    modalType === "CREDIT_GIVEN"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {submitting
                    ? locale === "hi"
                      ? "सहेज रहे हैं..."
                      : "Saving..."
                    : locale === "hi"
                    ? "सुरक्षित करें"
                    : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
