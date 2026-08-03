export type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "ANALYST" | "REVIEWER" | "VIEWER";

export type Permission =
  | "workspace:delete"
  | "workspace:billing"
  | "users:manage"
  | "users:invite"
  | "roles:manage"
  | "integrations:configure"
  | "feedback:manage"
  | "feedback:import"
  | "ai:configure"
  | "ai:analyze"
  | "reports:generate"
  | "feedback:review"
  | "read:all";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "workspace:delete",
    "workspace:billing",
    "users:manage",
    "users:invite",
    "roles:manage",
    "integrations:configure",
    "feedback:manage",
    "feedback:import",
    "ai:configure",
    "ai:analyze",
    "reports:generate",
    "feedback:review",
    "read:all",
  ],
  ADMIN: [
    "users:manage",
    "users:invite",
    "roles:manage",
    "integrations:configure",
    "feedback:manage",
    "feedback:import",
    "ai:configure",
    "ai:analyze",
    "reports:generate",
    "feedback:review",
    "read:all",
  ],
  MANAGER: [
    "feedback:manage",
    "feedback:review",
    "reports:generate",
    "read:all",
  ],
  ANALYST: [
    "feedback:import",
    "ai:analyze",
    "reports:generate",
    "read:all",
  ],
  MEMBER: [
    "feedback:manage",
    "read:all",
  ],
  REVIEWER: [
    "feedback:review",
    "read:all",
  ],
  VIEWER: [
    "read:all",
  ],
};

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase() as Role;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
