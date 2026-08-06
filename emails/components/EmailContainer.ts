import { renderEmailHeader } from "./EmailHeader";
import { renderEmailFooter } from "./EmailFooter";

interface EmailContainerProps {
  title: string;
  previewText: string;
  contentHtml: string;
  securityNotice?: string;
  showUnsubscribe?: boolean;
}

export function renderEmailContainer({
  title,
  previewText,
  contentHtml,
  securityNotice,
  showUnsubscribe = true,
}: EmailContainerProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #090d16;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 20px 16px !important;
      }
      .content-card {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="background-color: #090d16; margin: 0; padding: 0;">
  <!-- Preview Text (Hidden in email body) -->
  <div style="display: none; font-size: 1px; color: #090d16; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #090d16; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; padding: 0 16px;">
          <tr>
            <td>
              ${renderEmailHeader()}
            </td>
          </tr>
          <tr>
            <td class="content-card" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td>
              ${renderEmailFooter({ securityNotice, showUnsubscribe })}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
