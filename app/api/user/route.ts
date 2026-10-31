import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: "9049822762",
          name: "Vivek",
          businessName: "Anay Enterprises",
          businessAddress: "Pune, Maharashtra",
          upiId: "9049822762@paytm",
          locale: "hi",
        },
      });
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, name, businessName, upiId, gstNumber, locale } = body;

    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (user) {
      // Update existing
      user = await prisma.user.update({
        where: { phoneNumber },
        data: {
          name: name ?? user.name,
          businessName: businessName ?? user.businessName,
          upiId: upiId ?? user.upiId,
          gstNumber: gstNumber ?? user.gstNumber,
          locale: locale ?? user.locale,
        },
      });
    } else {
      // Create new
      user = await prisma.user.create({
        data: {
          phoneNumber,
          name: name || "Shop Owner",
          businessName: businessName || "My Store",
          upiId: upiId || "",
          gstNumber: gstNumber || "",
          locale: locale || "hi",
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
