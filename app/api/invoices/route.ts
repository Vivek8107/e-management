import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discount = 0,
      taxRate = 0,
      paymentMode = "CASH",
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const parsedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      return {
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit || "pcs",
        unitPrice: price,
        totalPrice: qty * price,
      };
    });

    const subtotal = parsedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const numDiscount = parseFloat(discount) || 0;
    const discountedTotal = Math.max(0, subtotal - numDiscount);
    const numTaxRate = parseFloat(taxRate) || 0;
    const taxAmount = (discountedTotal * numTaxRate) / 100;
    const totalAmount = discountedTotal + taxAmount;

    // Generate unique invoice number
    const count = await prisma.invoice.count({ where: { userId: user.id } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const paymentStatus = paymentMode === "KHATA" ? "UNPAID" : "PAID";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice with Items
      const invoice = await tx.invoice.create({
        data: {
          userId: user.id,
          customerId: customerId || null,
          customerName: customerName || "Walk-in Customer",
          customerPhone: customerPhone || "",
          invoiceNumber,
          subtotal,
          discount: numDiscount,
          taxRate: numTaxRate,
          taxAmount,
          totalAmount,
          paymentStatus,
          paymentMode,
          notes: notes || null,
          items: {
            create: parsedItems,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 2. If added to Khata (Udhaar), update ledger & customer balance
      if (paymentMode === "KHATA" && customerId) {
        await tx.transaction.create({
          data: {
            userId: user.id,
            customerId,
            invoiceId: invoice.id,
            type: "CREDIT_GIVEN",
            amount: totalAmount,
            note: `Bill #${invoiceNumber}`,
          },
        });

        await tx.customer.update({
          where: { id: customerId },
          data: {
            currentBalance: {
              increment: totalAmount,
            },
          },
        });
      }

      return invoice;
    });

    return NextResponse.json({ success: true, invoice: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
