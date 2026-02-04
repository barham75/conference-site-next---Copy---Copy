"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOrg = org.trim();

    if (!cleanName) {
      setMsg({ type: "err", text: "يرجى إدخال الاسم / Please enter name." });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg({ type: "err", text: "يرجى إدخال بريد صحيح / Valid email." });
      return;
    }
    if (!cleanOrg) {
      setMsg({ type: "err", text: "يرجى إدخال المؤسسة/الجامعة / Please enter institution." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: cleanName, email: cleanEmail, org: cleanOrg }),
      });

      // اقرأ النص أولًا (أكثر أمانًا من res.json مباشرة)
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: false, error: "Non-JSON response from /api/register", raw: text };
      }

      if (!data?.ok) {
        // ✅ هنا سنعرض السبب الحقيقي بدل "Unauthorized"
        setMsg({
          type: "err",
          text: `فشل التسجيل: ${data?.error || "Unknown error"}\n\nDEBUG: ${JSON.stringify(
            { status: res.status, data },
            null,
            2
          )}`,
        });
        return;
      }

      setMsg({
        type: "ok",
        text: data.mode === "updated"
          ? "تم تحديث بياناتك بنجاح ✅ / Updated ✅"
          : "تم التسجيل بنجاح ✅ / Registered ✅",
      });

      setTimeout(() => router.push("/"), 600);
    } catch {
      setMsg({ type: "err", text: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <h1 className="h1" style={{ marginBottom: 6 }}>
          التسجيل / Registration
        </h1>
        <div className="small">
          اكتب عربي/English في نفس الخانة. يمكنك الدخول بنفس الإيميل مرة ثانية لتحديث البيانات.
        </div>
      </div>

      {msg && (
        <pre
          className={msg.type === "ok" ? "success" : "error"}
          style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}
        >
          {msg.text}
        </pre>
      )}

      <form onSubmit={submit} className="grid" style={{ gap: 12 }}>
        <div className="grid grid-2">
          <label className="grid" style={{ gap: 6 }}>
            <div style={{ fontWeight: 900 }}>الاسم / Name</div>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="محمد برهم / Mohammad Barham"
            />
          </label>

          <label className="grid" style={{ gap: 6 }}>
            <div style={{ fontWeight: 900 }}>البريد الإلكتروني / Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              inputMode="email"
            />
          </label>
        </div>

        <label className="grid" style={{ gap: 6 }}>
          <div style={{ fontWeight: 900 }}>المؤسسة / الجامعة — Institution</div>
          <input
            className="input"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="جامعة جرش / Jerash University"
          />
        </label>

        <button className="btn" disabled={loading} style={{ width: 220, margin: "0 auto" }}>
          {loading ? "..." : "دخول / Enter"}
        </button>

        <div className="small" style={{ textAlign: "center" }}>
          بعد الدخول سيتم تحويلك للصفحة الرئيسية.
        </div>
      </form>
    </div>
  );
}
