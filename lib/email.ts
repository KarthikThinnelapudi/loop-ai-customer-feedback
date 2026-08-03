interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const isProd = process.env.NODE_ENV === "production";
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`✉️ Sending Email to: ${to} | Subject: "${subject}"`);

  // 1. Resend API Integration (Native Fetch)
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "LOOP AI <onboarding@resend.dev>",

          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });

      if (res.ok) {
        console.log(`✅ Email sent via Resend API to ${to}`);
        return { success: true, provider: "Resend API" };
      }
    } catch (err) {
      console.error("❌ Resend API Error:", err);
    }
  }

  // 2. Development / Console Fallback
  console.log(`--------------------------------------------------`);
  console.log(`✉️ EMAIL DISPATCH DISPATCHED (${isProd ? "PRODUCTION" : "DEVELOPMENT"})`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`HTML PAYLOAD LENGTH: ${html.length} chars`);
  console.log(`--------------------------------------------------`);
  return { success: true, provider: "Console Logger" };
}

/* Email HTML Template Generators */

export function getVerificationEmailTemplate(name: string, verifyUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h2 style="color: #10b981;">Verify your LOOP AI Account</h2>
      <p>Hi ${name || "there"},</p>
      <p>Welcome to LOOP AI Customer Feedback Intelligence. Please click the button below to verify your email address and activate your account:</p>
      <a href="${verifyUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verify Email Address</a>
      <p style="color: #94a3b8; font-size: 12px;">If you didn't create a LOOP AI account, you can safely ignore this email.</p>
    </div>
  `;
}

export function getResetPasswordEmailTemplate(name: string, resetUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h2 style="color: #10b981;">Reset Your Password</h2>
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your password for your LOOP AI account. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #06b6d4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
      <p style="color: #94a3b8; font-size: 12px;">This link is valid for 1 hour. If you didn't request a password reset, please secure your account immediately.</p>
    </div>
  `;
}

export function getWorkspaceInviteEmailTemplate(inviterName: string, workspaceName: string, inviteUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h2 style="color: #10b981;">Workspace Invitation</h2>
      <p>${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on LOOP AI.</p>
      <p>Click below to accept your invitation and join the workspace:</p>
      <a href="${inviteUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Accept Invitation</a>
    </div>
  `;
}
