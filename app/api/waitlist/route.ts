// POST /api/waitlist — adds an email to the Upstash Redis "waitlist" set.
// GET  /api/waitlist — admin-only: returns { count, emails } when the request
//   carries the WAITLIST_ADMIN_TOKEN secret (Authorization: Bearer <token> or
//   ?key=<token>). Without it → 401. Never expose the list publicly.
// Dependency-free: hits Upstash's REST API with fetch (no @upstash/redis).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export async function GET(request: Request) {
  const secret = process.env.WAITLIST_ADMIN_TOKEN;
  if (!secret) {
    console.error("Waitlist GET: WAITLIST_ADMIN_TOKEN not set");
    return Response.json({ error: "Not available." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const key = bearer ?? new URL(request.url).searchParams.get("key");
  if (key !== secret) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const store = upstash();
  if (!store) {
    return Response.json({ error: "Storage unavailable." }, { status: 503 });
  }

  const res = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${store.token}` },
    body: JSON.stringify(["SMEMBERS", "waitlist"]),
    cache: "no-store",
  });
  if (!res.ok) {
    return Response.json({ error: "Couldn't read the list." }, { status: 502 });
  }
  const emails: string[] = (await res.json()).result ?? [];
  return Response.json({ count: emails.length, emails });
}

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();

  const store = upstash();
  if (!store) {
    // Misconfiguration is ours, not the visitor's — log loudly, fail clearly.
    console.error("Waitlist: UPSTASH_REDIS_REST_URL / _TOKEN not set");
    return Response.json({ error: "Signup is temporarily unavailable." }, { status: 503 });
  }

  const res = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${store.token}` },
    // Redis command as a JSON array — SADD dedupes automatically.
    body: JSON.stringify(["SADD", "waitlist", normalized]),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Waitlist: Upstash returned", res.status, await res.text());
    return Response.json({ error: "Couldn't save your email — try again." }, { status: 502 });
  }

  // result === 1 → newly added, 0 → already on the list. Both are success to the user.
  return Response.json({ ok: true });
}
