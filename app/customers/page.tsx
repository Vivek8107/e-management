"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  UserPlus,
  Send,
  Phone,
  ArrowRight,
  X,
  AlertCircle,
  Briefcase,
  HardHat,
  Truck,
  Car,
  Package,
  Layers,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { generateWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useApp } from "@/components/AppContext";

const CATEGORIES = [
  { id: "ALL", labelHi: "सभी", labelEn: "All", icon: Layers, color: "slate" },
  { id: "CLIENT", labelHi: "ग्राहक / पार्टी", labelEn: "Clients", icon: Briefcase, color: "blue" },
  { id: "LABOUR", labelHi: "लेबर / ठेकेदार", labelEn: "Labour", icon: HardHat, color: "amber" },
  { id: "TRANSPORT", labelHi: "ट्रांसपोर्ट / क्रेन", labelEn: "Transport", icon: Truck, color: "purple" },
  { id: "TRAVEL", labelHi: "यात्रा / पेट्रोल", labelEn: "Travel / Fuel", icon: Car, color: "cyan" },
  { id: "SUPPLIER", labelHi: "सप्लायर", labelEn: "Suppliers", icon: Package, color: "emerald" },
];

function getCategoryBadge(category: string, locale: string) {
  switch (category) {
    case "LABOUR":
      return {
        label: locale === "hi" ? "लेबर / ठेकेदार" : "Labour",
        classes: "bg-amber-50 text-amber-800 border-amber-200",
        icon: HardHat,
      };
    case "TRANSPORT":
      return {
        label: locale === "hi" ? "ट्रांसपोर्ट / वाहन" : "Transport",
        classes: "bg-purple-50 text-purple-800 border-purple-200",
        icon: Truck,
      };
    case "TRAVEL":
      return {
        label: locale === "hi" ? "यात्रा / साइट खर्च" : "Travel",
        classes: "bg-cyan-50 text-cyan-800 border-cyan-200",
        icon: Car,
      };
    case "SUPPLIER":
      return {
        label: locale === "hi" ? "सप्लायर" : "Supplier",
        classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: Package,
      };
    default:
      return {
        label: locale === "hi" ? "ग्राहक / पार्टी" : "Client",
        classes: "bg-blue-50 text-blue-800 border-blue-200",
        icon: Briefcase,
      };
  }
}

