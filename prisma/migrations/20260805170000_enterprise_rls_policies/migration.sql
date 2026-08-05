-- ============================================================================
-- SUPABASE COMPLETE ENTERPRISE RLS POLICIES & INDEX OPTIMIZATION MIGRATION
-- 1. Drop redundant unused secondary indexes
-- 2. Preserve & create all Foreign Key covering indexes
-- 3. Enable RLS on all 13 tables
-- 4. Create explicit SELECT, INSERT, UPDATE, DELETE policies for service_role, authenticated, and anon
-- ============================================================================

-- Step 1: Drop Redundant / Unused Secondary Indexes
DROP INDEX IF EXISTS "Feedback_status_idx";
DROP INDEX IF EXISTS "Feedback_channel_idx";
DROP INDEX IF EXISTS "Feedback_deletedAt_idx";
DROP INDEX IF EXISTS "InvitationToken_email_idx";
DROP INDEX IF EXISTS "ShareLink_token_idx";

-- Step 2: Create / Verify Foreign Key Covering Indexes
CREATE INDEX IF NOT EXISTS "Feedback_authorId_idx" ON "Feedback"("authorId");
CREATE INDEX IF NOT EXISTS "Feedback_themeId_idx" ON "Feedback"("themeId");
CREATE INDEX IF NOT EXISTS "Report_authorId_idx" ON "Report"("authorId");
CREATE INDEX IF NOT EXISTS "ShareLink_reportId_idx" ON "ShareLink"("reportId");
CREATE INDEX IF NOT EXISTS "ShareLink_workspaceId_idx" ON "ShareLink"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- Step 3: Enable RLS on all 13 tables (12 application tables + _prisma_migrations)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvitationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedbackTheme" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShareLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Step 4: Clean Drop and Re-create RLS Policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 1. Account Policies
CREATE POLICY "account_service_role_all" ON "Account" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "account_auth_select" ON "Account" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
CREATE POLICY "account_auth_insert" ON "Account" FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid()::text);
CREATE POLICY "account_auth_delete" ON "Account" FOR DELETE TO authenticated USING ("userId" = auth.uid()::text);

-- 2. AuditLog Policies
CREATE POLICY "auditlog_service_role_all" ON "AuditLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auditlog_auth_select" ON "AuditLog" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "auditlog_auth_insert" ON "AuditLog" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);

-- 3. Feedback Policies
CREATE POLICY "feedback_service_role_all" ON "Feedback" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "feedback_auth_select" ON "Feedback" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "feedback_auth_insert" ON "Feedback" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "feedback_auth_update" ON "Feedback" FOR UPDATE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "feedback_auth_delete" ON "Feedback" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);

-- 4. FeedbackTheme Policies
CREATE POLICY "theme_service_role_all" ON "FeedbackTheme" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "theme_auth_select" ON "FeedbackTheme" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "theme_auth_insert" ON "FeedbackTheme" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "theme_auth_update" ON "FeedbackTheme" FOR UPDATE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "theme_auth_delete" ON "FeedbackTheme" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);

-- 5. InvitationToken Policies
CREATE POLICY "invitation_service_role_all" ON "InvitationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "invitation_auth_select" ON "InvitationToken" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "invitation_auth_insert" ON "InvitationToken" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "invitation_auth_delete" ON "InvitationToken" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);

-- 6. Report Policies
CREATE POLICY "report_service_role_all" ON "Report" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "report_auth_select" ON "Report" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "report_auth_insert" ON "Report" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "report_auth_update" ON "Report" FOR UPDATE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "report_auth_delete" ON "Report" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);

-- 7. Session Policies
CREATE POLICY "session_service_role_all" ON "Session" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "session_auth_select" ON "Session" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
CREATE POLICY "session_auth_delete" ON "Session" FOR DELETE TO authenticated USING ("userId" = auth.uid()::text);

-- 8. ShareLink Policies
CREATE POLICY "sharelink_service_role_all" ON "ShareLink" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sharelink_auth_select" ON "ShareLink" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "sharelink_auth_insert" ON "ShareLink" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "sharelink_auth_update" ON "ShareLink" FOR UPDATE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "sharelink_auth_delete" ON "ShareLink" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "sharelink_anon_select" ON "ShareLink" FOR SELECT TO anon USING (
  revoked = false AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
);

-- 9. User Policies
CREATE POLICY "user_service_role_all" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_auth_select_self" ON "User" FOR SELECT TO authenticated USING (id = auth.uid()::text);
CREATE POLICY "user_auth_update_self" ON "User" FOR UPDATE TO authenticated USING (id = auth.uid()::text);

-- 10. VerificationToken Policies
CREATE POLICY "verification_service_role_all" ON "VerificationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. Workspace Policies
CREATE POLICY "workspace_service_role_all" ON "Workspace" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "workspace_auth_select" ON "Workspace" FOR SELECT TO authenticated USING (
  id IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "workspace_auth_update" ON "Workspace" FOR UPDATE TO authenticated USING (
  id IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text AND role IN ('OWNER', 'ADMIN'))
);

-- 12. WorkspaceMember Policies
CREATE POLICY "member_service_role_all" ON "WorkspaceMember" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "member_auth_select" ON "WorkspaceMember" FOR SELECT TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
);
CREATE POLICY "member_auth_insert" ON "WorkspaceMember" FOR INSERT TO authenticated WITH CHECK (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text AND role IN ('OWNER', 'ADMIN'))
);
CREATE POLICY "member_auth_delete" ON "WorkspaceMember" FOR DELETE TO authenticated USING (
  "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text AND role IN ('OWNER', 'ADMIN'))
);

-- 13. _prisma_migrations Policy
CREATE POLICY "prisma_migrations_service_role_all" ON "_prisma_migrations" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Revoke Public Privileges on Sensitive Tables
REVOKE ALL ON TABLE "User" FROM anon, public;
REVOKE ALL ON TABLE "Account" FROM anon, public;
REVOKE ALL ON TABLE "Session" FROM anon, public;
REVOKE ALL ON TABLE "VerificationToken" FROM anon, public;
REVOKE ALL ON TABLE "InvitationToken" FROM anon, public;
