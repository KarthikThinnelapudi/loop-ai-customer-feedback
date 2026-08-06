import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = verifyEmailSchema.parse(body);

    const verificationToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ message: "Invalid or expired verification token." }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ message: "Verification token has expired. Please request a new link." }, { status: 400 });
    }

    const email = verificationToken.identifier;

    // Activate user account & delete single-use token atomically
    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier: email },
      });

      return user;
    });

    // Trigger Welcome Email on initial verification
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
      await sendWelcomeEmail({
        to: email,
        name: updatedUser.name || "Customer",
        dashboardUrl: `${baseUrl}/dashboard`,
      });
    } catch (emailErr) {
      console.warn("Welcome email dispatch warning:", emailErr);
    }

    return NextResponse.json(
      { message: "Email verified successfully! Welcome to CustomerLoop." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Email Verification Error:", error);
    return NextResponse.json({ message: "Internal server error during email verification." }, { status: 500 });
  }
}
