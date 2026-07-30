import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const verifySchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(1, "Verification token is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token } = verifySchema.parse(body);

    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Activate user account
    await db.$transaction([
      db.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      }),
      db.verificationToken.delete({
        where: {
          token,
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Email verified successfully. You may now log in to your workspace." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Email Verification Error:", error);
    return NextResponse.json({ message: "Internal server error during verification." }, { status: 500 });
  }
}
