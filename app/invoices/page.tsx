"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Send,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { generateWhatsAppInvoiceUrl } from "@/lib/whatsapp";
import { useApp } from "@/components/AppContext";

interface LineItem {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export default function InvoicesPage() {
  const { t, locale, user } = useApp();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [customers, setCustomers] = useState<any[]>([]);
  const [pastInvoices, setPastInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { itemName: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "KHATA">("CASH");
  const [notes, setNotes] = useState("");

  // Post Submission Success State
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchCustomers();
    fetchPastInvoices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) setCustomers(json.customers);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPastInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const json = await res.json();
      if (json.success) setPastInvoices(json.invoices);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const found = customers.find((c) => c.id === customerId);
      if (found) {
        setCustomName(found.name);
        setCustomPhone(found.phoneNumber);
      }
    } else {
      setCustomName("");
      setCustomPhone("");
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { itemName: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? parseFloat(value) || 0 : target.quantity;
      const p = field === "unitPrice" ? parseFloat(value) || 0 : target.unitPrice;
      target.totalPrice = q * p;
    }

    updated[index] = target;
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const discounted = Math.max(0, subtotal - (discount || 0));
  const taxAmount = (discounted * (taxRate || 0)) / 100;
  const grandTotal = discounted + taxAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.itemName.trim() && i.totalPrice > 0);

    if (validItems.length === 0) {
      setErrorMsg(locale === "hi" ? "कम से कम एक सामान और उसकी कीमत दर्ज करें" : "Add at least 1 valid item");
      return;
    }

