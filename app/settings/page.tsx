"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  User,
  Phone,
  QrCode,
  MapPin,
  CheckCircle,
  AlertCircle,
  Languages,
  Shield,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/AppContext";

export default function SettingsPage() {
  const { user, refreshUser, locale, setLocale, t } = useApp();

  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || "");
      setName(user.name || "");
      setPhoneNumber(user.phoneNumber || "");
      setUpiId(user.upiId || "");
      setBusinessAddress(user.businessAddress || "");
      setGstNumber(user.gstNumber || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber || user?.phoneNumber || "9876500001",
          name,
          businessName,
          upiId,
          businessAddress,
          gstNumber,
          locale,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(
          locale === "hi"
            ? "दुकान की जानकारी सुरक्षित हो गई है!"
            : "Shop settings updated successfully!"
        );
        refreshUser();
      } else {
        setErrorMsg(json.error || "Failed to update profile");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1. Header with Logo */}
      <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
          <img src="/logo.png" alt="Anay Enterprises" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            {businessName || "Anay Enterprises"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {phoneNumber ? `+91 ${phoneNumber}` : "+91 9049822762"}
          </p>
          <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5">
            Verified Business Profile
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Language Preference Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Languages className="w-4 h-4 text-emerald-600" />
          <span>{locale === "hi" ? "भाषा का चयन (Language)" : "Language Selection"}</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLocale("hi")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
              locale === "hi"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            🇮🇳 हिंदी / Hinglish
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
              locale === "en"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            🌐 English
          </button>
        </div>
      </div>

      {/* 3. Shop & UPI Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          {locale === "hi" ? "दुकान व मालिक का विवरण" : "Merchant & Business Info"}
        </label>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {locale === "hi" ? "दुकान / व्यापार का नाम *" : "Shop / Business Name *"}
          </label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Anay Enterprises"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {locale === "hi" ? "दुकानदार / संचालक का नाम" : "Owner Name"}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vivek"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* UPI ID (Key Highlight for instant payments) */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-emerald-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>{locale === "hi" ? "दुकान की UPI आईडी (VPA)" : "Merchant UPI ID (VPA)"}</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
              WhatsApp Link
            </span>
          </div>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. 9049822762@paytm or anay@upi"
            className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
          <p className="text-[11px] text-emerald-800 leading-snug">
            {locale === "hi"
              ? "💡 यह UPI आईडी आपके द्वारा ग्राहकों को भेजे जाने वाले व्हाट्सएप तकाजे में सीधे पेमेंट लिंक बन जाएगी।"
              : "💡 This UPI ID is automatically embedded as a 1-tap payment link inside WhatsApp reminders."}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {locale === "hi" ? "दुकान का पता" : "Shop Address"}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="e.g. Shop No. 12, Main Market"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {locale === "hi" ? "जीएसटी नंबर (वैकल्पिक)" : "GST Number (Optional)"}
          </label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="07AAAAA0000A1Z5"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
        >
          {saving
            ? locale === "hi"
              ? "सहेज रहे हैं..."
              : "Saving Settings..."
            : locale === "hi"
            ? "सेटिंग्स सुरक्षित करें"
            : "Save Settings"}
        </button>
      </form>

      {/* 4. App Info Card */}
      <div className="bg-slate-100 rounded-2xl p-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">HyperKhata v1.0 (MVP)</p>
        <p className="text-[11px]">Made for Bharat's Kirana Stores & Local Merchants 🇮🇳</p>
      </div>
    </div>
  );
}
