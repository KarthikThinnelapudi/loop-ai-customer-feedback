import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSupportAutoReplyEmail } from "@/lib/email";

const supportSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = supportSchema.parse(body);

    const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`;
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    // Dispatch Support Request Auto-Reply Email via Resend API & team@customerloop.in
    const emailResult = await sendSupportAutoReplyEmail({
      to: normalizedEmail,
      name: validatedData.name,
      ticketId,
      subject: validatedData.subject,
      expectedResponseTime: "within 4 business hours",
    });

    return NextResponse.json(
      {
        message: "Support request received. Auto-reply confirmation dispatched.",
        ticketId,
        provider: emailResult.provider,
        messageId: emailResult.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Support API Error:", error);
    return NextResponse.json({ message: "Failed to process support request." }, { status: 500 });
  }
}
