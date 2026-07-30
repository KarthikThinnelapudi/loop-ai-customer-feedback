import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const feedbackIngestSchema = z.object({
  content: z.string().min(5, "Feedback content must be at least 5 characters"),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"]).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");

    const session = await getServerSession(authOptions);
    let workspaceId = "ws_acme_prod_9921"; // default preview fallback

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    const where: Record<string, unknown> = { workspaceId };

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    if (channel && channel !== "ALL") {
      where.channel = channel;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const feedbackList = await db.feedback.findMany({
      where,
      include: {
        theme: { select: { title: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(feedbackList);
  } catch (error) {
    console.error("GET Feedback Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const workspaceId = currentUser?.memberships[0]?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 400 });
    }

    const body = await req.json();
    const data = feedbackIngestSchema.parse(body);

    // Simple Rule-based Sentiment Classifier fallback before LLM run
    let sentimentScore = 0.0;
    let sentimentLabel = "NEUTRAL";
    const lower = data.content.toLowerCase();
    if (lower.includes("great") || lower.includes("love") || lower.includes("fast") || lower.includes("awesome") || lower.includes("smooth")) {
      sentimentScore = 0.85;
      sentimentLabel = "POSITIVE";
    } else if (lower.includes("error") || lower.includes("bug") || lower.includes("slow") || lower.includes("latency") || lower.includes("fail")) {
      sentimentScore = -0.75;
      sentimentLabel = "NEGATIVE";
    }

    const newFeedback = await db.feedback.create({
      data: {
        workspaceId,
        authorId: currentUser.id,
        content: data.content,
        channel: data.channel || "SUPPORT_TICKET",
        sentimentScore,
        sentimentLabel,
        status: "NEW",
        customerName: data.customerName || session.user.name || "Customer",
        customerEmail: data.customerEmail || session.user.email,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to ingest feedback" }, { status: 500 });
  }
}

