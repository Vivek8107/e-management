interface PaymentReminderParams {
  customerName: string;
  customerPhone: string;
  shopName: string;
  balanceAmount: number; // in Rupees (positive = customer owes merchant)
  merchantUpiId?: string | null;
  locale?: "en" | "hi";
}

interface InvoiceShareParams {
  customerName: string;
  customerPhone: string;
  shopName: string;
  invoiceNumber: string;
  totalAmount: number;
  itemCount: number;
  paymentMode: string;
  merchantUpiId?: string | null;
  locale?: "en" | "hi";
}

/**
 * Format phone number to clean WhatsApp international format (e.g. 919876543210)
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length > 10 && digits.startsWith("91")) {
    return digits;
  }
  return digits;
}

/**
 * Build NPCI standard UPI Payment deep-link URL
 */
export function buildUpiDeepLink({
  upiId,
  merchantName,
  amount,
  transactionNote = "Payment",
}: {
  upiId: string;
  merchantName: string;
  amount: number;
  transactionNote?: string;
}): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(merchantName.trim());
  const cleanAmount = amount.toFixed(2);
  const cleanNote = encodeURIComponent(transactionNote.trim());
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Generate click-to-chat WhatsApp link for payment reminders
 */
export function generateWhatsAppReminderUrl({
  customerName,
  customerPhone,
  shopName,
  balanceAmount,
  merchantUpiId,
  locale = "hi",
}: PaymentReminderParams): string {
  const targetPhone = sanitizeWhatsAppPhone(customerPhone);
  const formattedAmt = `₹${Math.abs(balanceAmount).toFixed(2)}`;

  let upiMessage = "";
  if (merchantUpiId && balanceAmount > 0) {
    const upiLink = buildUpiDeepLink({
      upiId: merchantUpiId,
      merchantName: shopName,
      amount: balanceAmount,
      transactionNote: `Khata payment to ${shopName}`,
    });
    upiMessage =
      locale === "hi"
        ? `\n\nDirect UPI se payment karne ke liye yahan click karein:\n${upiLink}`
        : `\n\nTo pay directly via UPI, tap here:\n${upiLink}`;
  }

  const text =
    locale === "hi"
      ? `Namaste ${customerName} ji,\n\n*${shopName}* se aapka kul baaki hisaab (Udhaar): *${formattedAmt}* hai. Kripya samay par bhugtan karein.${upiMessage}\n\nDhanyawad!`
      : `Dear ${customerName},\n\nYour outstanding pending balance at *${shopName}* is *${formattedAmt}*. Kindly clear the payment at your earliest convenience.${upiMessage}\n\nThank you!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate click-to-chat WhatsApp link for digital bill/invoice sharing
 */
export function generateWhatsAppInvoiceUrl({
  customerName,
  customerPhone,
  shopName,
  invoiceNumber,
  totalAmount,
  itemCount,
  paymentMode,
  merchantUpiId,
  locale = "hi",
}: InvoiceShareParams): string {
  const targetPhone = sanitizeWhatsAppPhone(customerPhone);
  const formattedAmt = `₹${totalAmount.toFixed(2)}`;

  let upiMessage = "";
  if (merchantUpiId && paymentMode === "KHATA") {
    const upiLink = buildUpiDeepLink({
      upiId: merchantUpiId,
      merchantName: shopName,
      amount: totalAmount,
      transactionNote: `Invoice ${invoiceNumber}`,
    });
    upiMessage = `\n\nUPI Payment link:\n${upiLink}`;
  }

  const text =
    locale === "hi"
      ? `*${shopName}* - Digital Bill Receipt 🧾\n\nNamaste ${customerName} ji,\nAapka bill generate ho gaya hai:\n- Bill No: *${invoiceNumber}*\n- Kul Saman: ${itemCount} items\n- Kul Rakam: *${formattedAmt}*\n- Payment Mode: ${paymentMode}${upiMessage}\n\nHumari dukaan par aane ke liye dhanyawad! Agli baar fir se padhariye.`
      : `*${shopName}* - Digital Invoice Receipt 🧾\n\nDear ${customerName},\nHere is your digital bill:\n- Invoice No: *${invoiceNumber}*\n- Total Items: ${itemCount}\n- Grand Total: *${formattedAmt}*\n- Payment Mode: ${paymentMode}${upiMessage}\n\nThank you for shopping with us!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
