import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateBase32Secret, verifyTOTP, getOtpAuthUri } from "@/lib/totp";
import { z } from "zod";

const verifyMfaSchema = z.object({
  token: z.string().min(6, "MFA Code must be 6 digits"),
  secret: z.string().min(1, "Secret is required"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = generateBase32Secret(20);
    const otpauthUrl = getOtpAuthUri(session.user.email, "LOOP AI", secret);

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    return NextResponse.json({
      secret,
      otpauthUrl,
      backupCodes,
    });
  } catch (error) {
    console.error("GET MFA Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, secret } = verifyMfaSchema.parse(body);

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid MFA verification code." }, { status: 400 });
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await db.user.update({
      where: { email: session.user.email },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: backupCodes,
      },
    });

    return NextResponse.json({
      message: "Multi-Factor Authentication enabled successfully.",
      backupCodes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("POST MFA Error:", error);
    return NextResponse.json({ message: "Failed to enable MFA" }, { status: 500 });
  }
}
