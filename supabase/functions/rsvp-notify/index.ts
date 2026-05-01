// Supabase Edge Function: rsvp-notify
//
// Triggered by a Supabase Database Webhook on INSERT into public.rsvps.
// Sends a formatted email notification via Resend so we know
// instantly when a guest has RSVP'd.
//
// Required function secrets (set in Supabase dashboard):
//   RESEND_API_KEY    - Resend API key (re_xxxx)
//   WEBHOOK_SECRET    - shared secret matched against Authorization header
//   NOTIFY_TO         - comma-separated emails to receive alerts
//   FROM_ADDRESS      - sender, e.g. "onboarding@resend.dev" or a verified domain
//
// Deploy:  supabase functions deploy rsvp-notify --no-verify-jwt

// deno-lint-ignore-file
declare const Deno: { env: { get: (k: string) => string | undefined } };

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "";
const FROM_ADDRESS = Deno.env.get("FROM_ADDRESS") ?? "onboarding@resend.dev";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEmail(r: Record<string, any>): { subject: string; html: string; text: string } {
  const firstName = String(r.first_name ?? "").trim() || "Guest";
  const lastName = String(r.last_name ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const attending =
    r.attending === "yes" ? "Yes" : r.attending === "no" ? "No" : "Unknown";
  const relationship = String(r.relationship ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const submittedAt = new Date(r.created_at ?? Date.now()).toLocaleString(
    "en-GB",
    { dateStyle: "long", timeStyle: "short" },
  );

  const subject = `New RSVP - ${fullName} (${attending})`;

  const rows: Array<[string, string]> = [
    ["Attending", attending],
    ["Relationship", relationship || "—"],
    ["Email", String(r.email ?? "—")],
    r.phone ? ["Phone", String(r.phone)] : null,
    r.dietary ? ["Dietary", String(r.dietary)] : null,
    r.message ? ["Message", `"${String(r.message)}"`] : null,
    ["Submitted", submittedAt],
  ].filter(Boolean) as Array<[string, string]>;

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;color:#7a6a8e;width:140px;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:#1e0b3d;font-size:15px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:32px 16px;background:#fdf9f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e0b3d;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(198,154,42,0.3);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(30,11,61,0.08);">
    <div style="height:4px;background:linear-gradient(90deg,#c69a2a,#bb93d1,#c69a2a);"></div>
    <div style="padding:32px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c69a2a;">Yetunde &amp; Babatunde</p>
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;color:#1e0b3d;">New RSVP Received</h1>

      <div style="padding:20px;background:#fdf9f3;border:1px solid rgba(198,154,42,0.2);border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:20px;font-weight:600;color:#1e0b3d;">${escapeHtml(fullName)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#7a6a8e;">${escapeHtml(String(r.email ?? ""))}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        ${tableRows}
      </table>

      <p style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(198,154,42,0.2);font-size:12px;color:#9a8aa6;text-align:center;">
        9 October 2026 · Elite Venue, Gravesend
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `New RSVP — ${fullName} (${attending})`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Yetunde & Babatunde · 9 October 2026",
  ].join("\n");

  return { subject, html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (!WEBHOOK_SECRET || auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "rsvps") {
    return new Response(JSON.stringify({ ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY || !NOTIFY_TO) {
    return new Response("Server not configured", { status: 500 });
  }

  const { subject, html, text } = renderEmail(payload.record);
  const recipients = NOTIFY_TO.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Yetunde & Babatunde <${FROM_ADDRESS}>`,
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend error", resendRes.status, errBody);
    return new Response(
      JSON.stringify({ error: "Failed to send email", status: resendRes.status }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = await resendRes.json();
  return new Response(JSON.stringify({ ok: true, id: result.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