    if (paymentMode === "KHATA" && !selectedCustomerId) {
      setErrorMsg(
        locale === "hi"
          ? "खाते में उधार चढ़ाने के लिए ग्राहक चुनना अनिवार्य है"
          : "Please select a registered customer to add bill to Khata"
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          customerName: customName || "Walk-in Customer",
          customerPhone: customPhone || "",
          items: validItems,
          discount,
          taxRate,
          paymentMode,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedInvoice(json.invoice);
        fetchPastInvoices();
      } else {
        setErrorMsg(json.error || "Failed to create invoice");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setCreatedInvoice(null);
    setSelectedCustomerId("");
    setCustomName("");
    setCustomPhone("");
    setItems([{ itemName: "", quantity: 1, unit: "pcs", unitPrice: 0, totalPrice: 0 }]);
    setDiscount(0);
    setTaxRate(0);
    setPaymentMode("CASH");
    setNotes("");
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1. Header Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {locale === "hi" ? "बिलिंग काउंटर (Invoicing)" : "Quick Billing Counter"}
          </h1>
          <p className="text-xs text-slate-500">
            {locale === "hi" ? "पक्का डिजिटल बिल बनाएं व WhatsApp पर भेजें" : "Create digital bills and share via WhatsApp"}
          </p>
        </div>

        <div className="flex bg-slate-200 p-0.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("create");
              setCreatedInvoice(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "create" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
            }`}
          >
            {locale === "hi" ? "नया बिल" : "New Bill"}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "history" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
            }`}
          >
            {locale === "hi" ? "पुराने बिल" : "History"}
          </button>
        </div>
      </div>

      {/* 2. Success Modal / Receipt Card */}
      {createdInvoice ? (
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="text-center pb-3 border-b border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {locale === "hi" ? "बिल सफलतापूर्वक बन गया!" : "Bill Created Successfully!"}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {createdInvoice.invoiceNumber} • {formatDate(createdInvoice.createdAt)}
            </p>
          </div>

          {/* Printable Receipt Preview Area */}
          <div id="thermal-receipt" className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <img
                src="/logo.png"
                alt="Anay Enterprises"
                className="h-10 mx-auto mb-1.5 object-contain"
              />
              <p className="font-bold text-sm text-slate-900">{user?.businessName || "Anay Enterprises"}</p>
              <p className="text-[10px] text-slate-500">{user?.businessAddress || "Pune, Maharashtra"}</p>
              {user?.gstNumber && <p className="text-[10px] text-slate-500">GST: {user.gstNumber}</p>}
            </div>

            <div className="flex justify-between text-[11px]">
              <span>Customer: {createdInvoice.customerName}</span>
              <span>Mode: {createdInvoice.paymentMode}</span>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
              {createdInvoice.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.itemName} (x{item.quantity})</span>
                  <span>{formatINR(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatINR(createdInvoice.subtotal)}</span>
              </div>
              {createdInvoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatINR(createdInvoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatINR(createdInvoice.totalAmount)}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
              Thank you for shopping with us! 🙏
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {createdInvoice.customerPhone && (
              <a
                href={generateWhatsAppInvoiceUrl({
                  customerName: createdInvoice.customerName,
                  customerPhone: createdInvoice.customerPhone,
                  shopName: user?.businessName || "Anay Enterprises",
                  invoiceNumber: createdInvoice.invoiceNumber,
                  totalAmount: createdInvoice.totalAmount,
                  itemCount: createdInvoice.items?.length || 1,
                  paymentMode: createdInvoice.paymentMode,
                  merchantUpiId: user?.upiId,
                  locale,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{locale === "hi" ? "व्हाट्सएप पर बिल भेजें" : "Share on WhatsApp"}</span>
              </a>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{locale === "hi" ? "प्रिंट निकालें" : "Print Receipt"}</span>
              </button>

              <button
                onClick={resetForm}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {locale === "hi" ? "+ नया बिल बनाएं" : "+ Create Next Bill"}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === "create" ? (
        /* 3. New Invoice Form */
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Customer Selection Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {locale === "hi" ? "ग्राहक चुनें या नया नाम दर्ज करें" : "Customer Selection"}
            </label>

            <div>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">
                  {locale === "hi" ? "👤 नया / वॉक-इन ग्राहक (Walk-in)" : "👤 Walk-in Customer"}
                </option>
                {customers.map((c) => {
                  const catLabel =
                    c.category === "LABOUR"
                      ? "👷 लेबर"
                      : c.category === "TRANSPORT"
                      ? "🚚 ट्रांसपोर्ट"
                      : c.category === "TRAVEL"
                      ? "🚗 यात्रा"
                      : c.category === "SUPPLIER"
                      ? "🏭 सप्लायर"
                      : "🏢 पार्टी";
                  return (
                    <option key={c.id} value={c.id}>
                      {catLabel} - {c.name} ({c.phoneNumber}) • Bal: {formatINR(c.currentBalance)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={locale === "hi" ? "ग्राहक का नाम" : "Customer Name"}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                maxLength={10}
                placeholder={locale === "hi" ? "मोबाइल नंबर" : "WhatsApp Phone"}
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ""))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Items Line Table */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {locale === "hi" ? "सामान सूची (Items List)" : "Line Items"}
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === "hi" ? "सामान जोड़ें" : "Add Item"}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder={locale === "hi" ? "सामान का नाम (e.g. Atta 5kg)" : "Item name"}
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Rate (₹):</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Total:</span>
                      <div className="w-full bg-slate-200/60 rounded-lg px-2 py-1 text-xs font-black text-slate-900 truncate">
                        {formatINR(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Calculation Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {locale === "hi" ? "भुगतान का प्रकार (Payment Mode)" : "Payment Mode"}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("CASH")}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  paymentMode === "CASH"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                💵 {locale === "hi" ? "नकद (Cash)" : "Cash"}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("UPI")}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  paymentMode === "UPI"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                📱 UPI / Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("KHATA")}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  paymentMode === "KHATA"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                🔴 {locale === "hi" ? "खाते में (उधार)" : "Add to Khata"}
              </button>
            </div>

            {paymentMode === "KHATA" && (
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
                ⚠️ {locale === "hi" ? "यह बिल सीधे ग्राहक के खाते में उधार (Udhaar) के रूप में जुड़ जाएगा।" : "This bill amount will be added to the customer's Khata as pending credit."}
              </p>
            )}

            {/* Calculations */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-right font-bold"
                />
              </div>
              <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>{locale === "hi" ? "कुल बिल राशि (Grand Total):" : "Grand Total:"}</span>
                <span className="text-emerald-700 text-lg">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || grandTotal <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-sm shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-3"
            >
              {submitting
                ? locale === "hi"
                  ? "बिल बना रहे हैं..."
                  : "Generating Bill..."
                : locale === "hi"
                ? `बिल बनाएं (${formatINR(grandTotal)})`
                : `Generate Bill (${formatINR(grandTotal)})`}
            </button>
          </div>
        </form>
      ) : (
        /* 4. Past Invoices History */
        <div className="space-y-2.5">
          {pastInvoices.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No past invoices</p>
            </div>
          ) : (
            pastInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        inv.paymentMode === "KHATA"
                          ? "bg-rose-100 text-rose-700"
                          : inv.paymentMode === "UPI"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {inv.paymentMode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {inv.customerName || "Walk-in"} • {inv.items?.length || 0} items
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDate(inv.createdAt)}</p>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-slate-900">
                    {formatINR(inv.totalAmount)}
                  </div>
                  {inv.customerPhone && (
                    <a
                      href={generateWhatsAppInvoiceUrl({
                        customerName: inv.customerName,
                        customerPhone: inv.customerPhone,
                        shopName: user?.businessName || "Anay Enterprises",
                        invoiceNumber: inv.invoiceNumber,
                        totalAmount: inv.totalAmount,
                        itemCount: inv.items?.length || 1,
                        paymentMode: inv.paymentMode,
                        merchantUpiId: user?.upiId,
                        locale,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline mt-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
