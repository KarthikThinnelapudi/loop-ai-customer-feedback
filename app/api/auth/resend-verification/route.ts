import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = resendSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "If account exists, a new verification code has been sent." },
        { status: 200, headers }
      );
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const tokenStr = crypto.randomBytes(32).toString("hex");

    // Delete older verification tokens for this identifier
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create 10-minute OTP verification token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otpCode,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 Minutes
      },
    });

    // Fallback link token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenStr,
        expires: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}`;

    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name || "Customer",
      code: otpCode,
      expiresMinutes: 10,
      verifyUrl,
    });

    return NextResponse.json(
      { message: "A new 6-digit OTP verification code has been sent to your email." },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400, headers });
    }
    console.error("Resend Verification Error:", error);
    return NextResponse.json({ message: "Failed to resend verification OTP." }, { status: 500, headers });
  }
}
