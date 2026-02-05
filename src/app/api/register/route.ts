export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function safeSlice(s: string, n = 600) {
  return s.length > n ? s.slice(0, n) : s;
}

export async function POST(req: Request) {
  try {
    // 1) قراءة JSON بأمان (حتى لو جاء body غير صالح)
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 2) نقبل أكثر من اسم للحقول
    const fullName = String(body?.fullName ?? body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const org = String(body?.org ?? body?.institution ?? body?.university ?? "").trim();

    if (!fullName || !email || !org) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing fields",
          debug: {
            receivedKeys: body ? Object.keys(body) : [],
            hasFullName: !!fullName,
            hasEmail: !!email,
            hasOrg: !!org,
          },
        },
        { status: 400 }
      );
    }

    // 3) ENV
    const urlRaw = process.env.GOOGLE_SCRIPT_URL ?? "";
    const secretRaw = process.env.GOOGLE_SCRIPT_SECRET ?? "";

    const url = urlRaw.trim();
    const secret = secretRaw.trim();

    const urlHasNewline = /[\r\n]/.test(urlRaw);
    const secretHasNewline = /[\r\n]/.test(secretRaw);

    if (!url || !secret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing GOOGLE_SCRIPT_URL or GOOGLE_SCRIPT_SECRET on server",
          debug: {
            hasUrl: !!url,
            hasSecret: !!secret,
            urlHasNewline,
            secretHasNewline,
          },
        },
        { status: 500 }
      );
    }

    // 4) إرسال إلى Google Script
    const payload = { action: "register", fullName, email, org, secret };

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);

    let upstreamStatus = 0;
    let upstreamText = "";

    try {
      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });

      upstreamStatus = upstream.status;
      upstreamText = await upstream.text();
    } finally {
      clearTimeout(t);
    }

    // 5) لازم يرجع JSON من السكربت
    let data: any;
    try {
      data = JSON.parse(upstreamText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Google Script returned non-JSON (publish/access/URL issue likely)",
          debug: {
            upstreamStatus,
            urlHasNewline,
            secretHasNewline,
            responseText: safeSlice(upstreamText, 900),
          },
        },
        { status: 502 }
      );
    }

    if (!data?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || "Upstream failed",
          debug: {
            upstreamStatus,
            urlHasNewline,
            secretHasNewline,
            upstream: data,
          },
        },
        { status: 400 }
      );
    }

    // 6) Cookie
    const userPayload = Buffer.from(
      JSON.stringify({ fullName, email, org }),
      "utf8"
    ).toString("base64");

    const res = NextResponse.json(
      { ok: true, mode: data.mode || "created" },
      { status: 200 }
    );

    res.cookies.set("conf_user", userPayload, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    // ✅ هنا سيظهر سبب 500 الحقيقي غالبًا (AbortError / fetch failed / etc)
    const isAbort = e?.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        error: isAbort ? "Timeout contacting Google Script" : (e?.message || "Server error"),
        debug: { name: e?.name, message: e?.message },
      },
      { status: 500 }
    );
  }
}
