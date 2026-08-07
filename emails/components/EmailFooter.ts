interface EmailFooterProps {
  securityNotice?: string;
  showUnsubscribe?: boolean;
}

export function renderEmailFooter({ securityNotice, showUnsubscribe = true }: EmailFooterProps = {}): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 24px;">
      ${
        securityNotice
          ? `
      <tr>
        <td style="padding-bottom: 16px;">
          <div style="background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #fca5a5; line-height: 1.5;">
            <strong>🔒 Security Notice:</strong> ${securityNotice}
          </div>
        </td>
      </tr>
      `
          : ""
      }
      <tr>
        <td align="center" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">
            Need help? Contact our team at 
            <a href="mailto:team@customerloop.in" style="color: #10b981; text-decoration: none;">team@customerloop.in</a>.
          </p>
          <p style="margin: 0 0 12px 0; color: #64748b;">
            LOOP AI Inc. • Enterprise Customer Intelligence Platform
          </p>
          <p style="margin: 0; color: #475569; font-size: 11px;">
            © ${new Date().getFullYear()} LOOP AI. All rights reserved. 
            ${
              showUnsubscribe
                ? `| <a href="https://customerloop.in/unsubscribe" target="_blank" style="color: #64748b; text-decoration: underline;">Unsubscribe Preferences</a>`
                : ""
            }
          </p>
        </td>
      </tr>
    </table>
  `;
}
