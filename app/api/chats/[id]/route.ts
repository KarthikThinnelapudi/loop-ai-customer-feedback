import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const updateChatSchema = z.object({
  title: z.string().optional(),
  isPinned: z.boolean().optional(),
  isShared: z.boolean().optional(),
  model: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const chatSession = await db.chatSession.findFirst({
      where: { id, workspaceId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: "Chat session not found" }, { status: 404 });
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("GET Chat Session ID Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateChatSchema.parse(body);

    const updatedSession = await db.chatSession.updateMany({
      where: { id, workspaceId, userId: currentUser.id },
      data,
    });

    if (updatedSession.count === 0) {
      return NextResponse.json({ message: "Chat session not found or forbidden" }, { status: 404 });
    }

    const result = await db.chatSession.findUnique({ where: { id } });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("PATCH Chat Session Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "ask_ai:access")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const deleted = await db.chatSession.deleteMany({
      where: { id, workspaceId, userId: currentUser.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ message: "Chat session not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("DELETE Chat Session Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
