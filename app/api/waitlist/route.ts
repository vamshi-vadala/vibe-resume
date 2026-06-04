// POST /api/waitlist — adds an email to the Upstash Redis "waitlist" set.
// Dependency-free: hits Upstash's REST API with fetch (no @upstash/redis).
// Export the collected list later with: SMEMBERS waitlist

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Misconfiguration is ours, not the visitor's — log loudly, fail clearly.
    console.error("Waitlist: UPSTASH_REDIS_REST_URL / _TOKEN not set");
    return Response.json({ error: "Signup is temporarily unavailable." }, { status: 503 });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
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
