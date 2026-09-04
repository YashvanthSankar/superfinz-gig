export type CoachSpeechMode =
  | "English"
  | "Hindi"
  | "Hinglish"
  | "Tamil"
  | "Tanglish"
  | "Telugu"
  | "Telugu-English"
  | "Kannada"
  | "Kannada-English"
  | "Malayalam"
  | "Malayalam-English";

const latinPatterns: Array<{
  mode: CoachSpeechMode;
  pattern: RegExp;
}> = [
  {
    mode: "Hinglish",
    pattern:
      /\b(kya|hai|hain|mera|meri|mujhe|kitna|karu|karna|paisa|paise|bachao|aaj|kal|nahi|chahiye|sakta|sakthi|hoon)\b/gi,
  },
  {
    mode: "Tanglish",
    pattern:
      /\b(enna|epdi|eppadi|irukku|panam|selavu|pannanum|pannalam|venum|illa|romba|innikku|naalaikku|kaasu|mudiyuma)\b/gi,
  },
  {
    mode: "Telugu-English",
    pattern:
      /\b(enti|ela|undi|dabbu|kharchu|cheyyali|cheyali|ledu|nenu|ivala|repu|entha|kavali|avutunda)\b/gi,
  },
  {
    mode: "Kannada-English",
    pattern:
      /\b(enu|hegide|eshtu|hana|kharchu|madbeku|maadbeku|illa|nanu|ivattu|nale|beku|agutta)\b/gi,
  },
  {
    mode: "Malayalam-English",
    pattern:
      /\b(entha|engane|panam|chilavu|cheyyam|illa|njan|innu|nale|venam|pattumo)\b/gi,
  },
];

function profileMode(preferredLanguage: string): CoachSpeechMode | null {
  const language = preferredLanguage.toLowerCase();
  if (language.includes("hinglish")) return "Hinglish";
  if (language.includes("hindi")) return "Hinglish";
  if (language.includes("tanglish")) return "Tanglish";
  if (language.includes("tamil")) return "Tanglish";
  if (
    language.includes("tenglish") ||
    language.includes("teluglish") ||
    language.includes("telugu")
  )
    return "Telugu-English";
  if (language.includes("kanglish") || language.includes("kannada"))
    return "Kannada-English";
  if (language.includes("manglish") || language.includes("malayalam"))
    return "Malayalam-English";
  return null;
}

export function detectCoachSpeechMode(
  text: string,
  preferredLanguage = "English",
): CoachSpeechMode {
  if (/\p{Script=Devanagari}/u.test(text)) return "Hindi";
  if (/\p{Script=Tamil}/u.test(text)) return "Tamil";
  if (/\p{Script=Telugu}/u.test(text)) return "Telugu";
  if (/\p{Script=Kannada}/u.test(text)) return "Kannada";
  if (/\p{Script=Malayalam}/u.test(text)) return "Malayalam";

  let best: { mode: CoachSpeechMode; count: number } = {
    mode: "English",
    count: 0,
  };
  for (const candidate of latinPatterns) {
    const count = text.match(candidate.pattern)?.length ?? 0;
    if (count > best.count) best = { mode: candidate.mode, count };
  }
  if (best.count >= 2) return best.mode;

  // A saved profile preference must not turn a clearly English answer into a
  // different language. Use it only to disambiguate a short code-mixed phrase
  // that already contains a word from the same language family.
  const preferred = profileMode(preferredLanguage);
  if (best.count === 1 && preferred === best.mode) return preferred;
  return "English";
}

export function coachSpeechInstructions(mode: CoachSpeechMode) {
  const pronunciation =
    mode === "English"
      ? "Speak in clear, natural Indian English."
      : mode.includes("English") || mode.endsWith("glish")
        ? `The text is code-mixed ${mode} written in the Latin alphabet. Pronounce the Indian-language words naturally like a native speaker, and pronounce the English banking words naturally.`
        : `Speak the ${mode} text naturally like a native speaker.`;

  return [
    "Use a warm, calm Indian voice suitable for a listener with low digital confidence.",
    pronunciation,
    "Preserve the exact words, language, money amounts, and meaning. Do not translate, rewrite, add, or remove anything.",
    "Use a medium-slow conversational pace, with a short pause around rupee amounts and important warnings. Do not sound theatrical or like an advertisement.",
  ].join(" ");
}
