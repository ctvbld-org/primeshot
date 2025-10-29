import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { z } from 'zod';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// Import email translations
import usEmail from '@primeshot/common/locales/us/email.json';
import gbEmail from '@primeshot/common/locales/gb/email.json';
import frEmail from '@primeshot/common/locales/fr/email.json';
import esEmail from '@primeshot/common/locales/es/email.json';
import itEmail from '@primeshot/common/locales/it/email.json';
import ptEmail from '@primeshot/common/locales/pt/email.json';
import deEmail from '@primeshot/common/locales/de/email.json';
import nlEmail from '@primeshot/common/locales/nl/email.json';
import cnEmail from '@primeshot/common/locales/cn/email.json';
import jpEmail from '@primeshot/common/locales/jp/email.json';

const emailTranslations = {
  us: usEmail,
  gb: gbEmail,
  fr: frEmail,
  es: esEmail,
  it: itEmail,
  pt: ptEmail,
  de: deEmail,
  nl: nlEmail,
  cn: cnEmail,
  jp: jpEmail,
};

type SupportedLanguage = keyof typeof emailTranslations;

const emailSchema = z.object({
  email: z.string().email(),
  language: z.string().optional(),
});

/**
 * Detect user's language from request
 * Priority: 1) explicit language param, 2) Accept-Language header, 3) default to 'us'
 */
