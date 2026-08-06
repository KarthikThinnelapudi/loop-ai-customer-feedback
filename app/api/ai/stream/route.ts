import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { retrieveAndRankEvidence, generateGroundedAnswer } from "@/lib/rag";

const streamRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sessionId: z.string().optional(),
  model: z.string().optional().default("Auto"),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional().default([]),
});

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

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId || !currentUser) {
      return NextResponse.json({ message: "Workspace membership required" }, { status: 403 });
    }

    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json({ message: "Forbidden: Viewer role cannot access LOOP AI." }, { status: 403 });
    }

    const body = await req.json();
    const { prompt, sessionId, history } = streamRequestSchema.parse(body);

    // Fetch workspace feedback evidence
    const feedbackItems = await db.feedback.findMany({
      where: { workspaceId, deletedAt: null },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    const formattedItems = feedbackItems.map((f) => ({
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

    const { ranked, metrics: retrievalMetrics } = retrieveAndRankEvidence(prompt, formattedItems, 8);
    const ragResult = await generateGroundedAnswer(prompt, ranked, "SUMMARY", retrievalMetrics, workspaceId, history);

    // Record Gateway Observability Metrics in DB asynchronously
    try {
      await db.aiGatewayMetric.create({
        data: {
          workspaceId,
          userId: currentUser.id,
          provider: ragResult.metrics.provider || "Gemini",
          model: ragResult.metrics.model || "gemini-1.5-flash",
          promptTokens: Math.round((prompt.length + 100) / 4),
          completionTokens: Math.round(ragResult.answer.length / 4),
          latencyMs: ragResult.metrics.totalLatencyMs,
          costUsd: ragResult.metrics.estimatedCostUsd,
          fallbackOccurred: ragResult.metrics.provider !== "Gemini",
        },
      });

      await db.auditLog.create({
        data: {
          workspaceId,
          userId: currentUser.id,
          action: "AI_QUERY_STREAMED",
          entityType: "AIQuery",
          details: `Streamed query: "${prompt.substring(0, 50)}..." via ${ragResult.metrics.provider}`,
        },
      });

      // Save user & assistant messages to persistent session if sessionId provided
      if (sessionId) {
        await db.chatMessage.createMany({
          data: [
            { sessionId, role: "user", content: prompt },
            {
              sessionId,
              role: "assistant",
              content: ragResult.answer,
              citations: JSON.parse(JSON.stringify(ragResult.citations)),
              metrics: JSON.parse(JSON.stringify(ragResult.metrics)),
            },
          ],
        });

        await db.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
      }
    } catch (persistErr) {
      console.warn("AI Stream persistence warning:", persistErr);
    }

    // Return Server-Sent Events (SSE) ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata chunk
        const metaEvent = `data: ${JSON.stringify({
          type: "meta",
          citations: ragResult.citations,
          groundedScore: ragResult.groundedScore,
          intent: ragResult.intent,
          metrics: ragResult.metrics,
        })}\n\n`;
        controller.enqueue(encoder.encode(metaEvent));

        // Stream answer text in natural chunks
        const words = ragResult.answer.split(" ");
        for (let i = 0; i < words.length; i += 3) {
          const chunkText = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
          const tokenEvent = `data: ${JSON.stringify({ type: "token", text: chunkText })}\n\n`;
          controller.enqueue(encoder.encode(tokenEvent));
          await new Promise((r) => setTimeout(r, 15));
        }

        // Send completion event
        const doneEvent = `data: ${JSON.stringify({ type: "done" })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("AI Stream Error:", error);
    return NextResponse.json({ message: "Internal server error during streaming." }, { status: 500 });
  }
}
