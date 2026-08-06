import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendFeedbackRequestEmail } from "@/lib/email";

const surveyRequestSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email("Invalid customer email address"),
  category: z.string().optional().default("recent experience"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = surveyRequestSchema.parse(body);
    const normalizedEmail = data.customerEmail.trim().toLowerCase();

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const surveyUrl = `${baseUrl}/feedback?email=${encodeURIComponent(normalizedEmail)}`;

    // Dispatch Feedback Survey Request Email via Resend API & team@customerloop.in
    const emailResult = await sendFeedbackRequestEmail({
      to: normalizedEmail,
      name: data.customerName,
      surveyUrl,
      category: data.category,
    });

    return NextResponse.json(
      {
        message: "Feedback survey request email sent successfully.",
        recipient: normalizedEmail,
        provider: emailResult.provider,
        messageId: emailResult.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Survey Request API Error:", error);
    return NextResponse.json({ message: "Failed to send survey request email." }, { status: 500 });
  }
}