function CustomersContent() {
  const { t, locale, user } = useApp();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "udhaar" | "advance" | "settled">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Party Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCategory, setNewCategory] = useState<string>("CLIENT");
  const [initialBalance, setInitialBalance] = useState("");
  const [initialType, setInitialType] = useState<"CREDIT_GIVEN" | "PAYMENT_GOT">("CREDIT_GIVEN");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?query=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.customers);
      }
    } catch (err) {
      console.error("Failed to load parties", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (searchParams.get("openAdd") === "true") {
      setIsModalOpen(true);
    }
  }, [search]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      setErrorMsg(locale === "hi" ? "कृपया नाम और मोबाइल नंबर भरें" : "Name & Phone are required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          phoneNumber: newPhone,
          address: newAddress,
          category: newCategory,
          initialBalance: parseFloat(initialBalance) || 0,
          initialType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setNewName("");
        setNewPhone("");
        setNewAddress("");
        setNewCategory("CLIENT");
        setInitialBalance("");
        fetchCustomers();
      } else {
        setErrorMsg(json.error || "Failed to add party");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    // 1. Category Filter
    if (selectedCategory !== "ALL" && (c.category || "CLIENT") !== selectedCategory) {
      return false;
    }
    // 2. Financial Balance Filter
    if (filterType === "udhaar") return c.currentBalance > 0;
    if (filterType === "advance") return c.currentBalance < 0;
    if (filterType === "settled") return c.currentBalance === 0;
    return true;
  });

  return (
    <div className="p-4 space-y-3.5">
      {/* 1. Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {locale === "hi" ? "खाता बही (Ledger)" : "Parties & Khata"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {locale === "hi"
              ? `पार्टी, लेबर, ट्रांसपोर्ट व यात्रा हिसाब (${customers.length})`
              : `Clients, Labour, Transport & Travel (${customers.length})`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>{locale === "hi" ? "+ नया खाता जोड़ें" : "+ Add Party"}</span>
        </button>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs scale-102"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{locale === "hi" ? cat.labelHi : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            locale === "hi"
              ? "पार्टी का नाम, लेबर या फोन नंबर खोजें..."
              : "Search by party name, labour or phone..."
          }
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. Balance Filter Pills */}
      <div className="flex items-center space-x-2 text-xs font-semibold overflow-x-auto pb-0.5">
        <button
          onClick={() => setFilterType("all")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            filterType === "all"
              ? "bg-slate-700 text-white font-bold"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {locale === "hi" ? "सभी" : "All"} ({customers.length})
        </button>
        <button
          onClick={() => setFilterType("udhaar")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            filterType === "udhaar"
              ? "bg-rose-600 text-white font-bold"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {locale === "hi" ? "लेना बाकी (Lena)" : "Receivable"} (
          {customers.filter((c) => c.currentBalance > 0).length})
        </button>
        <button
          onClick={() => setFilterType("advance")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            filterType === "advance"
              ? "bg-emerald-600 text-white font-bold"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {locale === "hi" ? "देना है / एडवांस (Dena)" : "Advance"} (
          {customers.filter((c) => c.currentBalance < 0).length})
        </button>
      </div>

      {/* 5. Customer / Party Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700">
            {locale === "hi" ? "कोई खाता नहीं मिला" : "No entries found"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "ऊपर '+ नया खाता जोड़ें' बटन दबाकर लेबर, पार्टी या ट्रांसपोर्ट का हिसाब जोड़ें"
              : "Tap '+ Add Party' above to add Client, Labour, or Transport"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCustomers.map((customer) => {
            const isUdhaar = customer.currentBalance > 0;
            const isAdvance = customer.currentBalance < 0;
            const badge = getCategoryBadge(customer.category || "CLIENT", locale);
            const BadgeIcon = badge.icon;

            const reminderUrl = generateWhatsAppReminderUrl({
              customerName: customer.name,
              customerPhone: customer.phoneNumber,
              shopName: user?.businessName || "Anay Enterprises",
              balanceAmount: customer.currentBalance,
              merchantUpiId: user?.upiId,
              locale,
            });

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between"
              >
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex-1 pr-3"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 leading-tight">
                      {customer.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1">
                    {/* Category Pill */}
                    <span
                      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.classes}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      {customer.phoneNumber}
                    </span>
                  </div>

                  {customer.address && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {customer.address}
                    </p>
                  )}
                </Link>

                <div className="flex items-center space-x-2.5">
                  <div className="text-right">
                    <div
                      className={`text-base font-black tracking-tight ${
                        isUdhaar
                          ? "text-rose-600"
                          : isAdvance
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {formatINR(Math.abs(customer.currentBalance))}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isUdhaar
                          ? "bg-rose-50 text-rose-700"
                          : isAdvance
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isUdhaar
                        ? locale === "hi"
                          ? "लेना है"
                          : "You'll Get"
                        : isAdvance
                        ? locale === "hi"
                          ? "देना है"
                          : "You'll Give"
                        : locale === "hi"
                        ? "चुकता"
                        : "Settled"}
                    </span>
                  </div>

                  {/* WhatsApp Reminder Button */}
                  {isUdhaar ? (
                    <a
                      href={reminderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
                      title="Send WhatsApp Reminder with UPI Link"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={`/customers/${customer.id}`}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Add Party / Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {locale === "hi" ? "नया खाता जोड़ें (Party / Khata)" : "Add New Khata Account"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              {/* Category Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === "hi" ? "खाते का प्रकार (Category) *" : "Account Type / Category *"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewCategory("CLIENT")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-colors ${
                      newCategory === "CLIENT"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{locale === "hi" ? "ग्राहक / पार्टी" : "Client / Party"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory("LABOUR")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-colors ${
                      newCategory === "LABOUR"
                        ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>{locale === "hi" ? "लेबर / ठेकेदार" : "Labour / Contractor"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory("TRANSPORT")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-colors ${
                      newCategory === "TRANSPORT"
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{locale === "hi" ? "ट्रांसपोर्ट / क्रेन" : "Transport / Vehicle"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory("TRAVEL")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-colors ${
                      newCategory === "TRAVEL"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>{locale === "hi" ? "यात्रा / पेट्रोल खर्च" : "Travel / Site Fuel"}</span>
                  </button>
                </div>

                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setNewCategory("SUPPLIER")}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-colors ${
                      newCategory === "SUPPLIER"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{locale === "hi" ? "मटेरियल सप्लायर / वेंडर" : "Material Supplier / Vendor"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {newCategory === "LABOUR"
                    ? locale === "hi"
                      ? "लेबर / ठेकेदार का नाम *"
                      : "Labour / Contractor Name *"
                    : newCategory === "TRANSPORT"
                    ? locale === "hi"
                      ? "ट्रांसपोर्टर / गाड़ी का नाम *"
                      : "Transporter / Vehicle Name *"
                    : newCategory === "TRAVEL"
                    ? locale === "hi"
                      ? "ड्राइवर / व्यक्ति का नाम *"
                      : "Person / Driver Name *"
                    : locale === "hi"
                    ? "पार्टी / ग्राहक का नाम *"
                    : "Party / Customer Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={
                    newCategory === "LABOUR"
                      ? "e.g. Ramesh Mistry (Piping)"
                      : newCategory === "TRANSPORT"
                      ? "e.g. Pune Express Hydra Crane"
                      : newCategory === "TRAVEL"
                      ? "e.g. Anil Driver (Site Bolero)"
                      : "e.g. Sai Petroleum Services"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "मोबाइल नंबर (WhatsApp) *" : "Mobile Number (WhatsApp) *"}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9049822762"
                    className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "साइट का पता / विवरण (वैकल्पिक)" : "Site Location / Address (Optional)"}
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Wakad Petrol Pump Site / Hinjawadi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Initial Balance */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === "hi" ? "पुराना बाकी हिसाब (Opening Balance)" : "Starting Balance"}
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setInitialType("CREDIT_GIVEN")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      initialType === "CREDIT_GIVEN"
                        ? "bg-rose-50 border-rose-500 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {locale === "hi" ? "लेना बाकी (Lena)" : "You'll Get"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialType("PAYMENT_GOT")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      initialType === "PAYMENT_GOT"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {locale === "hi" ? "एडवांस / देना है (Dena)" : "You'll Give"}
                  </button>
                </div>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="₹ 0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  {submitting
                    ? locale === "hi"
                      ? "सहेज रहे हैं..."
                      : "Saving..."
                    : locale === "hi"
                    ? "खाता सहेजें"
                    : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-20 bg-slate-200 rounded-2xl"></div>
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
