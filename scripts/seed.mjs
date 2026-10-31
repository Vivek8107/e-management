import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Setting up Anay Enterprises account, Client, Labour, Transport, and Travel Khata data...");

  // Clean existing records
  await prisma.invoiceItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Company / Owner: Anay Enterprises
  const shopOwner = await prisma.user.create({
    data: {
      phoneNumber: "9049822762",
      name: "Vivek (Anay Enterprises)",
      businessName: "Anay Enterprises",
      businessAddress: "Pune, Maharashtra",
      upiId: "9049822762@paytm",
      gstNumber: "27AAAAA0000A1Z5",
      locale: "hi",
    },
  });

  console.log(`✅ Configured Company: ${shopOwner.businessName} (Mobile: ${shopOwner.phoneNumber})`);

  // 2. Clients (ग्राहक / प्रोजेक्ट)
  const client1 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Sai Petroleum Services",
      phoneNumber: "9822110001",
      address: "Wakad Link Rd, Pune",
      category: "CLIENT",
      currentBalance: 45000.0, // Pending receivable / Udhaar
    },
  });

  const client2 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Mahalaxmi Fuel Station",
      phoneNumber: "9822110002",
      address: "Hinjawadi Phase 1, Pune",
      category: "CLIENT",
      currentBalance: 18500.0,
    },
  });

  // 3. Labour / Contractors (लेबर / ठेकेदार / मजदूर)
  const labour1 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Ramesh Mistry (पाइप फिटिंग लेबर)",
      phoneNumber: "9822110005",
      address: "Chakan Site, Pune",
      category: "LABOUR",
      currentBalance: -8500.0, // Advance / We have to give (Dena)
    },
  });

  const labour2 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Mukesh Welding & Fabrication Team",
      phoneNumber: "9822110006",
      address: "Bhosari MIDC, Pune",
      category: "LABOUR",
      currentBalance: 12000.0, // Outstanding wage balance
    },
  });

  // 4. Transport & Crane (ट्रांसपोर्ट / गाड़ी भाड़ा)
  const transport1 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Pune Express Transport (ट्रक व हाइड्रा क्रेन)",
      phoneNumber: "9822110007",
      address: "Nigdi Transport Nagar, Pune",
      category: "TRANSPORT",
      currentBalance: 9500.0, // Pending freight
    },
  });

  // 5. Travel & Site Fuel Expenses (यात्रा / पेट्रोल / ड्राइवर खर्च)
  const travel1 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Anil Driver (साइट टूर व पेट्रोल खर्च)",
      phoneNumber: "9822110008",
      address: "Company Bolero / Site Vehicle",
      category: "TRAVEL",
      currentBalance: -3000.0, // Advance given for fuel & toll
    },
  });

  // 6. Material Supplier (सप्लायर)
  const supplier1 = await prisma.customer.create({
    data: {
      userId: shopOwner.id,
      name: "Shree Steel & Industrial Valves",
      phoneNumber: "9822110009",
      address: "Pimpri Hardware Market, Pune",
      category: "SUPPLIER",
      currentBalance: -22000.0, // Bill pending to pay supplier
    },
  });

  console.log("✅ Created Client, Labour, Transport, Travel, and Supplier accounts!");

  // 7. Transactions
  // Client 1 work
  await prisma.transaction.create({
    data: {
      userId: shopOwner.id,
      customerId: client1.id,
      type: "CREDIT_GIVEN",
      amount: 65000.0,
      note: "Underground Piping & Pump Infrastructure Work (Site Phase 1)",
      date: new Date(Date.now() - 5 * 86400000),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: shopOwner.id,
      customerId: client1.id,
      type: "PAYMENT_GOT",
      amount: 20000.0,
      note: "Part payment received via UPI / NEFT",
      date: new Date(Date.now() - 2 * 86400000),
    },
  });

  // Labour wage transaction
  await prisma.transaction.create({
    data: {
      userId: shopOwner.id,
      customerId: labour1.id,
      type: "CREDIT_GIVEN",
      amount: 5000.0,
      note: "Advance cash given for weekly ration & site food",
      date: new Date(Date.now() - 3 * 86400000),
    },
  });

  // Transport transaction
  await prisma.transaction.create({
    data: {
      userId: shopOwner.id,
      customerId: transport1.id,
      type: "CREDIT_GIVEN",
      amount: 9500.0,
      note: "Crane unloading + 40ft trailer freight from warehouse to Wakad site",
      date: new Date(Date.now() - 1 * 86400000),
    },
  });

  // Travel transaction
  await prisma.transaction.create({
    data: {
      userId: shopOwner.id,
      customerId: travel1.id,
      type: "CREDIT_GIVEN",
      amount: 3000.0,
      note: "FASTag recharge + Diesel cash for site inspection visit",
      date: new Date(),
    },
  });

  // 8. Sample Invoices for Anay Enterprises
  await prisma.invoice.create({
    data: {
      userId: shopOwner.id,
      customerId: client1.id,
      invoiceNumber: "AE-2026-001",
      customerName: client1.name,
      customerPhone: client1.phoneNumber,
      subtotal: 65000.0,
      discount: 0.0,
      taxRate: 0.0,
      taxAmount: 0.0,
      totalAmount: 65000.0,
      paymentStatus: "PARTIAL",
      paymentMode: "KHATA",
      notes: "Commercial Petrol Pump Infrastructure Installation",
      items: {
        create: [
          {
            itemName: "Heavy Underground Pipeline Installation (40m)",
            quantity: 1,
            unit: "job",
            unitPrice: 38000.0,
            totalPrice: 38000.0,
          },
          {
            itemName: "Dispenser Sump & Safety Valve Fitting",
            quantity: 2,
            unit: "set",
            unitPrice: 13500.0,
            totalPrice: 27000.0,
          },
        ],
      },
    },
  });

  console.log("✅ Seed finished successfully with full business breakdown!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