function detectLanguage(requestedLang?: string, acceptLanguageHeader?: string | null): SupportedLanguage {
  // Check explicitly requested language
  if (requestedLang && requestedLang in emailTranslations) {
    return requestedLang as SupportedLanguage;
  }
  
  // Parse Accept-Language header
  if (acceptLanguageHeader) {
    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const [code, quality] = lang.trim().split(';q=');
        return {
          code: code.toLowerCase().split('-')[0], // Extract primary language code
          quality: quality ? parseFloat(quality) : 1.0
        };
      })
      .sort((a, b) => b.quality - a.quality);
    
    // Map common language codes to our supported ones
    const languageMap: Record<string, SupportedLanguage> = {
      'en': 'gb', // Default English to GB for backward compatibility
      'fr': 'fr',
      'es': 'es',
      'it': 'it',
      'pt': 'pt',
      'de': 'de',
      'nl': 'nl',
      'zh': 'cn',
      'ja': 'jp',
    };
    
    for (const lang of languages) {
      const mappedLang = languageMap[lang.code];
      if (mappedLang) {
        return mappedLang;
      }
    }
  }
  
  // Default to US English
  return 'us';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, language: requestedLanguage } = emailSchema.parse(body);
    
    // Detect user's preferred language
    const acceptLanguageHeader = request.headers.get('accept-language');
    const userLanguage = detectLanguage(requestedLanguage, acceptLanguageHeader);
    const t = emailTranslations[userLanguage].betaInvite;
    
    const supabase = createAdminClient()

    const { error: supabaseError } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (supabaseError) {
      console.error('Supabase error details:', supabaseError);
      // Handle unique constraint violation
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'ALREADY_EXISTS' },
          { status: 400 }
        );
      }
      throw supabaseError;
    }

    // Add contact to Resend Audience (if configured)
    let addedToAudience = false;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
        });
        addedToAudience = true;
        console.log(`Contact ${email} added to Resend Audience ${audienceId}`);
      } catch (audienceError: unknown) {
        // Don't fail the entire request if audience addition fails
        console.error('Failed to add contact to Resend Audience:', audienceError);
        
        // Check if contact already exists in audience (this is OK)
        const errorMessage = audienceError instanceof Error ? audienceError.message : String(audienceError);
        if (errorMessage.includes('already exists') || errorMessage.includes('Contact already exists')) {
          console.log(`Contact ${email} already exists in Resend Audience`);
          addedToAudience = true;
        }
      }
    } else {
      console.warn('RESEND_AUDIENCE_ID not configured - skipping audience addition');
    }

    // Send welcome email
    // Note: The unsubscribe URL will work automatically because:
    // 1. The contact was added to the audience above
    // 2. Resend detects audience membership by email address
    // 3. The {{{RESEND_UNSUBSCRIBE_URL}}} placeholder gets replaced
    const emailPayload: any = {
      from: process.env.RESEND_FROM_EMAIL || 'Primeshot <team@mail.primeshot.ai>',
      to: [email],
      subject: t.subject,
      html: `
        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:1.0769230769230769em;min-height:100%;line-height:155%">
        <tbody>
            <tr>
                <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="align:center;width:600px;padding-left:0px;padding-right:0px;line-height:155%;max-width:600px;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif">
                        <tbody>
                            <tr>
                                <td>
                                    <div>
                                        <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
                                            ${t.previewText}
                                        </div>
                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(42,222,216);height:12px;width:100%;margin:auto;max-width:600px">
                                            <tbody>
                                                <tr>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(0,0,0);margin-left:auto;margin-right:auto;padding-left:0px;padding-right:0px;max-width:600px;width:100%">
                                            <tbody>
                                                <tr style="width:100%">
                                                    <td>
                                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="sm_px-40px" style="padding-left:20px;padding-right:20px">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <img alt="Primeshot" src="https://primeshot.ai/email/base-primeshot-logo.png" style="width:74px;height:74px;object-fit:cover;margin-top:40px;margin-bottom:40px;display:block;outline:none;border:none;text-decoration:none" />
                                                                        <h1 class="sm_text-34px" style="color:rgb(153,239,236);line-height:34px;font-size:28px;font-weight:600;margin-bottom:32px;margin-top:0px">
                                                                            ${t.heading} ${t.emoji}
                                                                        </h1>
                                                                        <p class="sm_text-18px sm_leading-24px" style="color:rgb(255,255,255);font-size:16px;line-height:22px;margin-bottom:24px;margin-top:16px">
                                                                            ${t.paragraph1}
                                                                        </p>
                                                                        <p class="sm_text-18px sm_leading-24px" style="color:rgb(255,255,255);font-size:16px;line-height:22px;margin-bottom:24px;margin-top:16px">
                                                                            ${t.paragraph2}
                                                                        </p>
                                                                        <p class="sm_text-18px sm_leading-24px" style="color:rgb(42,222,216);font-size:16px;line-height:22px;margin-bottom:32px;margin-top:16px">
                                                                            ${t.offerText}
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:20px;padding-right:20px">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <img alt="Founding 300" src="https://primeshot.ai/email/beta-invite-01b.png" style="width:100%;height:auto;object-fit:cover;margin-bottom:20px;display:block;outline:none;border:none;text-decoration:none" /><img alt="Founding 300 Ticket" src="https://primeshot.ai/email/beta-invite-02.png" style="width:100%;height:auto;object-fit:cover;margin-bottom:40px;display:block;outline:none;border:none;text-decoration:none" />
                                                                        <p class="sm_text-18px sm_leading-24px" style="color:rgb(255,255,255);padding-left:20px;padding-right:20px;font-size:16px;line-height:22px;margin-bottom:24px;margin-top:16px">
                                                                            ${t.offerDescription}
                                                                        </p>
                                                                        <a href="https://primeshot.ai/create" style="background-color:rgb(255,85,14);width:100%;color:rgb(255,255,255);padding-left:32px;padding-right:32px;padding-top:16px;padding-bottom:16px;border-radius:16px;font-size:16px;font-weight:600;text-decoration-line:none;box-sizing:border-box;text-align:center;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:12px">${t.ctaButton}</span><span></span></a>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <img alt="Preview Shots" src="https://primeshot.ai/email/beta-invite-03.png" style="width:100%;height:auto;object-fit:cover;margin-top:40px;display:block;outline:none;border:none;text-decoration:none" />
                                                                        <p class="sm_text-34px sm_leading-34px sm_my-80px" style="color:rgb(153,239,236);font-size:28px;font-weight:600;text-align:center;line-height:32px;margin-top:60px;margin-bottom:60px">
                                                                            ${t.thankYou}
                                                                        </p>
                                                                        <img alt="Primeshot" src="https://primeshot.ai/email/base-primeshot-footer-logo.png" style="width:140px;height:auto;margin-left:auto;margin-right:auto;object-fit:cover;margin-bottom:40px;display:block;outline:none;border:none;text-decoration:none" />
                                                                        <p style="color:rgb(255,255,255);font-size:13px;line-height:16px;text-align:center;margin-bottom:1rem;padding-left:20px;padding-right:20px;margin-top:16px">
                                                                            ${t.companyFooter}
                                                                        </p>
                                                                        <p style="color:rgb(255,255,255,0.6);font-size:13px;line-height:16px;text-align:center;margin-bottom:2rem;padding-left:20px;padding-right:20px;margin-top:16px">
                                                                            ${t.receivingReason}
                                                                        </p>
                                                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="text-align:center;margin-bottom:24px">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td>
                                                                                        <a href="https://x.com/primeshotai" style="display:inline-block;margin-left:8px;margin-right:8px;color:#067df7;text-decoration-line:none"><img alt="X" src="https://primeshot.ai/email/base-icon-x.png" style="width:24px;height:24px;object-fit:cover;display:block;outline:none;border:none;text-decoration:none" /></a><a href="https://instagram.com/primeshotai" style="display:inline-block;margin-left:8px;margin-right:8px;color:#067df7;text-decoration-line:none"><img alt="Instagram" src="https://primeshot.ai/email/base-icon-ig.png" style="width:24px;height:24px;object-fit:cover;display:block;outline:none;border:none;text-decoration:none" /></a><a href="https://linkedin.com/company/primeshotai" style="display:inline-block;margin-left:8px;margin-right:8px;color:#067df7;text-decoration-line:none"><img alt="LinkedIn" src="https://primeshot.ai/email/base-icon-ln.png" style="width:24px;height:24px;object-fit:cover;display:block;outline:none;border:none;text-decoration:none" /></a>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                        <p style="color:rgb(136,136,136);font-size:12px;line-height:16px;text-align:center;margin:0px;padding-bottom:40px;padding-left:20px;padding-right:20px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                                                                            © 2025 Primeshot
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p class="" style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                                        <br />
                                    </p>
                                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="node-footer" style="font-size:0.8em">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <hr class="divider" style="width:100%;border:none;border-top:1px solid #eaeaea;padding-bottom:1em;border-width:2px" />
                                                    <p class="" style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                                                        <span>${t.unsubscribePrefix}</span><br /><span>${t.unsubscribeLinkPrefix} </span><span><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" rel="noopener noreferrer nofollow" ses:no-track="true" style="color:#0670DB;text-decoration-line:none;text-decoration:underline" target="_blank">${t.unsubscribeLink}</a></span><span>${t.unsubscribeSuffix}</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <p class="" style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                                        <br />
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
      `,
      text: t.plainText
    };

    // Add audience ID if contact was added to audience
    if (addedToAudience && audienceId) {
      emailPayload.tags = [{ name: 'audience_id', value: audienceId }];
    }

    const { error: emailError } = await resend.emails.send(emailPayload);

    if (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue - user still added to waitlist successfully
    }

    return NextResponse.json(
      { 
        success: true,
        emailSent: !emailError,
        addedToAudience 
      },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
} 