import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { IS_DEMO_MODE } from "@/lib/config";
import { hasPermission } from "@/lib/rbac";


const feedbackIngestSchema = z.object({
  content: z.string().min(5, "Feedback content must be at least 5 characters"),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"]).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED", "ARCHIVED"]).optional(),
  product: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const showDeleted = searchParams.get("deleted") === "true";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

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
            customerName: "Sarah Jenkins",
            company: "Stripe",
            rating: 2,
            category: "UX",
            priority: "HIGH",
            status: "NEW",
            sentimentLabel: "NEGATIVE",
            sentimentScore: -0.85,
            createdAt: new Date().toISOString(),
          },
          {
            id: "fb-102",
            content: "The new dashboard is gorgeous and finally fast. Huge improvement!",
            channel: "APP_STORE_REVIEW",
            customerName: "David K.",
            company: "Linear",
            rating: 5,
            category: "Performance",
            priority: "LOW",
            status: "REVIEWED",
            sentimentLabel: "POSITIVE",
            sentimentScore: 0.92,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        pagination: { page: 1, limit, total: 2, totalPages: 1 },
        mode: "DEMO",
      });
    }

    const where: Record<string, unknown> = { workspaceId };
    where.deletedAt = showDeleted ? { not: null } : null;

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }
    if (channel && channel !== "ALL") where.channel = channel;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (category && category !== "ALL") where.category = category;

    const orderBy: Record<string, string>[] = [];
    if (sort === "oldest") orderBy.push({ createdAt: "asc" });
    else if (sort === "highest_rating") orderBy.push({ rating: "desc" });
    else if (sort === "lowest_rating") orderBy.push({ rating: "asc" });
    else orderBy.push({ createdAt: "desc" });

    const skip = (page - 1) * limit;

    const [feedbackList, total] = await Promise.all([
      db.feedback.findMany({
        where,
        include: {
          theme: { select: { title: true, color: true } },
        },
        orderBy,
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

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userMembership = currentUser.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;


    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 400 });
    }

    if (!hasPermission(role, "feedback:create")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer and restricted roles cannot create feedback records." },
        { status: 403 }
      );
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
        company: data.company,
        rating: data.rating || 5,
        category: data.category || "General",
        priority: data.priority || "MEDIUM",
        product: data.product || "Core Platform",
        source: data.source || "Web Portal",
        tags: data.tags || [],
        sentimentScore,
        sentimentLabel,
        status: data.status || "NEW",
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
        details: `Created new feedback record from ${newFeedback.channel}`,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create feedback record" }, { status: 500 });
  }
}
