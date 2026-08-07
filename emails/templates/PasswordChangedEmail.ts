import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface PasswordChangedEmailProps {
  name: string;
  loginUrl: string;
  time?: string;
}

export function renderPasswordChangedEmail({
  name,
  loginUrl,
  time = new Date().toUTCString(),
}: PasswordChangedEmailProps): { subject: string; html: string; text: string } {
  const subject = "Security Alert: Your LOOP AI Password Was Changed";

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Password Changed Successfully
    </h1>
    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hello ${name},
    </p>
    <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
      This email confirms that the password for your <strong>LOOP AI</strong> account was successfully updated on <strong>${time}</strong>.
    </p>
    <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #94a3b8; margin: 0;">
        ⚠️ If you did not make this change, please contact our security response team immediately at <a href="mailto:team@customerloop.in" style="color: #10b981;">team@customerloop.in</a>.
      </p>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      ${renderEmailButton({ href: loginUrl, text: "Log In to LOOP AI", variant: "primary" })}
    </div>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText: "Your LOOP AI account password was successfully updated.",
    contentHtml,
    securityNotice: "This security notification was generated automatically to protect your LOOP AI account.",
  });

  const text = `
Hello ${name},

This email confirms that the password for your LOOP AI account was successfully updated on ${time}.

Log in to your workspace: ${loginUrl}

If you did not request this change, please contact support immediately at team@customerloop.in.

© LOOP AI Enterprise Platform
  `.trim();

  return { subject, html, text };
}
