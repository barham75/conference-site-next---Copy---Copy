import { NextResponse } from "next/server";
import { callScript } from "@/lib/scriptClient";

export async function GET() {
  try {
    const data = await callScript<{ ok: boolean; results: { posterId: string; votes: number }[] }>({
      action: "poster_results",
    });
    return NextResponse.json({ ok: true, results: data.results || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
