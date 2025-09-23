import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface WelcomePayload {
  id: string;
  email: string;
  full_name?: string | null;
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
    if (!hookSecret || headerSecret !== hookSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id, email, full_name }: WelcomePayload = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") || "Primeshot <hello@yourdomain.com>";
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const name = getDisplayName(email, full_name ?? undefined);

    const emailBody = {
      from,
      to: [email],
      subject: `Welcome to Primeshot, ${name}!`,
      text: `Hi ${name},\n\nWelcome to Primeshot — your account is ready (id: ${id}).\n\nWe\'re excited to have you on board!`,
      html: `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">\n  <h2 style="margin:0 0 12px">Welcome to Primeshot, ${name}!</h2>\n  <p>Your account is ready${id ? ` (id: ${id})` : ''}. We're excited to have you on board.</p>\n  <p style="margin-top:24px">— The Primeshot Team</p>\n</body></html>`
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


