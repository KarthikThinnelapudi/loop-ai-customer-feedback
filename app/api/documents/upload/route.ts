import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

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
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "csv:upload") && !hasPermission(role, "feedback:import")) {
      return NextResponse.json({ message: "Forbidden: Role cannot upload document files." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type || fileName.split(".").pop() || "unknown";

    const textContent = await file.text();

    // Chunk document text into ~500 character chunks for RAG indexing
    const chunkSize = 500;
    const rawChunks: string[] = [];
    for (let i = 0; i < textContent.length; i += chunkSize) {
      const chunkText = textContent.slice(i, i + chunkSize).trim();
      if (chunkText.length > 10) {
        rawChunks.push(chunkText);
      }
    }

    const docFile = await db.documentFile.create({
      data: {
        workspaceId,
        fileName,
        fileType,
        fileSize,
        chunkCount: rawChunks.length,
        chunks: {
          create: rawChunks.map((content, index) => ({
            chunkIndex: index,
            content,
            metadata: { fileName, fileSize },
          })),
        },
      },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "DOCUMENT_UPLOADED",
        entityType: "DocumentFile",
        entityId: docFile.id,
        details: `Uploaded document ${fileName} (${fileSize} bytes, ${rawChunks.length} chunks)`,
      },
    });

    return NextResponse.json(
      {
        message: "Document uploaded, parsed, and indexed into RAG memory successfully.",
        document: docFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document Upload Error:", error);
    return NextResponse.json({ message: "Failed to parse and upload document." }, { status: 500 });
  }
}
