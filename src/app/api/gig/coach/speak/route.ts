import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  coachSpeechInstructions,
  detectCoachSpeechMode,
} from "@/lib/coach-speech";
import { getGigBundle } from "@/lib/gig-store";

const schema = z.object({ text: z.string().trim().min(1).max(1_600) });

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "That answer is too long to read aloud" },
      { status: 400 },
    );

  const bundle = await getGigBundle(session.userId);
  if (!bundle)
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 409 },
    );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Natural voice is temporarily unavailable" },
      { status: 503 },
    );

  const mode = detectCoachSpeechMode(
    parsed.data.text,
    bundle.profile.preferredLanguage,
  );

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE ?? "cedar",
        input: parsed.data.text,
        instructions: coachSpeechInstructions(mode),
        response_format: "mp3",
      }),
    });

    if (!response.ok || !response.body) {
      console.warn("OpenAI speech request failed.", response.status);
      return NextResponse.json(
        { error: "Natural voice is temporarily unavailable" },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-SuperFinz-Speech-Mode": mode,
      },
    });
  } catch (cause) {
    console.warn(
      "OpenAI speech unavailable.",
      cause instanceof Error ? cause.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Natural voice is temporarily unavailable" },
      { status: 502 },
    );
  }
}
