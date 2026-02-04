export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, org } = body;

    if (!fullName || !email || !org) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // فحص سريع: إذا env ناقصة على Vercel
    if (!process.env.GOOGLE_SCRIPT_URL || !process.env.GOOGLE_SCRIPT_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing GOOGLE_SCRIPT_URL or GOOGLE_SCRIPT_SECRET on server",
        },
        { status: 500 }
      );
    }

    const payload = {
      action: "register",
      fullName,
      email,
      org,
      secret: process.env.GOOGLE_SCRIPT_SECRET,
    };

    const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // محاولة قراءة JSON، وإذا فشل نرجع النص الخام
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Non-JSON response from Google Script", raw: text };
    }

    // ✅ Debug: رجّع الرد كاملًا إذا فشل
    if (!data?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || "Unauthorized",
          debug: {
            status: res.status,
            responseText: text,
            sentAction: payload.action,
            sentEmail: email,
          },
        },
        { status: 401 }
      );
    }

    // نجاح
    return NextResponse.json({
      ok: true,
      mode: data.mode || "created",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
