import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { customerId, type, amount, note, date } = body;

    const numAmount = parseFloat(amount);
    if (!customerId || !type || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid customerId, type, and amount are required" },
        { status: 400 }
      );
    }

    if (type !== "CREDIT_GIVEN" && type !== "PAYMENT_GOT") {
      return NextResponse.json(
        { success: false, error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          customerId,
          type,
          amount: numAmount,
          note: note || null,
          date: date ? new Date(date) : new Date(),
        },
      });

      // 2. Compute signed change:
      // CREDIT_GIVEN (You gave / Udhaar) -> +amount
      // PAYMENT_GOT (You got / Jama)     -> -amount
      const balanceDelta = type === "CREDIT_GIVEN" ? numAmount : -numAmount;

      // 3. Atomically adjust customer balance
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          currentBalance: {
            increment: balanceDelta,
          },
        },
      });

      return { transaction, customer: updatedCustomer };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
