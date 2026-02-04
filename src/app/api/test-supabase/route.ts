export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supa = getSupabaseAdmin();

  if (!supa.ok || !supa.client) {
    return NextResponse.json(
      { ok: false, error: supa.error },
      { status: 500 }
    );
  }

  // غيّر اسم الجدول إذا مختلف عندك
  const { count, error } = await supa.client
    .from("registrations")
    .select("*", { head: true, count: "exact" });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: count ?? 0 });
}
