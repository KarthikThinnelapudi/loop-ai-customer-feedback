import { Resend } from "resend";
import {
  renderWelcomeEmail,
  WelcomeEmailProps,
  renderVerifyEmail,
  VerifyEmailProps,
  renderPasswordResetEmail,
  PasswordResetEmailProps,
  renderWorkspaceInviteEmail,
  WorkspaceInviteEmailProps,
  renderSupportAutoReplyEmail,
  SupportAutoReplyEmailProps,
  renderFeedbackRequestEmail,
  FeedbackRequestEmailProps,
  renderFeedbackConfirmationEmail,
  FeedbackConfirmationEmailProps,
} from "../emails";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: "Resend API" | "Console Fallback";
  error?: string;
}

const DEFAULT_SENDER = process.env.EMAIL_FROM || "CustomerLoop <noreply@customerloop.in>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("your_") || apiKey.length < 10) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Centralized Enterprise Email Dispatcher using Resend API & Verified Domain (customerloop.in)
 */
export async function sendEmail({ to, subject, html, text, from }: SendEmailPayload): Promise<SendEmailResult> {
  const sender = from || DEFAULT_SENDER;
  const resend = getResendClient();

  console.log(`✉️ [CustomerLoop Email Service] Dispatching to: ${to} | Subject: "${subject}" | Sender: ${sender}`);

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: sender,
        to: [to],
        subject,
        html,
        text: text || subject,
      });

      if (response.data?.id) {
        console.log(`✅ Email delivered via Resend API to ${to} (ID: ${response.data.id})`);
        return {
          success: true,
          messageId: response.data.id,
          provider: "Resend API",
        };
      }

      if (response.error) {
        console.warn(`⚠️ Resend API Dispatch Notice: ${response.error.message}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Resend SDK Dispatch Exception:`, errMsg);
    }
  }

  // Native HTTP Fetch Fallback if SDK requires fallback
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Email delivered via Resend REST API to ${to} (ID: ${data.id})`);
        return { success: true, messageId: data.id, provider: "Resend API" };
      }
    } catch (fetchErr) {
      console.error(`❌ Resend REST API Fetch Error:`, fetchErr);
    }
  }

  // Development Console Dispatch Logger
  console.log(`--------------------------------------------------`);
  console.log(`✉️ EMAIL DISPATCH DISPATCHED (DEVELOPMENT CONSOLE DISPATCH)`);
  console.log(`TO: ${to}`);
  console.log(`FROM: ${sender}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`HTML SIZE: ${html.length} characters`);
  console.log(`--------------------------------------------------`);

  return { success: true, provider: "Console Fallback" };
}

/* Centralized Helper Service Functions for All 7 Email Scenarios */

export async function sendWelcomeEmail(props: WelcomeEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderWelcomeEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendVerificationEmail(props: VerifyEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderVerifyEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendPasswordResetEmail(props: PasswordResetEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderPasswordResetEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendWorkspaceInviteEmail(props: WorkspaceInviteEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderWorkspaceInviteEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendSupportAutoReplyEmail(props: SupportAutoReplyEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderSupportAutoReplyEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendFeedbackRequestEmail(props: FeedbackRequestEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderFeedbackRequestEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

export async function sendFeedbackConfirmationEmail(props: FeedbackConfirmationEmailProps & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = renderFeedbackConfirmationEmail(props);
  return sendEmail({ to: props.to, subject, html, text });
}

/* Backward Compatibility Legacy Helper Exports */
export function getVerificationEmailTemplate(name: string, verifyUrl: string): string {
  return renderVerifyEmail({ name, verifyUrl }).html;
}

export function getResetPasswordEmailTemplate(name: string, resetUrl: string): string {
  return renderPasswordResetEmail({ name, resetUrl }).html;
}

export function getWorkspaceInviteEmailTemplate(inviterName: string, workspaceName: string, inviteUrl: string): string {
  return renderWorkspaceInviteEmail({ inviterName, workspaceName, role: "MEMBER", inviteUrl }).html;
}
