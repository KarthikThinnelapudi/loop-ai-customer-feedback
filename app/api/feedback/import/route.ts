import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const csvRowSchema = z.object({
  content: z.string().min(3, "Feedback quote must be at least 3 characters"),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"]).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  rating: z.number().optional(),
});

const bulkImportSchema = z.object({
  items: z.array(csvRowSchema).min(1, "At least one feedback row required"),
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

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userMembership = currentUser.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "feedback:import")) {
      return NextResponse.json(
        { message: "Forbidden: Only Owner, Admin, Manager, Analyst, or Analyst Assistant roles can import feedback." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { items } = bulkImportSchema.parse(body);

    // Fetch existing feedback contents to detect duplicates efficiently
    const existingFeedback = await db.feedback.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      select: { content: true },
    });

    const existingContentSet = new Set(existingFeedback.map((f) => f.content.trim().toLowerCase()));

    const newRowsToInsert: Array<{
      workspaceId: string;
      authorId: string;
      content: string;
      channel: "SUPPORT_TICKET" | "APP_STORE_REVIEW" | "NPS_SURVEY" | "SALES_CALL_NOTE" | "COMMUNITY_POST";
      company: string;
      category: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      rating: number;
      sentimentScore: number;
      sentimentLabel: string;
      status: "NEW";
      customerName: string;
      customerEmail: string;
    }> = [];

    let duplicateCount = 0;

    for (const item of items) {
      const trimmedContent = item.content.trim();
      const contentLower = trimmedContent.toLowerCase();

      if (existingContentSet.has(contentLower)) {
        duplicateCount++;
        continue;
      }

      existingContentSet.add(contentLower);

      let sentimentScore = 0.0;
      let sentimentLabel = "NEUTRAL";
      if (
        contentLower.includes("great") ||
        contentLower.includes("love") ||
        contentLower.includes("fast") ||
        contentLower.includes("awesome") ||
        contentLower.includes("smooth") ||
        contentLower.includes("excellent") ||
        contentLower.includes("happy")
      ) {
        sentimentScore = 0.85;
        sentimentLabel = "POSITIVE";
      } else if (
        contentLower.includes("error") ||
        contentLower.includes("bug") ||
        contentLower.includes("slow") ||
        contentLower.includes("latency") ||
        contentLower.includes("fail") ||
        contentLower.includes("broken") ||
        contentLower.includes("bad")
      ) {
        sentimentScore = -0.75;
        sentimentLabel = "NEGATIVE";
      }

      newRowsToInsert.push({
        workspaceId,
        authorId: currentUser.id,
        content: trimmedContent,
        channel: item.channel || "SUPPORT_TICKET",
        company: item.company || "Enterprise Account",
        category: item.category || "General",
        priority: item.priority || "MEDIUM",
        rating: item.rating || 5,
        sentimentScore,
        sentimentLabel,
        status: "NEW",
        customerName: item.customerName || "CSV Customer",
        customerEmail: item.customerEmail || "customer@external.com",
      });
    }

    // Chunked Batch Insert to prevent memory spikes
    const CHUNK_SIZE = 100;
    let importedCount = 0;

    for (let i = 0; i < newRowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = newRowsToInsert.slice(i, i + CHUNK_SIZE);
      await db.feedback.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      importedCount += chunk.length;
    }

    // Log Audit Event
    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "FEEDBACK_CSV_IMPORTED",
        entityType: "Feedback",
        details: `Batch imported ${importedCount} feedback records (${duplicateCount} duplicates skipped)`,
      },
    });

    return NextResponse.json({
      message: `CSV import completed successfully.`,
      importedCount,
      duplicateCount,
      totalProcessed: items.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("CSV Ingestion Error:", error);
    return NextResponse.json({ message: "Failed to process CSV import" }, { status: 500 });
  }
}
