import { renderEmailContainer } from "../components/EmailContainer";

export interface PasswordResetEmailProps {
  name: string;
  code?: string;
  expiresMinutes?: number;
  expiresHours?: number;
  resetUrl?: string;
}

export function renderPasswordResetEmail({
  name,
  code = "123456",
  expiresMinutes,
  expiresHours = 0.1667, // Default 10 minutes
}: PasswordResetEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const displayMinutes = expiresMinutes || Math.round(expiresHours * 60);
  const subject = `${code} is your LOOP AI password reset verification code`;
  const previewText = `Your 6-digit password reset code for LOOP AI is ${code}. Expires in ${displayMinutes} minutes.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 2px;">LOOP AI SECURITY</span>
      <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; margin: 8px 0 0 0;">
        Password Reset Request
      </h1>
    </div>

    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
      Hi <strong>${name || "Customer"}</strong>, we received a request to reset your password for your <strong>LOOP AI</strong> account. Use the 6-digit code below to verify your identity:
    </p>

    <!-- Prominent 6-Digit OTP Code Container -->
    <div style="background-color: #0f172a; border: 2px solid #06b6d4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 0 0 25px rgba(6, 182, 212, 0.15);">
      <span style="font-family: 'JetBrains Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; color: #06b6d4; letter-spacing: 10px; display: inline-block;">
        ${code}
      </span>
      <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; font-weight: 600; color: #94a3b8; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
        6-Digit Password Reset Code
      </p>
    </div>

    <div style="background-color: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 24px;">
      <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #fbbf24; margin: 0; line-height: 1.5;">
        ⏳ <strong>Security Limit:</strong> This single-use code expires in <strong>${displayMinutes} minutes</strong>. Do not share this code with anyone.
      </p>
    </div>

    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
      If you did not request a password reset, please ignore this email or contact security at team@customerloop.in immediately. Your current password remains secure.
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    securityNotice: "If you did not request a password reset, your account remains completely secure.",
    showUnsubscribe: false,
  });

  const text = `LOOP AI SECURITY\nPassword Reset Request\n\nHi ${name},\n\nYour 6-digit password reset code is:\n\n${code}\n\nEnter this code in LOOP AI to reset your password.\n\nThis code expires in ${displayMinutes} minutes. If you didn't request this, safely ignore this email.`;

  return { subject, html, text };
}
