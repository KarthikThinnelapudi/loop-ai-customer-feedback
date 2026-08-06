import "dotenv/config";
import { sendWorkspaceInviteEmail } from "../lib/email";

async function testWorkspaceInvite() {
  console.log("==================================================");
  console.log("✉️ TESTING WORKSPACE INVITATION EMAIL DISPATCH");
  console.log("==================================================\n");

  const sender = process.env.EMAIL_FROM || "LOOP AI <team@customerloop.in>";
  const inviteeEmail = process.env.TEST_INVITEE_EMAIL || "team@customerloop.in";

  console.log("ENVIRONMENT EMAIL_FROM:", process.env.EMAIL_FROM);
  console.log("RESOLVED SENDER (From):", sender);
  console.log("DYNAMIC RECIPIENT (To):", inviteeEmail);

  const result = await sendWorkspaceInviteEmail({
    to: inviteeEmail,
    inviterName: "Acme Production Admin",
    workspaceName: "Acme Production",
    role: "ANALYST",
    inviteUrl: "https://customerloop.in/register?invite=test_invite_token_9988",
    expiresDays: 7,
  });

  console.log("\n==================================================");
  console.log("📩 DISPATCH RESULT LOGS:");
  console.log("==================================================");
  console.log(`• Provider: ${result.provider}`);
  console.log(`• Success Status: ${result.success}`);
  console.log(`• Resend Message ID: ${result.messageId || "N/A"}`);
  console.log(`• From: ${sender}`);
  console.log(`• To: ${inviteeEmail}`);
  console.log("==================================================\n");

  if (result.success && result.provider === "Resend API") {
    console.log(`✅ SUCCESS: Workspace Invitation sent via Resend API from verified domain sender "${sender}".`);
  } else {
    console.warn("⚠️ NOTICE: Workspace Invitation completed via fallback provider:", result);
  }
}

testWorkspaceInvite().catch(console.error);
