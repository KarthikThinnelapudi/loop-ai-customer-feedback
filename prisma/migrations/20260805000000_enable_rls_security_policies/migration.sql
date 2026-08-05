-- ============================================================================
-- SUPABASE COMPLETE PRODUCTION SECURITY REMEDIATION MIGRATION
-- 1. Ensure Primary Key constraint on VerificationToken (identifier, token)
-- 2. Foreign Key Covering Indexes on all reference columns
-- 3. Enable Row Level Security (RLS) on all 12 application tables
-- 4. Granular SELECT, INSERT, UPDATE, DELETE policies for service_role & authenticated
-- 5. Strict public/anon privilege revocation on sensitive models
-- ============================================================================

-- Step 1: VerificationToken Composite Primary Key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'VerificationToken' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token");
  END IF;
END $$;

-- Step 2: Create Covering Foreign Key Indexes
CREATE INDEX IF NOT EXISTS "Feedback_authorId_idx" ON "Feedback"("authorId");
CREATE INDEX IF NOT EXISTS "Feedback_themeId_idx" ON "Feedback"("themeId");
CREATE INDEX IF NOT EXISTS "Report_authorId_idx" ON "Report"("authorId");
CREATE INDEX IF NOT EXISTS "ShareLink_reportId_idx" ON "ShareLink"("reportId");
CREATE INDEX IF NOT EXISTS "ShareLink_workspaceId_idx" ON "ShareLink"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- Step 3: Enable Row Level Security (RLS) on all 12 application tables
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

-- Step 4: Service Role Administrative Policies (For Serverless & Prisma handlers)
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

-- Step 5: Authenticated User Least-Privilege Multi-Tenant Policies
DO $$
BEGIN
  -- User Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_user_select_self') THEN
    CREATE POLICY "auth_user_select_self" ON "User" FOR SELECT TO authenticated USING (id = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_user_update_self') THEN
    CREATE POLICY "auth_user_update_self" ON "User" FOR UPDATE TO authenticated USING (id = auth.uid()::text);
  END IF;

  -- Workspace Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_workspace_select_member') THEN
    CREATE POLICY "auth_workspace_select_member" ON "Workspace" FOR SELECT TO authenticated USING (
      id IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;

  -- WorkspaceMember Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_member_select_co_members') THEN
    CREATE POLICY "auth_member_select_co_members" ON "WorkspaceMember" FOR SELECT TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;

  -- Feedback Multi-Tenant Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_feedback_select') THEN
    CREATE POLICY "auth_feedback_select" ON "Feedback" FOR SELECT TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_feedback_insert') THEN
    CREATE POLICY "auth_feedback_insert" ON "Feedback" FOR INSERT TO authenticated WITH CHECK (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_feedback_update') THEN
    CREATE POLICY "auth_feedback_update" ON "Feedback" FOR UPDATE TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_feedback_delete') THEN
    CREATE POLICY "auth_feedback_delete" ON "Feedback" FOR DELETE TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;

  -- Report Multi-Tenant Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_report_select') THEN
    CREATE POLICY "auth_report_select" ON "Report" FOR SELECT TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_report_insert') THEN
    CREATE POLICY "auth_report_insert" ON "Report" FOR INSERT TO authenticated WITH CHECK (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_report_update') THEN
    CREATE POLICY "auth_report_update" ON "Report" FOR UPDATE TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_report_delete') THEN
    CREATE POLICY "auth_report_delete" ON "Report" FOR DELETE TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;

  -- ShareLink Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_sharelink_select') THEN
    CREATE POLICY "auth_sharelink_select" ON "ShareLink" FOR SELECT TO authenticated USING (
      "workspaceId" IN (SELECT "workspaceId" FROM "WorkspaceMember" WHERE "userId" = auth.uid()::text)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_sharelink_select') THEN
    CREATE POLICY "anon_sharelink_select" ON "ShareLink" FOR SELECT TO anon USING (
      revoked = false AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    );
  END IF;
END $$;

-- Step 6: Revoke Public Access to Sensitive Auth & Session Tables
REVOKE ALL ON TABLE "User" FROM anon, public;
REVOKE ALL ON TABLE "Account" FROM anon, public;
REVOKE ALL ON TABLE "Session" FROM anon, public;
REVOKE ALL ON TABLE "VerificationToken" FROM anon, public;
REVOKE ALL ON TABLE "InvitationToken" FROM anon, public;
