export type Role =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ANALYST"
  | "ANALYST_ASSISTANT"
  | "REVIEWER"
  | "VIEWER"
  | "MEMBER";

export type Permission =
  | "dashboard:view"
  | "feedback:view"
  | "feedback:create"
  | "feedback:edit"
  | "feedback:edit_own"
  | "feedback:delete"
  | "feedback:status"
  | "feedback:assign"
  | "csv:upload"
  | "feedback:import"
  | "ai:analyze"
  | "analytics:view"
  | "trends:view"
  | "ask_ai:access"
  | "reports:generate"
  | "reports:view"
  | "reports:download_pdf"
  | "csv:export"
  | "reports:share"
  | "team:view"
  | "users:invite"
  | "users:manage"
  | "audit:view"
  | "workspace:settings"
  | "workspace:delete"
  | "read:all";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "dashboard:view",
    "feedback:view",
    "feedback:create",
    "feedback:edit",
    "feedback:delete",
    "feedback:status",
    "feedback:assign",
    "csv:upload",
    "feedback:import",
    "ai:analyze",
    "analytics:view",
    "trends:view",
    "ask_ai:access",
    "reports:generate",
    "reports:view",
    "reports:download_pdf",
    "csv:export",
    "reports:share",
    "team:view",
    "users:invite",
    "users:manage",
    "audit:view",
    "workspace:settings",
    "workspace:delete",
    "read:all",
  ],
  ADMIN: [
    "dashboard:view",
    "feedback:view",
    "feedback:create",
    "feedback:edit",
    "feedback:delete",
    "feedback:status",
    "feedback:assign",
    "csv:upload",
    "feedback:import",
    "ai:analyze",
    "analytics:view",
    "trends:view",
    "ask_ai:access",
    "reports:generate",
    "reports:view",
    "reports:download_pdf",
    "csv:export",
    "reports:share",
    "team:view",
    "users:invite",
    "users:manage",
    "audit:view",
    "workspace:settings",
    "read:all",
  ],
  MANAGER: [
    "dashboard:view",
    "feedback:view",
    "feedback:create",
    "feedback:edit",
    "feedback:delete",
    "feedback:status",
    "feedback:assign",
    "csv:upload",
    "feedback:import",
    "ai:analyze",
    "analytics:view",
    "trends:view",
    "ask_ai:access",
    "reports:generate",
    "reports:view",
    "reports:download_pdf",
    "csv:export",
    "reports:share",
    "team:view",
    "audit:view",
    "read:all",
  ],
  ANALYST: [
    "dashboard:view",
    "feedback:view",
    "feedback:create",
    "feedback:edit",
    "feedback:status",
    "feedback:assign",
    "csv:upload",
    "feedback:import",
    "ai:analyze",
    "analytics:view",
    "trends:view",
    "ask_ai:access",
    "reports:generate",
    "reports:view",
    "reports:download_pdf",
    "csv:export",
    "reports:share",
    "read:all",
  ],
  ANALYST_ASSISTANT: [
    "dashboard:view",
    "feedback:view",
    "csv:upload",
    "feedback:import",
    "ai:analyze",
    "ask_ai:access",
    "reports:view",
    "reports:download_pdf",
    "read:all",
  ],
  REVIEWER: [
    "dashboard:view",
    "feedback:view",
    "feedback:status",
    "reports:view",
    "reports:download_pdf",
  ],
  VIEWER: [
    "dashboard:view",
    "feedback:view",
  ],
  MEMBER: [
    "dashboard:view",
    "feedback:view",
    "feedback:edit_own",
    "reports:view",
    "reports:download_pdf",
  ],
};

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase() as Role;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
