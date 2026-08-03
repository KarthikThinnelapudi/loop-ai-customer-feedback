import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const csvRowSchema = z.object({
  content: z.string().min(5, "Feedback quote must be at least 5 characters"),
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

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const existing = await db.feedback.findFirst({
          where: {
            workspaceId,
            content: item.content,
            deletedAt: null,
          },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        let sentimentScore = 0.0;
        let sentimentLabel = "NEUTRAL";
        const lower = item.content.toLowerCase();
        if (lower.includes("great") || lower.includes("love") || lower.includes("fast") || lower.includes("awesome") || lower.includes("smooth")) {
          sentimentScore = 0.85;
          sentimentLabel = "POSITIVE";
        } else if (lower.includes("error") || lower.includes("bug") || lower.includes("slow") || lower.includes("latency") || lower.includes("fail")) {
          sentimentScore = -0.75;
          sentimentLabel = "NEGATIVE";
        }

        await db.feedback.create({
          data: {
            workspaceId,
            authorId: currentUser.id,
            content: item.content,
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
          },
        });
        importedCount++;
      } catch (rowErr) {
        console.error("Row Ingestion Error:", rowErr);
        failedCount++;
      }
    }

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "FEEDBACK_CSV_IMPORTED",
        entityType: "Feedback",
        details: `Imported ${importedCount} items (${duplicateCount} duplicates skipped, ${failedCount} failed)`,
      },
    });

    return NextResponse.json({
      message: `CSV import completed successfully.`,
      importedCount,
      duplicateCount,
      failedCount,
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
