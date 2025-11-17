import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { renderWelcomeEmail } from "../_shared/emails/index.ts";

interface WelcomePayload {
  id: string;
  email: string;
  full_name?: string | null;
  locale?: string;
}

function getDisplayName(email: string, fullName?: string | null): string {
  if (fullName && fullName.trim().length > 0) return fullName.trim();
  const local = email.split("@")[0] || email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const hookSecret = Deno.env.get("WELCOME_HOOK_SECRET");
    const headerSecret = req.headers.get("x-hook-secret");
    
    // Debug logging
    console.log("Auth check:", {
      hasEnvSecret: !!hookSecret,
      envSecretLength: hookSecret?.length,
      hasHeaderSecret: !!headerSecret,
      headerSecretLength: headerSecret?.length,
      match: hookSecret === headerSecret
    });
    
    if (!hookSecret || headerSecret !== hookSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id, email, full_name, locale }: WelcomePayload = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") || "Primeshot <team@mail.primeshot.ai>";
    const replyTo = Deno.env.get("RESEND_REPLY_TO") || from;
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const name = getDisplayName(email, full_name ?? undefined);
    const { subject, html, text } = renderWelcomeEmail({ name, userId: id, locale: locale || 'en' });

    const emailBody = {
      from,
      to: [email],
      bcc: ["primeshot.ai+e7cde10c24@invite.trustpilot.com"],
      subject,
      text,
      html,
      reply_to: replyTo
    } as Record<string, unknown>;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    const json = await resp.json();
    return new Response(
      JSON.stringify(json),
      { status: resp.ok ? 200 : 502, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


