export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body?.fullName || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const org = String(body?.org || "").trim();

    if (!fullName || !email || !org) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const url = process.env.GOOGLE_SCRIPT_URL?.trim();
    const secret = process.env.GOOGLE_SCRIPT_SECRET?.trim();

    if (!url || !secret) {
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
      secret,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();

    // حاول JSON
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // إذا السكربت رجّع HTML/نص (غالبًا خطأ نشر/صلاحيات)
      return NextResponse.json(
        {
          ok: false,
          error: "Google Script returned non-JSON (publish/access issue likely)",
          debug: {
            upstreamStatus: res.status,
            responseText: text.slice(0, 800), // قص للتخفيف
          },
        },
        { status: 502 }
      );
    }

    // إذا السكربت قال فشل
    if (!data?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || "Upstream failed",
          debug: {
            upstreamStatus: res.status,
            upstreamData: data,
            sentAction: payload.action,
            sentEmail: email,
          },
        },
        { status: res.status >= 400 ? res.status : 400 }
      );
    }

    // نجاح
    return NextResponse.json({ ok: true, mode: data.mode || "created" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
