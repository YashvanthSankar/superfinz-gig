import assert from "node:assert/strict";
import test from "node:test";
import {
  coachSpeechInstructions,
  detectCoachSpeechMode,
} from "./coach-speech";

test("detects Romanized Hindi as Hinglish", () => {
  assert.equal(
    detectCoachSpeechMode(
      "Kya main aaj 500 rupees spend kar sakta hoon?",
      "English",
    ),
    "Hinglish",
  );
});

test("detects Romanized Tamil as Tanglish", () => {
  assert.equal(
    detectCoachSpeechMode("Enna amount safe ah spend pannalam?", "English"),
    "Tanglish",
  );
});

test("detects Romanized Telugu as Telugu-English", () => {
  assert.equal(
    detectCoachSpeechMode(
      "Nenu ivala entha dabbu spend cheyyali?",
      "English",
    ),
    "Telugu-English",
  );
});

test("keeps an English reply in English regardless of profile preference", () => {
  assert.equal(detectCoachSpeechMode("₹500 is safe today.", "Hindi"), "English");
  assert.equal(detectCoachSpeechMode("₹500 is safe today.", "Tamil"), "English");
});

test("recognizes a Romanized Hindi coach reply", () => {
  assert.equal(
    detectCoachSpeechMode(
      "Aap abhi ₹500 kharch kar sakte hain aur baaki paisa bacha sakte hain.",
      "English",
    ),
    "Hinglish",
  );
});

test("uses profile preference only for an ambiguous matching phrase", () => {
  assert.equal(detectCoachSpeechMode("₹500 panam is safe.", "Tamil"), "Tanglish");
});

test("native script takes priority over the profile preference", () => {
  assert.equal(detectCoachSpeechMode("இன்று ₹500 செலவு செய்யலாம்.", "English"), "Tamil");
});

test("speech prompt protects the original wording", () => {
  const prompt = coachSpeechInstructions("Hinglish");
  assert.match(prompt, /Pronounce the Indian-language words naturally/);
  assert.match(prompt, /Do not translate/);
  assert.match(prompt, /rupee amounts/);
});
