import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface WorkspaceInviteEmailProps {
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresDays?: number;
}

export function renderWorkspaceInviteEmail({
  inviterName,
  workspaceName,
  role,
  inviteUrl,
  expiresDays = 7,
}: WorkspaceInviteEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Invitation to join ${workspaceName} on CustomerLoop`;
  const previewText = `${inviterName} has invited you to join the ${workspaceName} workspace on CustomerLoop.`;

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      You've Been Invited! 🚀
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      <strong>${inviterName}</strong> has invited you to collaborate on the <strong>${workspaceName}</strong> workspace on CustomerLoop.
    </p>

    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8;">Workspace:</td>
          <td style="font-family: sans-serif; font-size: 14px; font-weight: 700; color: #f8fafc;" align="right">${workspaceName}</td>
        </tr>
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8; padding-top: 8px;">Assigned Role:</td>
          <td style="font-family: sans-serif; font-size: 14px; font-weight: 700; color: #10b981;" align="right">${role}</td>
        </tr>
      </table>
    </div>

    ${renderEmailButton({ href: inviteUrl, text: "Accept Invitation", variant: "primary" })}

    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0;">
      ⏳ This workspace invitation will expire in <strong>${expiresDays} days</strong>.
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    securityNotice: "If you were not expecting this invitation, you can safely ignore this email.",
    showUnsubscribe: false,
  });

  const text = `${inviterName} has invited you to join the ${workspaceName} workspace as a ${role} on CustomerLoop.\n\nAccept your invitation here: ${inviteUrl}\n\nLink expires in ${expiresDays} days.`;

  return { subject, html, text };
}
