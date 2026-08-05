import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

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
      return NextResponse.json({ message: "Invalid verification token." }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ message: "Verification token has expired." }, { status: 400 });
    }

    const email = verificationToken.identifier;

    // Activate user account
    await db.$transaction([
      db.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      }),
      db.verificationToken.deleteMany({
        where: { token },
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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
