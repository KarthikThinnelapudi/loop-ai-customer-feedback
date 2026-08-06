import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const createChatSchema = z.object({
  title: z.string().optional().default("New Conversation"),
  model: z.string().optional().default("Auto"),
});

export async function GET(req: Request) {
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
      return NextResponse.json({ message: "Forbidden: Role cannot access chat sessions." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      workspaceId,
      userId: currentUser.id,
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const chatSessions = await db.chatSession.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("GET Chat Sessions Error:", error);
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

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId || !currentUser) {
      return NextResponse.json({ message: "Workspace membership required" }, { status: 403 });
    }

    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json({ message: "Forbidden: Role cannot create chat sessions." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const data = createChatSchema.parse(body);

    const chatSession = await db.chatSession.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        title: data.title || "New Conversation",
        model: data.model || "Auto",
      },
    });

    return NextResponse.json(chatSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("POST Chat Session Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
