import { NextResponse } from "next/server";
import { runCase } from "@/lib/runCase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { task?: string; worker?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  try {
    const result = await runCase(body.task ?? "", body.worker ?? "");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e).slice(0, 300) }, { status: 500 });
  }
}
