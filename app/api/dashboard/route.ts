import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 1. Calculate Total Udhaar (All positive customer balances)
    const customers = await prisma.customer.findMany({
      where: { userId: user.id },
      select: { currentBalance: true },
    });

    const totalPendingUdhaar = customers
      .filter((c) => c.currentBalance > 0)
      .reduce((sum, c) => sum + c.currentBalance, 0);

    const totalAdvanceReceived = customers
      .filter((c) => c.currentBalance < 0)
      .reduce((sum, c) => sum + Math.abs(c.currentBalance), 0);

    // 2. Start of today (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Today's Collections (PAYMENT_GOT recorded today)
    const todayPayments = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "PAYMENT_GOT",
        date: { gte: today },
      },
      select: { amount: true },
    });
    const todayCollections = todayPayments.reduce((sum, t) => sum + t.amount, 0);

    // 4. Today's Billed Sales (Invoices generated today)
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
      select: { totalAmount: true },
    });
    const todaySales = todayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    // 5. Recent 6 transactions with customer info
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        customer: {
          select: { name: true, phoneNumber: true },
        },
      },
      orderBy: { date: "desc" },
      take: 6,
    });

    // 6. Recent 4 invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          totalPendingUdhaar,
          totalAdvanceReceived,
          todayCollections,
          todaySales,
          customerCount: customers.length,
        },
        recentTransactions,
        recentInvoices,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
