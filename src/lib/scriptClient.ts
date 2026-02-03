export async function callScript<T>(payload: Record<string, any>): Promise<T> {
  const url = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;

  if (!url) throw new Error("Missing GOOGLE_SCRIPT_URL");
  if (!secret) throw new Error("Missing GOOGLE_SCRIPT_SECRET");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Google Script request failed");
  }
  return data as T;
}
