import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const verifyEmailSchema = z.object({
  token: z.string().optional(),
  otp: z.string().optional(),
  email: z.string().optional(),
});

export async function POST(req: Request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { token, otp, email } = verifyEmailSchema.parse(body);

    let verificationToken = null;

    if (otp && email) {
      const normalizedEmail = email.trim().toLowerCase();
      verificationToken = await db.verificationToken.findFirst({
        where: {
          identifier: normalizedEmail,
          token: otp.trim(),
        },
      });
    } else if (token) {
      verificationToken = await db.verificationToken.findFirst({
        where: { token: token.trim() },
      });
    }

    if (!verificationToken) {
      return NextResponse.json(
        { message: "Invalid verification OTP code or token. Please check your email or resend code." },
        { status: 400, headers }
      );
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Verification OTP code has expired. Please request a new code." },
        { status: 400, headers }
      );
    }

    const targetEmail = verificationToken.identifier;

    // Activate user account & delete single-use tokens atomically
    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email: targetEmail },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier: targetEmail },
      });

      return user;
    });

    // Trigger Welcome Email on initial verification
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
      await sendWelcomeEmail({
        to: targetEmail,
        name: updatedUser.name || "Customer",
        dashboardUrl: `${baseUrl}/dashboard`,
      });
    } catch (emailErr) {
      console.warn("Welcome email dispatch warning:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Email verified successfully! Welcome to LOOP AI.",
        isVerified: true,
        email: targetEmail,
      },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400, headers });
    }
    console.error("Email Verification Error:", error);
    return NextResponse.json(
      { message: "Internal server error during email verification." },
      { status: 500, headers }
    );
  }
}
