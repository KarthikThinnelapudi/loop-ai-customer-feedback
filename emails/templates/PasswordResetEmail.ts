import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresHours?: number;
}

export function renderPasswordResetEmail({
  name,
  resetUrl,
  expiresHours = 1,
}: PasswordResetEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset your LOOP AI Password";
  const previewText = "We received a request to reset your LOOP AI password.";

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Password Reset Request
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${name || "there"}, we received a request to reset your password for your <strong>LOOP AI</strong> account. Click the button below to set a new password:
    </p>

    ${renderEmailButton({ href: resetUrl, text: "Reset Password", variant: "cyan" })}

    <div style="background-color: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
      <p style="font-family: sans-serif; font-size: 13px; color: #fbbf24; margin: 0; line-height: 1.5;">
        ⏳ <strong>Security Limit:</strong> This single-use password reset link will expire in <strong>${expiresHours} hour</strong>.
      </p>
    </div>

    <p style="font-family: sans-serif; font-size: 12px; color: #94a3b8; margin-top: 16px;">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    securityNotice: "If you did not request a password reset, please ignore this email or contact team@customerloop.in immediately. Your current password remains secure.",
    showUnsubscribe: false,
  });

  const text = `Hi ${name},\n\nWe received a request to reset your LOOP AI password. Use this secure link to set a new password: ${resetUrl}\n\nLink expires in ${expiresHours} hour. If you didn't request this, your account remains secure.`;

  return { subject, html, text };
}
