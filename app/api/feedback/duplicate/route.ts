import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const duplicateSchema = z.object({
  id: z.string().min(1, "Feedback ID is required"),
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
    if (!userMembership) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const workspaceId = userMembership.workspaceId;
    const body = await req.json();
    const { id } = duplicateSchema.parse(body);

    const original = await db.feedback.findFirst({
      where: { id, workspaceId },
    });

    if (!original) {
      return NextResponse.json({ message: "Feedback record not found" }, { status: 404 });
    }

    const clone = await db.feedback.create({
      data: {
        workspaceId,
        authorId: currentUser.id,
        content: `${original.content} (Copy)`,
        channel: original.channel,
        company: original.company,
        rating: original.rating,
        category: original.category,
        priority: original.priority,
        product: original.product,
        source: original.source,
        tags: original.tags,
        rationale: original.rationale,
        sentimentScore: original.sentimentScore,
        sentimentLabel: original.sentimentLabel,
        status: "NEW",
        customerName: original.customerName ? `${original.customerName} (Copy)` : "Customer",
        customerEmail: original.customerEmail,
        themeId: original.themeId,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "FEEDBACK_DUPLICATED",
        entityType: "Feedback",
        entityId: clone.id,
        details: `Duplicated feedback record #${original.id}`,
      },
    });

    return NextResponse.json(clone, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Duplicate Feedback Error:", error);
    return NextResponse.json({ message: "Failed to duplicate feedback record" }, { status: 500 });
  }
}
