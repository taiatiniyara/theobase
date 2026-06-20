const SYSTEM_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderLayout(opts: {
  preheader: string;
  title: string;
  body: string;
  cta?: { label: string; url: string };
  footer?: string;
}): string {
  const ctaBlock = opts.cta
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 28px;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(opts.cta.url)}"
               target="_blank"
               rel="noopener noreferrer"
               style="display: inline-block; padding: 14px 40px; background: #4F46E5; color: #FFFFFF; font-family: ${SYSTEM_FONT}; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; line-height: 1.4; mso-padding-alt: 0;">
              <!--[if mso]><i style="letter-spacing: 40px; mso-font-width: -100%; mso-text-raise: 28pt;">&nbsp;</i><![endif]-->
              <span style="color: #FFFFFF; font-family: ${SYSTEM_FONT}; font-size: 16px; font-weight: 600; line-height: 1.4;">${escapeHtml(opts.cta.label)} &rarr;</span>
              <!--[if mso]><i style="letter-spacing: 40px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const footerBlock = opts.footer
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 36px; border-top: 1px solid #E5E7EB; padding-top: 24px;">
        <tr>
          <td style="font-family: ${SYSTEM_FONT}; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
            ${opts.footer}
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(opts.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; color: #F3F4F6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${escapeHtml(opts.preheader)}</span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 40px 16px 60px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 0 0 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: ${SYSTEM_FONT}; font-size: 22px; font-weight: 700; color: #4F46E5; letter-spacing: -0.3px;">
                    Theobase
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #FFFFFF; border-radius: 12px; padding: 40px 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);">

              <!-- Icon circle -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 48px; height: 48px; background: #EEF2FF; border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 20px; line-height: 1;">&#9998;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 16px 0 8px; font-family: ${SYSTEM_FONT}; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.3; letter-spacing: -0.3px;">
                    ${escapeHtml(opts.title)}
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0 0; font-family: ${SYSTEM_FONT}; font-size: 16px; color: #4B5563; line-height: 1.7;">
                    ${opts.body}
                  </td>
                </tr>
              </table>

              ${ctaBlock}

              ${footerBlock}

            </td>
          </tr>

          <!-- Global footer -->
          <tr>
            <td align="center" style="padding: 28px 0 0; font-family: ${SYSTEM_FONT}; font-size: 12px; color: #9CA3AF; line-height: 1.7;">
              Sent by Theobase &middot; Church management, simplified
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderMagicLinkEmail(opts: { magicLink: string }): string {
  return renderLayout({
    preheader: "Click the link to sign in to Theobase",
    title: "Sign in to Theobase",
    body: `<p style="margin: 0 0 12px;">Click the button below to sign in to your account. No password needed.</p>
<p style="margin: 0;">This link expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>`,
    cta: { label: "Sign in", url: opts.magicLink },
    footer: `<p style="margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
<p style="margin: 8px 0 0; word-break: break-all;"><a href="${escapeHtml(opts.magicLink)}" style="color: #4F46E5; text-decoration: underline;">${escapeHtml(opts.magicLink)}</a></p>`,
  });
}

export function renderRotaAssignmentEmail(opts: { role: string; date: string }): string {
  const displayRole = opts.role.replace(/_/g, " ");
  const displayDate = new Date(opts.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return renderLayout({
    preheader: `You've been assigned as ${displayRole} on ${displayDate}`,
    title: "New Duty Assignment",
    body: `<p style="margin: 0 0 16px;">You have been assigned a new duty for your congregation.</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #F9FAFB; border-radius: 8px; margin: 0 0 16px;">
  <tr>
    <td style="padding: 16px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-family: ${SYSTEM_FONT}; font-size: 13px; color: #6B7280; padding: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Role</td>
          <td style="font-family: ${SYSTEM_FONT}; font-size: 13px; color: #6B7280; padding: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Date</td>
        </tr>
        <tr>
          <td style="font-family: ${SYSTEM_FONT}; font-size: 16px; font-weight: 600; color: #111827;">${escapeHtml(displayRole)}</td>
          <td style="font-family: ${SYSTEM_FONT}; font-size: 16px; font-weight: 600; color: #111827;">${escapeHtml(displayDate)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 0;">Log in to Theobase to confirm your availability or decline this assignment.</p>`,
    cta: { label: "View assignment", url: "https://theobase.app/rota" },
    footer: `<p style="margin: 0;">You received this because a clerk assigned you to this duty. If your availability has changed, please log in and decline so they can find a replacement.</p>`,
  });
}

export function renderInviteEmail(opts: {
  role: string;
  joinUrl: string;
}): string {
  return renderLayout({
    preheader: `You've been invited to join a congregation on Theobase as ${opts.role}`,
    title: "You're invited",
    body: `<p style="margin: 0 0 12px;">You have been invited to join a congregation on Theobase as <strong>${escapeHtml(opts.role)}</strong>.</p>
<p style="margin: 0;">Theobase helps congregations manage rosters, duties, members, and more — all in one place.</p>`,
    cta: { label: "Join Theobase", url: opts.joinUrl },
    footer: `<p style="margin: 0;">If you weren't expecting this invitation, you can safely ignore this email.</p>`,
  });
}
