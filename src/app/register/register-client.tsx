"use client";

import { useState } from "react";

export default function RegisterClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim()) return setMsg({ type: "err", text: "الاسم مطلوب." });
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return setMsg({ type: "err", text: "يرجى إدخال بريد صحيح." });
    if (!org.trim()) return setMsg({ type: "err", text: "المؤسسة/الجامعة مطلوبة." });

    setLoading(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email: cleanEmail, org }),
      });

      const raw = await r.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { ok: false, error: "Non-JSON from /api/register", raw };
      }

      console.log("API /api/register status:", r.status);
      console.log("API /api/register response:", JSON.stringify(data, null, 2));

      if (!r.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.error || `Server error (${r.status})` });
        return;
      }

      setMsg({ type: "ok", text: "تم التسجيل بنجاح ✅" });
    } catch (err: any) {
      console.error("NETWORK ERROR:", err);
      setMsg({ type: "err", text: err?.message || "خطأ اتصال" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 12 }}>Registration / التسجيل</h1>

      {msg && (
        <div
          style={{
            margin: "12px 0",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid",
            borderColor: msg.type === "ok" ? "#a7f3d0" : "#fecaca",
            background: msg.type === "ok" ? "#ecfdf5" : "#fef2f2",
            color: msg.type === "ok" ? "#065f46" : "#991b1b",
            textAlign: "right",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Name / الاسم"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd", textAlign: "right" }}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email / البريد الإلكتروني"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd", textAlign: "left" }}
        />

        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          placeholder="Institution / المؤسسة أو الجامعة"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd", textAlign: "right" }}
        />

        <button
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "#0f766e",
            color: "white",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Enter / دخول"}
        </button>
      </form>
    </div>
  );
}
