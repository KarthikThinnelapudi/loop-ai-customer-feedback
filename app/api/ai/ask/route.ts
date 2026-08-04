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
} from "@/lib/rag";

const askSchema = z.object({
  prompt: z.string().min(2, "Prompt must be at least 2 characters"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let workspaceId = "ws_acme_prod_9921";

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    const body = await req.json();
    const { prompt } = askSchema.parse(body);

    const intent = detectIntent(prompt);

    // Fetch workspace feedback items
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
      console.warn("DB feedback fetch fallback:", dbErr);
    }

    // Fallback seed feedback for initial or empty state
    if (dbItems.length === 0) {
      dbItems = [
        {
          id: "fb-101",
          content: "Onboarding took forever — I couldn't figure out how to invite my team. The docs were outdated.",
          channel: "SUPPORT_TICKET",
          customerName: "Sarah Jenkins (Stripe)",
          sentimentScore: -0.8,
          sentimentLabel: "NEGATIVE",
        },
        {
          id: "fb-102",
          content: "The new dashboard is gorgeous and finally fast. Huge performance improvement!",
          channel: "APP_STORE_REVIEW",
          customerName: "David K. (Linear)",
          sentimentScore: 0.9,
          sentimentLabel: "POSITIVE",
        },
        {
          id: "fb-103",
          content: "Prospect wants SSO SAML integration before signing the enterprise tier.",
          channel: "SALES_CALL_NOTE",
          customerName: "Enterprise Account Rep",
          sentimentScore: 0.1,
          sentimentLabel: "NEUTRAL",
        },
        {
          id: "fb-104",
          content: "Experiencing intermittent timeout errors during CSV bulk ingestion. Needs immediate triage.",
          channel: "SUPPORT_TICKET",
          customerName: "Dev Lead (Vercel)",
          sentimentScore: -0.75,
          sentimentLabel: "NEGATIVE",
        },
      ];
    }

    // Process retrieval, ranking, deduplication, and grounded synthesis
    const rankedEvidence = retrieveAndRankEvidence(prompt, dbItems, 8);
    const result = generateGroundedAnswer(prompt, rankedEvidence, intent);

    return NextResponse.json({
      intent: result.intent,
      answer: result.answer,
      citations: result.citations,
      groundedScore: result.groundedScore,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Ask LOOP Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
