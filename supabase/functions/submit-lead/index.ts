const allowedOrigins = (Deno.env.get("LEAD_ALLOWED_ORIGINS") ?? "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const flavors = ["tim-bui", "nang-vang", "cam-oi", "xanh-diu"];
const maxBodyBytes = 4096;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readPayload(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let json = "";
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBodyBytes) {
      await reader.cancel();
      throw new Error("Body too large");
    }
    json += decoder.decode(value, { stream: true });
  }
  const data = JSON.parse(json + decoder.decode());
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid body");
  return data as Record<string, unknown>;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const headers = new Headers({ "Vary": "Origin", "Cache-Control": "no-store" });
  const reply = (status: number, accepted = false) => Response.json({ accepted }, { status, headers });

  if (!allowedOrigins.includes(origin)) return reply(403);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers", "apikey, content-type");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply(415);

  let data: Record<string, unknown>;
  try {
    data = await readPayload(request);
  } catch {
    return reply(400);
  }

  const name = readString(data.name);
  const email = readString(data.email).toLowerCase();
  const phone = readString(data.phone).replace(/[\s().-]/g, "").replace(/^\+84(?=\d{9}$)/, "0");
  const flavor = readString(data.flavor);
  const message = readString(data.message);
  const requestId = readString(data.requestId);
  if (name.length < 2 || name.length > 100 || (!email && !phone) || email.length > 254 ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    (phone && !/^\+?\d{8,15}$/.test(phone)) || (flavor && !flavors.includes(flavor)) ||
    message.length > 500 || data.consent !== true || readString(data.website) ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId)) {
    return reply(400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys.default;
  if (!url || !serviceKey) {
    console.error("Lead database credentials are unavailable");
    return reply(503);
  }

  const auth = serviceKey.startsWith("sb_secret_") ? {} : { Authorization: "Bearer " + serviceKey };
  try {
    const result = await fetch(url + "/rest/v1/rpc/submit_fiber_cookie_signup", {
      method: "POST",
      headers: { apikey: serviceKey, "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        p_id: requestId,
        p_name: name,
        p_email: email || null,
        p_phone: phone || null,
        p_flavor: flavor || null,
        p_message: message || null
      }),
      signal: AbortSignal.timeout(6500)
    });
    if (!result.ok) {
      const failure = await result.json().catch(() => ({}));
      console.error("Lead database request rejected", result.status, String(failure.code ?? "unknown"));
      return reply(503);
    }

    const outcome = await result.json();
    if (outcome === "limited") return reply(429);
    return outcome === "accepted" ? reply(201, true) : reply(503);
  } catch {
    console.error("Lead database request could not be completed");
    return reply(503);
  }
});
