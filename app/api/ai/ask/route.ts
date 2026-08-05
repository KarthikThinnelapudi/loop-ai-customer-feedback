import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
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
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { name?: string | null; email?: string | null; role?: string; workspaceId?: string };

    const currentUser = await db.user.findUnique({
      where: { email: sessionUser.email! },
      include: { memberships: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userMembership = currentUser.memberships[0];
    const role = userMembership?.role || sessionUser.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId || sessionUser.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace context required" }, { status: 401 });
    }

    // Strict RBAC Enforcement: Viewer cannot access AI
    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer role cannot access Ask LOOP AI." },
        { status: 403 }
      );
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

    // Log AI Audit Query
    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "AI_QUERY_EXECUTED",
        entityType: "AskLOOP",
        details: `Executed AI RAG query intent '${intent}' with ${ranked.length} cited evidence records.`,
      },
    });

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
