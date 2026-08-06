import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: "If account exists, a new verification link has been sent." });
    }

    const tokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Delete older verification tokens for this identifier
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create 24-hour verification token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenStr,
        expires: new Date(Date.now() + 24 * 3600 * 1000), // 24 Hours
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;

    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name || "User",
      verifyUrl,
      expiresHours: 24,
    });

    return NextResponse.json({ message: "A new verification email has been sent to your address." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Resend Verification Error:", error);
    return NextResponse.json({ message: "Failed to resend verification email." }, { status: 500 });
  }
}
