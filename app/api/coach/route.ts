// POST /api/coach (owner: D)
// Request: { message: string }
// Response: { reply: string, tasks?: FlexTask[], flags?: LoadFlag[] }
import { NextResponse } from "next/server";
import { coach } from "@/lib/ai/coach";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ reply: "Please type a message for the coach." }, { status: 400 });
  }

  return NextResponse.json(await coach(message));
}
