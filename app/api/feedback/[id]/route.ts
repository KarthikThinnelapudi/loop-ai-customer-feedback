import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const updateFeedbackSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  company: z.string().optional(),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"]).optional(),
  source: z.string().optional(),
  rating: z.number().optional(),
  content: z.string().min(5).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED", "ARCHIVED"]).optional(),
  product: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const workspaceId = currentUser?.memberships[0]?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId },
      include: {
        theme: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    if (!feedback) {
      return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("GET Feedback Item Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateFeedbackSchema.parse(body);

    const existing = await db.feedback.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
    }

    let sentimentScore = existing.sentimentScore;
    let sentimentLabel = existing.sentimentLabel;

    // Recompute AI sentiment if text content changed
    if (data.content && data.content !== existing.content) {
      const lower = data.content.toLowerCase();
      if (lower.includes("great") || lower.includes("love") || lower.includes("fast") || lower.includes("awesome") || lower.includes("smooth")) {
        sentimentScore = 0.88;
        sentimentLabel = "POSITIVE";
      } else if (lower.includes("error") || lower.includes("bug") || lower.includes("slow") || lower.includes("latency") || lower.includes("fail")) {
        sentimentScore = -0.80;
        sentimentLabel = "NEGATIVE";
      } else {
        sentimentScore = 0.10;
        sentimentLabel = "NEUTRAL";
      }
    }

    const updated = await db.feedback.update({
      where: { id },
      data: {
        ...data,
        sentimentScore,
        sentimentLabel,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser?.id,
        action: "FEEDBACK_UPDATED",
        entityType: "Feedback",
        entityId: id,
        details: `Updated feedback item #${id} (${role})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("PATCH Feedback Error:", error);
    return NextResponse.json({ message: "Failed to update feedback record" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "feedback:manage")) {
      return NextResponse.json(
        { message: "Forbidden: Delete requires Owner, Admin, or Manager permission" },
        { status: 403 }
      );
    }

    await db.feedback.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser?.id,
        action: "FEEDBACK_DELETED",
        entityType: "Feedback",
        entityId: id,
        details: `Soft deleted feedback item #${id}`,
      },
    });

    return NextResponse.json({ message: "Feedback record soft-deleted successfully." });
  } catch (error) {
    console.error("DELETE Feedback Error:", error);
    return NextResponse.json({ message: "Failed to delete feedback record" }, { status: 500 });
  }
}
