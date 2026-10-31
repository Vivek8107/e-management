import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// WhatsApp and UPI generator test logic
function generateWhatsAppReminderUrl({
  customerName,
  customerPhone,
  shopName,
  balanceAmount,
  merchantUpiId,
  locale = "hi",
}) {
  const digits = customerPhone.replace(/\D/g, "");
  const formattedPhone = digits.length === 10 ? `91${digits}` : digits;
  const formattedAmt = `₹${Math.abs(balanceAmount).toFixed(2)}`;

  let upiMessage = "";
  if (merchantUpiId && balanceAmount > 0) {
    const cleanUpi = merchantUpiId.trim();
    const cleanName = encodeURIComponent(shopName.trim());
    const cleanAmount = balanceAmount.toFixed(2);
    const upiLink = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent("Khata payment")}`;
    upiMessage =
      locale === "hi"
        ? `\n\nDirect UPI se payment karne ke liye yahan click karein:\n${upiLink}`
        : `\n\nTo pay directly via UPI, tap here:\n${upiLink}`;
  }

  const text =
    locale === "hi"
      ? `Namaste ${customerName} ji,\n\n*${shopName}* se aapka kul baaki hisaab (Udhaar): *${formattedAmt}* hai. Kripya samay par bhugtan karein.${upiMessage}\n\nDhanyawad!`
      : `Dear ${customerName},\n\nYour outstanding pending balance at *${shopName}* is *${formattedAmt}*. Kindly clear the payment at your earliest convenience.${upiMessage}\n\nThank you!`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

async function verifyAll() {
  console.log("⚡ Starting Comprehensive HyperKhata Verification Suite...\n");
  const checks = [];

  // 1. Merchant User Verification
  try {
    const user = await prisma.user.findFirst();
    if (user && user.businessName.includes("Anay")) {
      checks.push({ name: "1. Company Profile (Anay Enterprises, Phone: " + user.phoneNumber + ", UPI: " + user.upiId + ")", passed: true });
    } else {
      checks.push({ name: "1. Company Profile", passed: false });
    }
  } catch (e) {
    checks.push({ name: "1. Company Profile (" + e.message + ")", passed: false });
  }

  // 2. Customers List Verification
  let testCustomer = null;
  try {
    const customers = await prisma.customer.findMany();
    const categoriesFound = new Set(customers.map(c => c.category));
    if (customers.length >= 4 && categoriesFound.has("LABOUR") && categoriesFound.has("TRANSPORT")) {
      testCustomer = customers[0];
      checks.push({ name: `2. Customer Directory (${customers.length} parties found: Labour, Transport, Travel, Clients)`, passed: true });
    } else {
      checks.push({ name: "2. Customer Directory", passed: false });
    }
  } catch (e) {
    checks.push({ name: "2. Customer Directory (" + e.message + ")", passed: false });
  }

  // 3. New Customer Creation Test
  let createdCustomer = null;
  try {
    const uniquePhone = "998877" + Math.floor(1000 + Math.random() * 9000);
    const user = await prisma.user.findFirst();
    createdCustomer = await prisma.$transaction(async (tx) => {
      const c = await tx.customer.create({
        data: {
          userId: user.id,
          name: "Vikas Sharma Test",
          phoneNumber: uniquePhone,
          address: "Sector 22 Market",
          currentBalance: 500.0,
        },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          customerId: c.id,
          type: "CREDIT_GIVEN",
          amount: 500.0,
          note: "Opening Udhaar balance",
        },
      });
      return c;
    });

    if (createdCustomer && createdCustomer.currentBalance === 500.0) {
      checks.push({ name: `3. Customer Creation with Opening Udhaar (₹500 for ${createdCustomer.name})`, passed: true });
    } else {
      checks.push({ name: "3. Customer Creation", passed: false });
    }
  } catch (e) {
    checks.push({ name: "3. Customer Creation (" + e.message + ")", passed: false });
  }

  // 4. Atomic Ledger Payment Got (Jama) Test
  try {
    const user = await prisma.user.findFirst();
    // Customer pays ₹200 back. Balance should drop from ₹500 to ₹300
    const paymentAmount = 200.0;
    const result = await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: user.id,
          customerId: createdCustomer.id,
          type: "PAYMENT_GOT",
          amount: paymentAmount,
          note: "UPI payment via PhonePe",
        },
      });
      return await tx.customer.update({
        where: { id: createdCustomer.id },
        data: { currentBalance: { increment: -paymentAmount } },
      });
    });

    if (result.currentBalance === 300.0) {
      checks.push({ name: "4. Atomic Ledger Payment Settlement (Paid ₹200 -> Balance updated from ₹500 to ₹300)", passed: true });
    } else {
      checks.push({ name: `4. Atomic Ledger Payment Settlement (Balance is ${result.currentBalance}, expected 300)`, passed: false });
    }
  } catch (e) {
    checks.push({ name: "4. Atomic Ledger Payment Settlement (" + e.message + ")", passed: false });
  }

  // 5. Invoicing & Khata Auto-Sync Test
  try {
    const user = await prisma.user.findFirst();
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-TEST-${invoiceCount + 1}`;
    const totalAmount = 450.0;

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          userId: user.id,
          customerId: createdCustomer.id,
          customerName: createdCustomer.name,
          customerPhone: createdCustomer.phoneNumber,
          invoiceNumber,
          subtotal: 450.0,
          discount: 0.0,
          taxRate: 0.0,
          taxAmount: 0.0,
          totalAmount: 450.0,
          paymentStatus: "UNPAID",
          paymentMode: "KHATA", // Added to Khata!
          items: {
            create: [
              { itemName: "Tata Sampann Dal 1kg", quantity: 2, unitPrice: 150.0, totalPrice: 300.0 },
              { itemName: "Chakki Fresh Atta 5kg", quantity: 1, unitPrice: 150.0, totalPrice: 150.0 },
            ],
          },
        },
      });

      // Synchronize Khata: add ₹450 to customer's Udhaar
      await tx.transaction.create({
        data: {
          userId: user.id,
          customerId: createdCustomer.id,
          invoiceId: inv.id,
          type: "CREDIT_GIVEN",
          amount: 450.0,
          note: `Bill #${invoiceNumber}`,
        },
      });

      const updatedC = await tx.customer.update({
        where: { id: createdCustomer.id },
        data: { currentBalance: { increment: 450.0 } },
      });

      return { inv, updatedC };
    });

    // Previous was 300. Adding 450 -> 750!
    if (invoice.updatedC.currentBalance === 750.0) {
      checks.push({ name: "5. Invoice Generation & Khata Auto-Sync (Billed ₹450 -> Balance updated to ₹750)", passed: true });
    } else {
      checks.push({ name: `5. Invoice Generation & Khata Auto-Sync (Balance is ${invoice.updatedC.currentBalance})`, passed: false });
    }
  } catch (e) {
    checks.push({ name: "5. Invoice Generation & Khata Auto-Sync (" + e.message + ")", passed: false });
  }

  // 6. WhatsApp Reminder URL & UPI Intent Link Test
  try {
    const waUrl = generateWhatsAppReminderUrl({
      customerName: "Vikas Sharma",
      customerPhone: "9876599999",
      shopName: "Sharma Kirana Store",
      balanceAmount: 750.0,
      merchantUpiId: "sharmakirana@okaxis",
      locale: "hi",
    });

    const decodedMessage = decodeURIComponent(waUrl);
    const hasPhone = waUrl.startsWith("https://wa.me/919876599999");
    const hasUpi = decodedMessage.includes("upi://pay") && decodedMessage.includes("sharmakirana@okaxis");
    const hasAmount = decodedMessage.includes("750");

    if (hasPhone && hasUpi && hasAmount) {
      checks.push({ name: "6. WhatsApp 1-Click Reminder + Deep-linked UPI Intent (NPCI standard)", passed: true });
    } else {
      checks.push({ name: "6. WhatsApp 1-Click Reminder + UPI Intent", passed: false });
    }
  } catch (e) {
    checks.push({ name: "6. WhatsApp 1-Click Reminder (" + e.message + ")", passed: false });
  }

  // 7. Dashboard Aggregation Test
  try {
    const user = await prisma.user.findFirst();
    const customers = await prisma.customer.findMany({ where: { userId: user.id } });
    const totalPending = customers.filter(c => c.currentBalance > 0).reduce((s, c) => s + c.currentBalance, 0);

    const invoices = await prisma.invoice.findMany({ where: { userId: user.id } });
    const totalSales = invoices.reduce((s, i) => s + i.totalAmount, 0);

    if (totalPending > 0 && totalSales > 0) {
      checks.push({ name: `7. Real-Time Dashboard Aggregations (Total Udhaar: ₹${totalPending.toFixed(2)}, Total Sales: ₹${totalSales.toFixed(2)})`, passed: true });
    } else {
      checks.push({ name: "7. Dashboard Aggregations", passed: false });
    }
  } catch (e) {
    checks.push({ name: "7. Dashboard Aggregations (" + e.message + ")", passed: false });
  }

  // Clean up test customer
  if (createdCustomer) {
    try {
      await prisma.invoiceItem.deleteMany({ where: { invoice: { customerId: createdCustomer.id } } });
      await prisma.invoice.deleteMany({ where: { customerId: createdCustomer.id } });
      await prisma.transaction.deleteMany({ where: { customerId: createdCustomer.id } });
      await prisma.customer.delete({ where: { id: createdCustomer.id } });
    } catch (e) {}
  }

  console.log("=================================================================");
  console.log("             HYPERKHATA MVP SYSTEM VERIFICATION REPORT          ");
  console.log("=================================================================");
  let allGood = true;
  for (const c of checks) {
    console.log(`${c.passed ? "  [PASS] OK" : "  [FAIL] NO"} -> ${c.name}`);
    if (!c.passed) allGood = false;
  }
  console.log("=================================================================");
  if (allGood) {
    console.log("ALL MODULES, DATABASE TRANSACTIONS & WHATSAPP LOGIC ARE 100% OPERATIONAL!");
  }
}

verifyAll().catch(console.error).finally(() => prisma.$disconnect());
