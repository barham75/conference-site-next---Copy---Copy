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

    const res = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        fullName,
        email,
        org,
        secret: process.env.GOOGLE_SCRIPT_SECRET,
      }),
    });

    // ⚠️ لا تعتمد على res.ok
    const data = await res.json();

    // ✅ التحقق الصحيح
    if (!data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || "Unauthorized" },
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
