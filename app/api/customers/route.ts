import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";

    const whereClause: any = {
      userId: user.id,
      OR: [
        { name: { contains: query } },
        { phoneNumber: { contains: query } },
      ],
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: [
        { currentBalance: "desc" }, // Highest udhaar first
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, customers });
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
      name,
      phoneNumber,
      address,
      category = "CLIENT",
      initialBalance = 0,
      initialType = "CREDIT_GIVEN",
    } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Name and phone number are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.$transaction(async (tx) => {
      const balance =
        initialType === "CREDIT_GIVEN"
          ? Math.abs(Number(initialBalance))
          : -Math.abs(Number(initialBalance));

      const newCustomer = await tx.customer.create({
        data: {
          userId: user.id,
          name,
          phoneNumber,
          address: address || null,
          category: category || "CLIENT",
          currentBalance: balance,
        },
      });

      if (Number(initialBalance) > 0) {
        await tx.transaction.create({
          data: {
            userId: user.id,
            customerId: newCustomer.id,
            type: initialType,
            amount: Math.abs(Number(initialBalance)),
            note: "Starting balance / Purana hisaab",
          },
        });
      }

      return newCustomer;
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
