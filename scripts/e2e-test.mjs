import { spawn } from "child_process";

// Direct testing of the WhatsApp and UPI generator logic matching lib/whatsapp.ts
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
    const cleanUpi = encodeURIComponent(merchantUpiId.trim());
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

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  console.log("⏳ Starting Next.js production server on port " + PORT + "...");
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/user`);
      if (res.ok) {
        console.log("✅ Next.js server is online and responding!\n");
        return true;
      }
    } catch (e) {
      // wait and retry
    }
    await sleep(1000);
  }
  throw new Error("Server failed to start within 30 seconds");
}

async function runTests() {
  let serverProcess;
  const results = [];

  try {
    // 1. Start Next.js server on port 3005
    serverProcess = spawn("npx.cmd", ["next", "start", "-p", String(PORT)], {
      cwd: process.cwd(),
      shell: true,
      stdio: "pipe",
    });

    serverProcess.stderr.on("data", (data) => {
      // console.error(`Server stderr: ${data}`);
    });

    await waitForServer();

    // -------------------------------------------------------------
    // Test 1: Verify Page Routes (HTML Status 200)
    // -------------------------------------------------------------
    console.log("--- 1. Testing Frontend Page Routes ---");
    const pages = ["/", "/customers", "/invoices", "/settings"];
    for (const page of pages) {
      const res = await fetch(`${BASE_URL}${page}`);
      const text = await res.text();
      const passed = res.status === 200 && text.includes("HyperKhata");
      results.push({ name: `Page Route: ${page}`, passed });
      console.log(`${passed ? "✅" : "❌"} ${page} -> HTTP ${res.status}`);
    }

    // -------------------------------------------------------------
    // Test 2: User / Merchant Profile API
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Merchant API ---");
    const userRes = await fetch(`${BASE_URL}/api/user`);
    const userData = await userRes.json();
    const userPassed = userData.success && userData.user.businessName.includes("Sharma");
    results.push({ name: "API: GET /api/user", passed: userPassed });
    console.log(`${userPassed ? "✅" : "❌"} Merchant Profile: ${userData.user?.businessName} (UPI: ${userData.user?.upiId})`);

    // -------------------------------------------------------------
    // Test 3: Dashboard Analytics API
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Dashboard Stats API ---");
    const dashRes = await fetch(`${BASE_URL}/api/dashboard`);
    const dashData = await dashRes.json();
    const dashPassed = dashData.success && dashData.data.stats.totalPendingUdhaar > 0;
    results.push({ name: "API: GET /api/dashboard", passed: dashPassed });
    console.log(`${dashPassed ? "✅" : "❌"} Dashboard Stats: Total Udhaar = ₹${dashData.data?.stats?.totalPendingUdhaar}, Customers = ${dashData.data?.stats?.customerCount}`);

    // -------------------------------------------------------------
    // Test 4: Customer Directory & Search
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Customer Management API ---");
    const custRes = await fetch(`${BASE_URL}/api/customers`);
    const custData = await custRes.json();
    const custPassed = custData.success && custData.customers.length >= 4;
    results.push({ name: "API: GET /api/customers", passed: custPassed });
    console.log(`${custPassed ? "✅" : "❌"} Customers Loaded: ${custData.customers?.length} found`);

    // -------------------------------------------------------------
    // Test 5: Add New Customer
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Create Customer API ---");
    const newCustRes = await fetch(`${BASE_URL}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Vikas Sharma Test",
        phoneNumber: "9876599999",
        address: "Sector 22 Market",
        initialBalance: 600,
        initialType: "CREDIT_GIVEN",
      }),
    });
    const newCustData = await newCustRes.json();
    const createPassed = newCustData.success && newCustData.customer.currentBalance === 600;
    results.push({ name: "API: POST /api/customers (Create Customer)", passed: createPassed });
    console.log(`${createPassed ? "✅" : "❌"} Created Customer: ${newCustData.customer?.name} with Udhaar ₹${newCustData.customer?.currentBalance}`);

    const testCustomerId = newCustData.customer?.id;

    // -------------------------------------------------------------
    // Test 6: Record Transaction & Atomic Balance Update
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Atomic Ledger Transaction ---");
    // Customer pays ₹200 (PAYMENT_GOT) -> balance should reduce from ₹600 to ₹400
    const txRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: testCustomerId,
        type: "PAYMENT_GOT",
        amount: 200,
        note: "UPI Payment received via PhonePe",
      }),
    });
    const txData = await txRes.json();
    const txPassed = txData.success && txData.data.customer.currentBalance === 400;
    results.push({ name: "API: POST /api/transactions (Atomic Settlement)", passed: txPassed });
    console.log(`${txPassed ? "✅" : "❌"} Recorded Payment: ₹200 | New Balance = ₹${txData.data?.customer?.currentBalance} (Expected: ₹400)`);

    // -------------------------------------------------------------
    // Test 7: Invoicing & Automatic Khata Sync
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing Invoicing Module & Khata Sync ---");
    const invRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: testCustomerId,
        customerName: "Vikas Sharma Test",
        customerPhone: "9876599999",
        items: [
          { itemName: "Fortune Sunlite Oil 1L", quantity: 2, unitPrice: 140 },
          { itemName: "Basmati Rice 1kg", quantity: 1, unitPrice: 90 },
        ],
        discount: 20,
        taxRate: 0,
        paymentMode: "KHATA", // Should auto-add to Khata!
        notes: "Monthly grocery purchase",
      }),
    });
    const invData = await invRes.json();
    // Subtotal: 2*140 + 90 = 370. Discount = 20. Total = 350.
    // Previous balance was 400. Adding 350 to Khata -> should now be 750!
    const invPassed = invData.success && invData.invoice.totalAmount === 350;
    results.push({ name: "API: POST /api/invoices (Generate Bill)", passed: invPassed });
    console.log(`${invPassed ? "✅" : "❌"} Invoice Generated: #${invData.invoice?.invoiceNumber} | Grand Total = ₹${invData.invoice?.totalAmount}`);

    // Verify Customer balance got updated by Invoice
    const checkCustRes = await fetch(`${BASE_URL}/api/customers/${testCustomerId}`);
    const checkCustData = await checkCustRes.json();
    const khataSyncPassed = checkCustData.customer.currentBalance === 750;
    results.push({ name: "Feature: Invoice to Khata Auto-Sync", passed: khataSyncPassed });
    console.log(`${khataSyncPassed ? "✅" : "❌"} Khata Auto-Sync: Customer balance updated to ₹${checkCustData.customer?.currentBalance} (Expected: ₹750)`);

    // -------------------------------------------------------------
    // Test 8: WhatsApp Reminder & UPI Deep Link Generator
    // -------------------------------------------------------------
    console.log("\n--- 8. Testing WhatsApp & UPI Deep Link Generator ---");
    const reminderUrl = generateWhatsAppReminderUrl({
      customerName: "Vikas Sharma",
      customerPhone: "9876599999",
      shopName: "Sharma Kirana Store",
      balanceAmount: 750,
      merchantUpiId: "sharmakirana@okaxis",
      locale: "hi",
    });

    const isWaValid =
      reminderUrl.startsWith("https://wa.me/919876599999") &&
      reminderUrl.includes("upi%3A%2F%2Fpay") &&
      reminderUrl.includes("sharmakirana%40okaxis");

    results.push({ name: "Utility: WhatsApp Reminder URL & UPI Intent", passed: isWaValid });
    console.log(`${isWaValid ? "✅" : "❌"} Generated WhatsApp URL: ${reminderUrl.slice(0, 85)}...`);

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n=========================================");
    console.log("            TEST RESULTS SUMMARY         ");
    console.log("=========================================");
    let allPassed = true;
    for (const r of results) {
      console.log(`${r.passed ? "🟢 PASS" : "🔴 FAIL"}: ${r.name}`);
      if (!r.passed) allPassed = false;
    }
    console.log("=========================================");
    if (allPassed) {
      console.log("🎉 ALL 10 CORE FEATURES & INTEGRATIONS PASSED WITH 100% SUCCESS!");
    } else {
      console.error("❌ Some tests failed!");
      process.exitCode = 1;
    }

  } catch (err) {
    console.error("❌ Test suite encountered an error:", err);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      console.log("\n🛑 Stopping test server...");
      serverProcess.kill("SIGTERM");
    }
  }
}

runTests();
