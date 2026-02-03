import { NextResponse } from "next/server";
import { callScript } from "@/lib/scriptClient";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const email = cookies().get("conf_email")?.value || "";
    if (!email) return NextResponse.json({ ok: false, error: "Not registered" }, { status: 401 });

    const body = await req.json();
    const posterId = String(body.posterId || "").trim();
    if (!posterId) return NextResponse.json({ ok: false, error: "posterId required" }, { status: 400 });

    await callScript<{ ok: boolean }>({
      action: "poster_vote",
      email,
      posterId,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
