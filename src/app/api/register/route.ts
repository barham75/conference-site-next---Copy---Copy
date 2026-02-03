import { NextResponse } from "next/server";
import { callScript } from "@/lib/scriptClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName || body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const org = String(body.org || body.organization || "").trim();

    if (!fullName) return NextResponse.json({ ok: false, error: "الاسم مطلوب" }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ ok: false, error: "بريد غير صحيح" }, { status: 400 });
    if (!org) return NextResponse.json({ ok: false, error: "اسم المؤسسة مطلوب" }, { status: 400 });

    const data = await callScript<{ ok: boolean; mode: "created" | "updated" }>({
      action: "register",
      fullName,
      email,
      org,
    });

    // نخزن بياناته في Cookies حتى يظهر Welcome بالاسم
    const res = NextResponse.json({ ok: true, mode: data.mode });

    res.cookies.set("conf_name", fullName, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("conf_email", email, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("conf_org", org, { httpOnly: true, sameSite: "lax", path: "/" });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
