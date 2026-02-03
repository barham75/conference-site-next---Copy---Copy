import { NextResponse } from "next/server";
import { callScript } from "@/lib/scriptClient";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const email = cookies().get("conf_email")?.value || "";
    if (!email) return NextResponse.json({ ok: false, error: "Not registered" }, { status: 401 });

    const body = await req.json();
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== 5) return NextResponse.json({ ok: false, error: "Need 5 answers" }, { status: 400 });

    const nums = answers.map((x: any) => Number(x));
    if (nums.some((n: number) => !Number.isFinite(n) || n < 1 || n > 5)) {
      return NextResponse.json({ ok: false, error: "Answers must be 1-5" }, { status: 400 });
    }

    const sum = nums.reduce((a: number, b: number) => a + b, 0); // max 25
    const score100 = Math.round((sum / 25) * 100);

    await callScript<{ ok: boolean }>({
      action: "evaluation_submit",
      email,
      answers: nums,
      score: score100,
    });

    return NextResponse.json({ ok: true, score: score100 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
