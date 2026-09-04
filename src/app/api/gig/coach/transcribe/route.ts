import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/aac",
  "audio/m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "application/octet-stream",
]);

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Voice questions are not configured yet" },
      { status: 503 },
    );

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size < 256)
    return NextResponse.json(
      { error: "Record a short question first" },
      { status: 400 },
    );
  if (audio.size > MAX_AUDIO_BYTES)
    return NextResponse.json(
      { error: "Keep the voice question under 30 seconds" },
      { status: 413 },
    );
  const audioType = audio.type.split(";", 1)[0]?.toLowerCase() ?? "";
  if (audioType && !SUPPORTED_AUDIO_TYPES.has(audioType))
    return NextResponse.json(
      { error: "This audio format is not supported" },
      { status: 415 },
    );

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, audio.name || "question.m4a");
  upstreamForm.append(
    "model",
    process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe",
  );
  upstreamForm.append(
    "prompt",
    "A short onboarding answer or money-planning question from an Indian gig worker. Preserve the spoken language and code-switching. Terms may include rupees, UPI, payout, EMI, petrol, rent, bills, Zomato, Swiggy, Uber, Ola, Rapido, and SuperFinz.",
  );

  try {
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstreamForm,
        signal: AbortSignal.timeout(25_000),
      },
    );
    if (!response.ok) {
      console.warn("Voice transcription unavailable.", response.status);
      return NextResponse.json(
        { error: "Couldn’t understand that recording. Please try again." },
        { status: 502 },
      );
    }
    const result = (await response.json()) as { text?: string };
    const transcript = result.text?.trim().slice(0, 500) ?? "";
    if (!transcript)
      return NextResponse.json(
        { error: "No speech was heard. Please try again." },
        { status: 422 },
      );
    return NextResponse.json({ transcript });
  } catch (cause) {
    console.warn(
      "Voice transcription failed.",
      cause instanceof Error ? cause.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Voice service is taking too long. Please try again." },
      { status: 504 },
    );
  }
}
