// @ts-ignore - TS extension imports for Deno
import { welcomeCopy, type SupportedWelcomeLocales } from "./i18n.ts";

export type EmailOverrides = {
  subject?: string;
  text?: string;
  html?: string;
  name?: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWelcomeHtml(params: { name?: string; userId?: string; copy: any }) {
  const { name, copy } = params;
  const displayName = (name ?? '').trim();
  const headingHtml = copy.heading_html as string; // may contain <br/>

  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <style>
      @media(min-width:640px){.sm_px-40px{padding-left:40px !important;padding-right:40px !important}}
      @media(min-width:640px){.sm_text-34px{font-size:34px !important}}
      @media(min-width:640px){.sm_text-18px{font-size:18px !important}.sm_leading-24px{line-height:24px !important}}
      @media(min-width:640px){.sm_leading-34px{line-height:34px !important}.sm_my-80px{margin-top:80px !important;margin-bottom:80px !important}}
    </style>
  </head>
  <body style="background-color:#fff;font-family:ui-sans-serif, system-ui, sans-serif; padding:0">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">${escapeHtml(copy.preheader)}</div>

    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#2ADED8;height:12px;width:100%;margin:auto;max-width:600px"><tbody><tr><td></td></tr></tbody></table>

    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#000;margin:0 auto;max-width:600px;width:100%">
      <tbody><tr><td>
        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="sm_px-40px" style="padding:0 20px">
          <tbody><tr><td>
            <img alt="Primeshot" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-primeshot-logo.png" style="width:74px;height:74px;object-fit:cover;margin:40px 0;display:block;border:0" />
            <h1 class="sm_text-34px" style="color:#99EFEC;line-height:34px;font-size:28px;font-weight:600;margin:0 0 32px 0">${headingHtml}</h1>
            <p class="sm_text-18px sm_leading-24px" style="color:#fff;font-size:16px;line-height:22px;margin:16px 0 40px 0">${escapeHtml(copy.intro(displayName))}</p>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:40px"><tbody><tr><td>
              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px"><tbody><tr>
                <td style="width:60px;vertical-align:top"><div style="width:48px;height:48px;background-color:#041616;border-radius:9999px;display:table-cell;text-align:center;vertical-align:middle"><p style="color:#2ADED8;font-size:16px;font-weight:700;margin:0;line-height:24px">1</p></div></td>
                <td style="padding:0 16px;vertical-align:top"><h2 style="color:#fff;font-size:18px;font-weight:500;margin:0 0 8px 0">${escapeHtml(copy.step1_title)}</h2><p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:18px;margin:0">${escapeHtml(copy.step1_desc)}</p></td>
                <td style="min-width:60px;text-align:right;vertical-align:top"><table cellpadding="0" cellspacing="0" style="width:100%"><tr><td style="text-align:right;padding-bottom:4px"><img alt="Photo Styles" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-01.png" style="width:48px;height:48px;object-fit:cover;display:block;border:0" /></td><td style="text-align:right;padding-bottom:4px"><img alt="Scenes" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-02.png" style="width:48px;height:48px;object-fit:cover;display:block;border:0" /></td><td style="text-align:right"><img alt="Wardrobe" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-03.png" style="width:48px;height:48px;object-fit:cover;display:block;border:0" /></td></tr></table></td>
              </tr></tbody></table>

              <hr style="margin:20px 0;width:100%;border:none;border-top:1px solid #111" />

              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px"><tbody><tr>
                <td style="width:60px;vertical-align:top"><div style="width:48px;height:48px;background-color:#041616;border-radius:9999px;display:table-cell;text-align:center;vertical-align:middle"><p style="color:#2ADED8;font-size:16px;font-weight:700;margin:0;line-height:24px">2</p></div></td>
                <td style="padding:0 16px;vertical-align:top"><h2 style="color:#fff;font-size:18px;font-weight:500;margin:0 0 8px 0">${escapeHtml(copy.step2_title)}</h2><p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:18px;margin:0">${escapeHtml(copy.step2_desc)}</p></td>
                <td style="width:48px;text-align:right;vertical-align:top"><img alt="Character" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-04.png" style="width:48px;height:48px;object-fit:cover;display:block;border:0" /></td>
              </tr></tbody></table>

              <hr style="margin:20px 0;width:100%;border:none;border-top:1px solid #111" />

              <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px"><tbody><tr>
                <td style="width:60px;vertical-align:top"><div style="width:48px;height:48px;background-color:#041616;border-radius:9999px;display:table-cell;text-align:center;vertical-align:middle"><p style="color:#2ADED8;font-size:16px;font-weight:700;margin:0;line-height:24px">3</p></div></td>
                <td style="padding:0 16px;vertical-align:top"><h2 style="color:#fff;font-size:18px;font-weight:500;margin:0 0 8px 0">${escapeHtml(copy.step3_title)}</h2><p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:18px;margin:0">${escapeHtml(copy.step3_desc)}</p></td>
                <td style="width:48px;text-align:right;vertical-align:top"><img alt="Generate" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-05.png" style="width:48px;height:48px;object-fit:cover;display:block;border:0" /></td>
              </tr></tbody></table>
            </td></tr></tbody></table>

        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:0 20px"><tbody><tr><td>
          <img alt="Founding 300" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-06.png" style="width:100%;height:auto;object-fit:cover;margin-bottom:20px;display:block;border:0" />
          <a href="https://primeshot.ai/create" style="background-color:#FF550E;width:100%;color:#fff;padding:16px 32px;border-radius:16px;font-size:16px;font-weight:600;text-decoration:none;box-sizing:border-box;text-align:center;display:inline-block;max-width:100%" target="_blank">${escapeHtml(copy.cta_label)}</a>
        </td></tr></tbody></table>

        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:80px 40px 0 40px"><tbody><tr><td>
          <h2 class="sm_text-34px" style="color:#99EFEC;line-height:34px;font-size:28px;font-weight:600;margin:0 0 32px 0">${escapeHtml(copy.feedback_title)}</h2>
          <p class="sm_text-18px sm_leading-24px" style="color:#fff;font-size:16px;line-height:22px;margin:16px 0 12px 0">${escapeHtml(copy.feedback_p1)}</p>
          <p class="sm_text-18px sm_leading-24px" style="color:#fff;font-size:16px;line-height:22px;margin:0 0 6px 0">
            ${escapeHtml(copy.feedback_p2_prefix)}
            <a href="mailto:team@primeshot.ai" style="color:#2ADED8;text-decoration:underline;display:inline-block;margin:0 0 6px 0" target="_blank">team@primeshot.ai</a>
            ${escapeHtml(copy.feedback_p2_suffix)}
          </p>
        </td></tr></tbody></table>

        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td>
          <img alt="Preview Shots" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/beta-invite-03.png" style="width:100%;height:auto;object-fit:cover;margin-top:40px;display:block;border:0" />
          <p class="sm_text-34px sm_leading-34px sm_my-80px" style="color:#99EFEC;font-size:28px;font-weight:600;text-align:center;line-height:32px;margin:60px 0">${escapeHtml(copy.thankyou_title)}</p>
          <img alt="Primeshot" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-primeshot-footer-logo.png" style="width:140px;height:auto;margin:0 auto 40px auto;display:block;border:0" />
          <p style="color:#fff;font-size:13px;line-height:16px;text-align:center;margin:16px 0 1rem 0;padding:0 20px">${escapeHtml(copy.product_line)}</p>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:16px;text-align:center;margin:16px 0 2rem 0;padding:0 20px">${escapeHtml(copy.consent_line)}</p>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="text-align:center;margin-bottom:24px"><tbody><tr><td>
            <a href="https://x.com/primeshotai" style="display:inline-block;margin:0 8px;text-decoration:none" target="_blank"><img alt="X" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-x.png" style="width:24px;height:24px;object-fit:cover;display:block;border:0" /></a>
            <a href="https://instagram.com/primeshotai" style="display:inline-block;margin:0 8px;text-decoration:none" target="_blank"><img alt="Instagram" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-ig.png" style="width:24px;height:24px;object-fit:cover;display:block;border:0" /></a>
            <a href="https://linkedin.com/company/primeshotai" style="display:inline-block;margin:0 8px;text-decoration:none" target="_blank"><img alt="LinkedIn" src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-ln.png" style="width:24px;height:24px;object-fit:cover;display:block;border:0" /></a>
          </td></tr></tbody></table>
          <p style="color:#888;font-size:12px;line-height:16px;text-align:center;margin:0;padding:0 20px 40px 20px">© ${new Date().getUTCFullYear()} Primeshot</p>
        </td></tr></tbody></table>

      </td></tr></tbody>
    </table>
  </body>
</html>`;
}

function buildWelcomeText(params: { name?: string; copy: any }) {
  const { name, copy } = params;
  const displayName = (name && name.trim().length > 0) ? name : 'there';
  return [
    copy.subject(displayName),
    '',
    copy.preheader,
    '',
    copy.intro(displayName),
    '',
    `1) ${copy.step1_title} — ${copy.step1_desc}`,
    `2) ${copy.step2_title} — ${copy.step2_desc}`,
    `3) ${copy.step3_title} — ${copy.step3_desc}`,
    '',
    `${copy.cta_label}: https://primeshot.ai/create`,
    '',
    copy.feedback_title,
    copy.feedback_p1,
    `${copy.feedback_p2_prefix}${copy.feedback_p2_link_label}${copy.feedback_p2_suffix}`,
    '',
    copy.thankyou_title,
    copy.product_line,
    copy.consent_line,
    copy.copyright
  ].join('\n');
}

export function renderWelcomeEmail(
  params: { name?: string; userId?: string; locale?: string },
  overrides: EmailOverrides = {}
) {
  const finalName = overrides.name ?? params.name ?? 'there';
  const locale = (params.locale as SupportedWelcomeLocales) || 'en';
  const copy = welcomeCopy[locale] ?? welcomeCopy['en'];
  const subject = overrides.subject ?? copy.subject(finalName);
  const html = overrides.html ?? buildWelcomeHtml({ name: finalName, userId: params.userId, copy });
  const text = overrides.text ?? buildWelcomeText({ name: finalName, copy });
  return { subject, html, text };
}


