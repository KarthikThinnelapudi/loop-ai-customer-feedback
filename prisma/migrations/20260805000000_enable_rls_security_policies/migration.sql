-- ============================================================================
-- SUPABASE ENTERPRISE SECURITY REMEDIATION MIGRATION
-- 1. Enable Row Level Security (RLS) on all application tables
-- 2. Grant service_role full access policies for serverless backend / Prisma
-- 3. Create authenticated user multi-tenant isolation policies
-- 4. Create public share link read policy
-- 5. Revoke public/anon select privileges on sensitive tables
-- 6. Add covering indexes for all unindexed foreign keys
-- ============================================================================

-- Step 1: Create covering indexes for all Foreign Keys
CREATE INDEX IF NOT EXISTS "Feedback_authorId_idx" ON "Feedback"("authorId");
CREATE INDEX IF NOT EXISTS "Feedback_themeId_idx" ON "Feedback"("themeId");
CREATE INDEX IF NOT EXISTS "Report_authorId_idx" ON "Report"("authorId");
CREATE INDEX IF NOT EXISTS "ShareLink_reportId_idx" ON "ShareLink"("reportId");

-- Step 2: Enable Row Level Security (RLS) on all 12 application tables
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

-- Step 3: Create Service Role Full Privilege Policies (for Prisma & API handlers)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_User') THEN
    CREATE POLICY "service_role_all_User" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_Workspace') THEN
    CREATE POLICY "service_role_all_Workspace" ON "Workspace" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_WorkspaceMember') THEN
    CREATE POLICY "service_role_all_WorkspaceMember" ON "WorkspaceMember" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_InvitationToken') THEN
    CREATE POLICY "service_role_all_InvitationToken" ON "InvitationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_FeedbackTheme') THEN
    CREATE POLICY "service_role_all_FeedbackTheme" ON "FeedbackTheme" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_Feedback') THEN
    CREATE POLICY "service_role_all_Feedback" ON "Feedback" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_Report') THEN
    CREATE POLICY "service_role_all_Report" ON "Report" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_ShareLink') THEN
    CREATE POLICY "service_role_all_ShareLink" ON "ShareLink" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_AuditLog') THEN
    CREATE POLICY "service_role_all_AuditLog" ON "AuditLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_Session') THEN
    CREATE POLICY "service_role_all_Session" ON "Session" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_Account') THEN
    CREATE POLICY "service_role_all_Account" ON "Account" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_VerificationToken') THEN
    CREATE POLICY "service_role_all_VerificationToken" ON "VerificationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Step 4: Create Authenticated User Multi-Tenant Isolation Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_user_read_self') THEN
    CREATE POLICY "auth_user_read_self" ON "User" FOR SELECT TO authenticated USING (id = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_feedback_tenant_isolation') THEN
    CREATE POLICY "auth_feedback_tenant_isolation" ON "Feedback" FOR ALL TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_report_tenant_isolation') THEN
    CREATE POLICY "auth_report_tenant_isolation" ON "Report" FOR ALL TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_share_link_tenant_isolation') THEN
    CREATE POLICY "auth_share_link_tenant_isolation" ON "ShareLink" FOR ALL TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_read_valid_share_links') THEN
    CREATE POLICY "anon_read_valid_share_links" ON "ShareLink" FOR SELECT TO anon USING (
      revoked = false AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    );
  END IF;
END $$;

-- Step 5: Revoke Public SELECT Privileges from Sensitive Tables (Fixes Sensitive Columns Exposed warning)
REVOKE ALL ON TABLE "User" FROM anon, public;
REVOKE ALL ON TABLE "Account" FROM anon, public;
REVOKE ALL ON TABLE "Session" FROM anon, public;
REVOKE ALL ON TABLE "VerificationToken" FROM anon, public;
REVOKE ALL ON TABLE "InvitationToken" FROM anon, public;
