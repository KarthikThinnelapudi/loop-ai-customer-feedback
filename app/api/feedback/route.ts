import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { IS_DEMO_MODE } from "@/lib/config";

const feedbackIngestSchema = z.object({
  content: z.string().min(5, "Feedback content must be at least 5 characters"),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"]).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
});

const feedbackUpdateSchema = z.object({
  id: z.string().min(1, "Feedback ID required"),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  sentimentScore: z.number().optional(),
  sentimentLabel: z.string().optional(),
  isRestore: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const showDeleted = searchParams.get("deleted") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const session = await getServerSession(authOptions);
    let workspaceId = "ws_acme_prod_9921"; // preview fallback

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    if (IS_DEMO_MODE) {
      return NextResponse.json({
        data: [
          {
            id: "fb-101",
            content: "Onboarding took forever — I couldn't figure out how to invite my team.",
            channel: "SUPPORT_TICKET",
            customerName: "Sarah Jenkins (Stripe)",
            sentimentLabel: "NEGATIVE",
            sentimentScore: -0.85,
            status: "NEW",
            createdAt: new Date().toISOString(),
          },
          {
            id: "fb-102",
            content: "The new dashboard is gorgeous and finally fast. Huge improvement!",
            channel: "APP_STORE_REVIEW",
            customerName: "David K. (Linear)",
            sentimentLabel: "POSITIVE",
            sentimentScore: 0.92,
            status: "REVIEWED",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        mode: "DEMO",
      });
    }

    const where: Record<string, unknown> = { workspaceId };
    where.deletedAt = showDeleted ? { not: null } : null;

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    if (channel && channel !== "ALL") {
      where.channel = channel;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [feedbackList, total] = await Promise.all([
      db.feedback.findMany({
        where,
        include: {
          theme: { select: { title: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.feedback.count({ where }),
    ]);

    return NextResponse.json({
      data: feedbackList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      mode: "PRODUCTION",
    });
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

    // Create Audit Log
    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "FEEDBACK_CREATED",
        entityType: "Feedback",
        entityId: newFeedback.id,
        details: `Ingested new feedback from ${newFeedback.channel}`,
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

export async function PATCH(req: Request) {
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
    if (!userMembership) {
      return NextResponse.json({ message: "Workspace required" }, { status: 400 });
    }

    const body = await req.json();
    const data = feedbackUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.sentimentScore !== undefined) updateData.sentimentScore = data.sentimentScore;
    if (data.sentimentLabel) updateData.sentimentLabel = data.sentimentLabel;
    if (data.isRestore) updateData.deletedAt = null;

    const updatedFeedback = await db.feedback.update({
      where: { id: data.id },
      data: updateData,
    });

    // Audit log entry
    await db.auditLog.create({
      data: {
        workspaceId: userMembership.workspaceId,
        userId: currentUser.id,
        action: data.isRestore ? "FEEDBACK_RESTORED" : "FEEDBACK_UPDATED",
        entityType: "Feedback",
        entityId: updatedFeedback.id,
        details: `Updated feedback status to ${updatedFeedback.status}`,
      },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update feedback" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ message: "Feedback ID required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    if (!userMembership || (userMembership.role !== "ADMIN" && userMembership.role !== "MANAGER")) {
      return NextResponse.json({ message: "Only Admin or Manager can delete feedback." }, { status: 403 });
    }

    if (permanent) {
      await db.feedback.delete({ where: { id } });
    } else {
      // Soft Delete
      await db.feedback.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    await db.auditLog.create({
      data: {
        workspaceId: userMembership.workspaceId,
        userId: currentUser.id,
        action: permanent ? "FEEDBACK_PERMANENT_DELETED" : "FEEDBACK_SOFT_DELETED",
        entityType: "Feedback",
        entityId: id,
        details: permanent ? "Permanently deleted feedback item" : "Soft deleted feedback item",
      },
    });

    return NextResponse.json({ message: permanent ? "Feedback permanently deleted." : "Feedback moved to trash." });
  } catch (error) {
    console.error("DELETE Feedback Error:", error);
    return NextResponse.json({ message: "Failed to delete feedback" }, { status: 500 });
  }
}
