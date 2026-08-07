export function renderEmailHeader(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="left" style="padding: 12px 0;">
          <a href="https://customerloop.in" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center;">
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">
              LOOP <span style="color: #38bdf8;">AI</span>
              <span style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); -webkit-background-clip: text; color: #10b981; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 8px; padding: 2px 8px; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px;">ENTERPRISE</span>
            </div>
          </a>
        </td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; padding-bottom: 12px;"></td>
      </tr>
    </table>
  `;
}
