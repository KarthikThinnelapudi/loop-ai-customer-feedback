import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  detectIntent,
  retrieveAndRankEvidence,
  generateGroundedAnswer,
  FeedbackItem,
  ChatMessage,
} from "@/lib/rag";

const askSchema = z.object({
  prompt: z.string().min(2, "Prompt must be at least 2 characters"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let workspaceId: string | null = null;

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ message: "Unauthorized or missing workspace context" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, history } = askSchema.parse(body);

    const intent = detectIntent(prompt);

    // Fetch ONLY current workspace feedback items
    let dbItems: FeedbackItem[] = [];
    try {
      const rawFeedback = await db.feedback.findMany({
        where: {
          workspaceId,
          deletedAt: null,
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      });

      dbItems = rawFeedback.map((f) => ({
        id: f.id,
        content: f.content,
        channel: f.channel,
        company: f.company,
        category: f.category,
        rating: f.rating,
        priority: f.priority,
        sentimentScore: f.sentimentScore,
        sentimentLabel: f.sentimentLabel,
        customerName: f.customerName,
        customerEmail: f.customerEmail,
        createdAt: f.createdAt,
      }));
    } catch (dbErr) {
      console.warn("DB feedback fetch error:", dbErr);
    }

    // Process retrieval, ranking, deduplication, and grounded synthesis for current workspace
    const { ranked, metrics: retMetrics } = retrieveAndRankEvidence(prompt, dbItems, 8);
    const result = generateGroundedAnswer(
      prompt,
      ranked,
      intent,
      retMetrics,
      workspaceId,
      history as ChatMessage[]
    );

    return NextResponse.json({
      intent: result.intent,
      answer: result.answer,
      citations: result.citations,
      groundedScore: result.groundedScore,
      metrics: result.metrics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Ask LOOP Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
