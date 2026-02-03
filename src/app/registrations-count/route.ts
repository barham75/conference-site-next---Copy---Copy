import { NextResponse } from "next/server";
import { callScript } from "@/lib/scriptClient";

export async function GET() {
  try {
    const data = await callScript<{ ok: boolean; count: number }>({
      action: "registrations_count",
    });
    return NextResponse.json({ ok: true, count: data.count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
