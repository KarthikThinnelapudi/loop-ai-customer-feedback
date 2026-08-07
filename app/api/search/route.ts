import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export interface SearchResultItem {
  id: string;
  type: "FEEDBACK" | "THEME" | "REPORT" | "DOCUMENT" | "CHAT" | "USER";
  title: string;
  subtitle: string;
  targetUrl: string;
}

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
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const canViewThemes = hasPermission(role, "trends:view");
    const canViewUsers = hasPermission(role, "team:view") || hasPermission(role, "users:manage");
    const canViewReports = hasPermission(role, "reports:view");
    const canViewAskAI = hasPermission(role, "ask_ai:access");

    const [feedbacks, themes, reports, documents, chats, users] = await Promise.all([
      db.feedback.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { content: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      canViewThemes
        ? db.feedbackTheme.findMany({
            where: {
              workspaceId,
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 5,
          })
        : [],
      canViewReports
        ? db.report.findMany({
            where: {
              workspaceId,
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { summary: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 5,
          })
        : [],
      db.documentFile.findMany({
        where: {
          workspaceId,
          fileName: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
      canViewAskAI
        ? db.chatSession.findMany({
            where: {
              workspaceId,
              userId: currentUser.id,
              title: { contains: query, mode: "insensitive" },
            },
            take: 5,
          })
        : [],
      canViewUsers
        ? db.user.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 5,
          })
        : [],
    ]);

    const results: SearchResultItem[] = [];

    feedbacks.forEach((f) => {
      results.push({
        id: `fb-${f.id}`,
        type: "FEEDBACK",
        title: f.customerName || f.company || "Feedback Quote",
        subtitle: `"${f.content.substring(0, 70)}..." (${f.channel})`,
        targetUrl: `/feedback?search=${encodeURIComponent(query)}`,
      });
    });

    themes.forEach((t) => {
      results.push({
        id: `theme-${t.id}`,
        type: "THEME",
        title: t.title,
        subtitle: t.description || "AI Feedback Theme Cluster",
        targetUrl: `/trends?theme=${encodeURIComponent(t.title)}`,
      });
    });

    reports.forEach((r) => {
      results.push({
        id: `report-${r.id}`,
        type: "REPORT",
        title: r.title,
        subtitle: `${r.totalItems} items analyzed — VoC Executive Digest`,
        targetUrl: `/reports`,
      });
    });

    documents.forEach((d) => {
      results.push({
        id: `doc-${d.id}`,
        type: "DOCUMENT",
        title: d.fileName,
        subtitle: `RAG Indexed Document (${d.chunkCount} chunks)`,
        targetUrl: `/ask`,
      });
    });

    chats.forEach((c) => {
      results.push({
        id: `chat-${c.id}`,
        type: "CHAT",
        title: c.title,
        subtitle: `Ask LOOP Thread (${c.model})`,
        targetUrl: `/ask`,
      });
    });

    users.forEach((u) => {
      results.push({
        id: `user-${u.id}`,
        type: "USER",
        title: u.name || u.email,
        subtitle: u.email,
        targetUrl: `/settings/team`,
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Global Search API Error:", error);
    return NextResponse.json({ message: "Search error" }, { status: 500 });
  }
}
