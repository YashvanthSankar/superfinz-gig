import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  GIG_WORK_TYPES,
  quickSetupAssistantRequestSchema,
  quickSetupSourceType,
  type GigWorkType,
  type QuickSetupAssistantResponse,
  type QuickSetupCommitment,
  type QuickSetupDraft,
  type QuickSetupStage,
} from "@superfinz/shared";
import { z } from "zod";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type AiStage = Exclude<QuickSetupStage, "PRIORITY" | "REVIEW">;
type JsonSchema = Record<string, unknown>;

const nullableString: JsonSchema = { type: ["string", "null"] };
const nullableNumber: JsonSchema = { type: ["number", "null"] };
const nullableInteger: JsonSchema = { type: ["integer", "null"] };

const baseSchema = (properties: JsonSchema, required: string[]): JsonSchema => ({
  type: "object",
  additionalProperties: false,
  properties: {
    ...properties,
    message: { type: "string" },
  },
  required: [...required, "message"],
});

const outputSchemas: Record<AiStage, JsonSchema> = {
  ABOUT: baseSchema(
    {
      preferredName: nullableString,
      city: nullableString,
      preferredLanguage: nullableString,
    },
    ["preferredName", "city", "preferredLanguage"],
  ),
  WORK: baseSchema(
    {
      workTypes: {
        type: "array",
        items: { type: "string", enum: [...GIG_WORK_TYPES] },
      },
      sourceName: nullableString,
      workDaysPerWeek: nullableInteger,
    },
    ["workTypes", "sourceName", "workDaysPerWeek"],
  ),
  INCOME: baseSchema(
    {
      lowWeekIncome: nullableNumber,
      typicalWeekIncome: nullableNumber,
      goodWeekIncome: nullableNumber,
      nextPayoutDate: nullableString,
    },
    [
      "lowWeekIncome",
      "typicalWeekIncome",
      "goodWeekIncome",
      "nextPayoutDate",
    ],
  ),
  COSTS: baseSchema(
    { weeklyWorkCosts: nullableNumber },
    ["weeklyWorkCosts"],
  ),
  MONEY: baseSchema(
    { openingBalance: nullableNumber, currentCushion: nullableNumber },
    ["openingBalance", "currentCushion"],
  ),
  BILLS: baseSchema(
    {
      skipped: { type: "boolean" },
      commitments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            amount: { type: "number" },
            dueDate: { type: "string" },
            recurrence: {
              type: "string",
              enum: [
                "WEEKLY",
                "FORTNIGHTLY",
                "MONTHLY",
                "QUARTERLY",
                "YEARLY",
                "ONE_TIME",
              ],
            },
            essential: { type: "boolean" },
          },
          required: ["title", "amount", "dueDate", "recurrence", "essential"],
        },
      },
    },
    ["skipped", "commitments"],
  ),
};

const aboutOutput = z.object({
  preferredName: z.string().trim().min(1).max(80).nullable(),
  city: z.string().trim().min(1).max(80).nullable(),
  preferredLanguage: z.string().trim().min(2).max(40).nullable(),
  message: z.string().trim().max(240),
});
const workOutput = z.object({
  workTypes: z.array(z.enum(GIG_WORK_TYPES)).max(GIG_WORK_TYPES.length),
  sourceName: z.string().trim().min(1).max(80).nullable(),
  workDaysPerWeek: z.number().int().min(1).max(7).nullable(),
  message: z.string().trim().max(240),
});
const incomeOutput = z.object({
  lowWeekIncome: z.number().nonnegative().max(100_000_000).nullable(),
  typicalWeekIncome: z.number().positive().max(100_000_000).nullable(),
  goodWeekIncome: z.number().nonnegative().max(100_000_000).nullable(),
  nextPayoutDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  message: z.string().trim().max(240),
});
const costsOutput = z.object({
  weeklyWorkCosts: z.number().nonnegative().max(100_000_000).nullable(),
  message: z.string().trim().max(240),
});
const moneyOutput = z.object({
  openingBalance: z.number().nonnegative().max(100_000_000).nullable(),
  currentCushion: z.number().nonnegative().max(100_000_000).nullable(),
  message: z.string().trim().max(240),
});
const billsOutput = z.object({
  skipped: z.boolean(),
  commitments: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        amount: z.number().positive().max(100_000_000),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        recurrence: z.enum([
          "WEEKLY",
          "FORTNIGHTLY",
          "MONTHLY",
          "QUARTERLY",
          "YEARLY",
          "ONE_TIME",
        ]),
        essential: z.boolean(),
      }),
    )
    .max(20),
  message: z.string().trim().max(240),
});

const stageInstructions: Record<AiStage, string> = {
  ABOUT:
    "Extract only the person's preferred first/display name, work city, and preferred language. Infer language from the language or script they use; if uncertain use English. Do not treat their job or app as their name.",
  WORK:
    "Map the work to one or more allowed workTypes. sourceName is the app, platform, client type, shop, or work source that pays them. Extract workDaysPerWeek only if stated. Never invent a platform name.",
  INCOME:
    "Amounts are weekly take-home income after fees. Preserve the user's slow/normal/good meaning. If they give only one weekly amount, put it in typicalWeekIncome and leave low/good null. Resolve relative payout dates from TODAY and return YYYY-MM-DD. Leave an unmentioned payout date null.",
  COSTS:
    "Extract the total weekly cost required to keep working. 'None', 'nothing', or equivalent means zero. Do not include household bills.",
  MONEY:
    "openingBalance is money available today. currentCushion is emergency money already kept aside. If emergency money is not mentioned, leave it null. Do not add the two values together.",
  BILLS:
    "Extract upcoming bills and subscriptions. Each needs a short title, positive amount, due date as YYYY-MM-DD, recurrence, and essential. Mark housing, utilities, education, medical needs, insurance, debt payments, and work-critical phone/data as essential=true. Mark OTT/streaming, gaming, entertainment, memberships, and extra subscriptions as essential=false. Follow the user's explicit essential/non-essential choice. If unclear, use essential=true so necessary money is not under-protected. Use MONTHLY when a normally monthly bill has no stated frequency; use ONE_TIME for a clearly one-off payment. If they say skip/no bills, set skipped true and commitments empty. Do not create incomplete bills.",
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function responseText(value: OpenAIResponse) {
  if (value.output_text?.trim()) return value.output_text.trim();
  return (
    value.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function stageParser(stage: AiStage) {
  if (stage === "ABOUT") return aboutOutput;
  if (stage === "WORK") return workOutput;
  if (stage === "INCOME") return incomeOutput;
  if (stage === "COSTS") return costsOutput;
  if (stage === "MONEY") return moneyOutput;
  return billsOutput;
}

function detectLanguage(answer: string) {
  if (/\p{Script=Devanagari}/u.test(answer)) return "Hindi";
  if (/\p{Script=Tamil}/u.test(answer)) return "Tamil";
  if (/\p{Script=Telugu}/u.test(answer)) return "Telugu";
  if (/\p{Script=Kannada}/u.test(answer)) return "Kannada";
  if (/\p{Script=Malayalam}/u.test(answer)) return "Malayalam";
  return "English";
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function numbersIn(answer: string) {
  const values: number[] = [];
  const expression = /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lac)?/gi;
  for (const match of answer.matchAll(expression)) {
    let value = Number(match[1]?.replaceAll(",", ""));
    const suffix = match[2]?.toLowerCase();
    if (suffix === "k" || suffix === "thousand") value *= 1_000;
    if (suffix === "lakh" || suffix === "lac") value *= 100_000;
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function fallbackDate(value: string) {
  const iso = value.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (iso) return iso;
  const match = value.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(20\d{2}))?/i,
  );
  if (!match) return null;
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const month = monthNames.indexOf(match[2]!.slice(0, 3).toLowerCase());
  let year = match[3] ? Number(match[3]) : new Date().getFullYear();
  let date = new Date(year, month, Number(match[1]), 12);
  if (!match[3] && date.getTime() < Date.now() - 86_400_000) {
    year += 1;
    date = new Date(year, month, Number(match[1]), 12);
  }
  return date.toISOString().slice(0, 10);
}

function fallbackBills(answer: string): QuickSetupCommitment[] {
  return answer
    .split(/[;\n]+/)
    .map((part) => {
      const dueDate = fallbackDate(part);
      const amounts = numbersIn(part).filter((value) => value > 31);
      const amount = amounts[0];
      const title = part
        .split(/(?:₹|rs\.?|inr)?\s*\d/i, 1)[0]
        ?.replace(/\b(?:my|bill|payment|due)\b/gi, "")
        .trim();
      if (!title || !amount || !dueDate) return null;
      const recurrence = /weekly|every week/i.test(part)
        ? "WEEKLY"
        : /fortnight|two weeks|2 weeks/i.test(part)
          ? "FORTNIGHTLY"
          : /quarter|3 months/i.test(part)
            ? "QUARTERLY"
            : /yearly|annual/i.test(part)
              ? "YEARLY"
              : /one.?time|once/i.test(part)
                ? "ONE_TIME"
                : "MONTHLY";
      const explicitlyOptional =
        /\b(?:non[- ]?essential|optional|can skip|not important|extra)\b/i.test(
          part,
        );
      const explicitlyEssential =
        /\b(?:essential|must pay|cannot skip|can't skip|important)\b/i.test(
          part,
        );
      const optionalCategory =
        /\b(?:netflix|prime|hotstar|disney|spotify|ott|streaming|gaming|game pass|youtube premium|entertainment|gym|membership|subscription)\b/i.test(
          part,
        );
      const essential = explicitlyOptional
        ? false
        : explicitlyEssential
          ? true
          : !optionalCategory;
      return {
        title: titleCase(title),
        amount,
        dueDate,
        recurrence,
        essential,
      };
    })
    .filter((item): item is QuickSetupCommitment => Boolean(item));
}

function fallbackExtract(stage: AiStage, answer: string): unknown {
  const lower = answer.toLowerCase();
  if (stage === "ABOUT") {
    const parts = answer
      .replace(/\b(?:call me|my name is|i am|i'm)\b/gi, "")
      .split(/,|\bfrom\b|\bin\b/i)
      .map((part) => part.trim())
      .filter(Boolean);
    return {
      preferredName: parts[0] ? titleCase(parts[0]) : null,
      city: parts[1] ? titleCase(parts[1]) : null,
      preferredLanguage: detectLanguage(answer),
      message: "Thanks. I’ve noted your name and city.",
    };
  }
  if (stage === "WORK") {
    const map: Array<[RegExp, GigWorkType]> = [
      [/deliver|zomato|swiggy|porter|dunzo/, "DELIVERY"],
      [/ride|driver|driving|uber|ola|rapido|taxi|auto/, "RIDE_HAILING"],
      [/plumb|electrician|repair|home service|urban company/, "HOME_SERVICES"],
      [/freelanc|design|develop|writer|client/, "FREELANCE"],
      [/vendor|stall|street|shop/, "STREET_VENDING"],
      [/daily wage|construction|labour|labor/, "DAILY_WAGE"],
      [/domestic|house work|maid|cleaning/, "DOMESTIC_WORK"],
    ];
    const workTypes = map
      .filter(([pattern]) => pattern.test(lower))
      .map(([, type]) => type);
    const days = lower.match(/([1-7])\s*days?/)?.[1];
    return {
      workTypes: workTypes.length ? [...new Set(workTypes)] : ["OTHER"],
      sourceName: null,
      workDaysPerWeek: days ? Number(days) : null,
      message: "I’ve noted your usual work pattern.",
    };
  }
  if (stage === "INCOME") {
    const amounts = numbersIn(answer).filter((value) => value > 50);
    return {
      lowWeekIncome: amounts.length >= 3 ? amounts[0] : null,
      typicalWeekIncome: amounts.length >= 3 ? amounts[1] : amounts[0] ?? null,
      goodWeekIncome: amounts.length >= 3 ? amounts[2] : null,
      nextPayoutDate: null,
      message: "I’ve noted your weekly take-home estimate.",
    };
  }
  if (stage === "COSTS") {
    const amount = /\b(no|none|nothing|zero)\b/i.test(answer)
      ? 0
      : numbersIn(answer)[0] ?? null;
    return {
      weeklyWorkCosts: amount,
      message: "I’ve noted what it costs to keep working each week.",
    };
  }
  if (stage === "MONEY") {
    const amounts = numbersIn(answer);
    return {
      openingBalance: amounts[0] ?? null,
      currentCushion: amounts[1] ?? null,
      message: "I’ve noted the money available today.",
    };
  }
  const skipped = /\b(skip|none|no bills?|later)\b/i.test(answer);
  const commitments = skipped ? [] : fallbackBills(answer);
  const essentialCount = commitments.filter((item) => item.essential).length;
  const optionalCount = commitments.length - essentialCount;
  return {
    skipped,
    commitments,
    message: skipped
      ? "You can add bills later from your plan."
      : `I’ve noted ${essentialCount} essential and ${optionalCount} non-essential payment${commitments.length === 1 ? "" : "s"}.`,
  };
}

function nextDate(days: number) {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function roundIncome(value: number) {
  return Math.max(0, Math.round(value / 50) * 50);
}

function safeMessage(value: string, fallback: string) {
  const plain = value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 180) || fallback;
}

function normalize(
  stage: AiStage,
  extracted: unknown,
): Omit<QuickSetupAssistantResponse, "source"> {
  if (stage === "ABOUT") {
    const value = aboutOutput.parse(extracted);
    if (!value.preferredName || !value.city)
      return {
        accepted: false,
        confirmation:
          "I need both details. Try saying: “Ravi, Chennai”.",
        patch: {},
        assumptions: [],
      };
    return {
      accepted: true,
      confirmation: safeMessage(
        value.message,
        `Nice to meet you, ${value.preferredName}.`,
      ),
      patch: {
        preferredName: value.preferredName,
        city: value.city,
        preferredLanguage: value.preferredLanguage ?? "English",
      },
      assumptions: [],
    };
  }
  if (stage === "WORK") {
    const value = workOutput.parse(extracted);
    if (!value.workTypes.length)
      return {
        accepted: false,
        confirmation:
          "I couldn’t catch the type of work. Try: “I do delivery work for Zomato, 6 days a week”.",
        patch: {},
        assumptions: [],
      };
    const workDays = value.workDaysPerWeek ?? 6;
    const sourceName =
      value.sourceName ??
      `${value.workTypes[0] === "OTHER" ? "Gig" : value.workTypes[0].toLowerCase().replaceAll("_", " ")} income`;
    const assumptions = [
      ...(value.workDaysPerWeek
        ? []
        : ["Work days start at 6 per week until you change them."]),
      ...(value.sourceName
        ? []
        : ["Your main income source uses a general work label for now."]),
    ];
    return {
      accepted: true,
      confirmation: safeMessage(
        value.message,
        "Got it. I’ve noted how you usually earn.",
      ),
      patch: {
        workTypes: value.workTypes,
        sourceName,
        sourceType: quickSetupSourceType(value.workTypes),
        workDaysPerWeek: workDays,
      },
      assumptions,
    };
  }
  if (stage === "INCOME") {
    const value = incomeOutput.parse(extracted);
    if (!value.typicalWeekIncome)
      return {
        accepted: false,
        confirmation:
          "I need at least your normal weekly take-home. Try: “Normally ₹6,000 a week”.",
        patch: {},
        assumptions: [],
      };
    const low =
      value.lowWeekIncome ?? roundIncome(value.typicalWeekIncome * 0.7);
    const good =
      value.goodWeekIncome ?? roundIncome(value.typicalWeekIncome * 1.3);
    if (low > value.typicalWeekIncome || good < value.typicalWeekIncome)
      return {
        accepted: false,
        confirmation:
          "Those amounts seem out of order. Please say the slow, normal and good week amounts again.",
        patch: {},
        assumptions: [],
      };
    const payoutDate = value.nextPayoutDate ?? nextDate(7);
    const assumptions = [
      ...(!value.lowWeekIncome || !value.goodWeekIncome
        ? ["Slow and good weeks are starter estimates around your normal week."]
        : []),
      ...(value.nextPayoutDate
        ? []
        : ["Your next payout starts as 7 days from today."]),
    ];
    return {
      accepted: true,
      confirmation: safeMessage(
        value.message,
        "Thanks. I’ll show future income as a range, not a promise.",
      ),
      patch: {
        lowWeekIncome: low,
        typicalWeekIncome: value.typicalWeekIncome,
        goodWeekIncome: good,
        nextPayoutDate: payoutDate,
      },
      assumptions,
    };
  }
  if (stage === "COSTS") {
    const value = costsOutput.parse(extracted);
    if (value.weeklyWorkCosts === null)
      return {
        accepted: false,
        confirmation:
          "I missed the weekly amount. Say a rough figure, or say “none”.",
        patch: {},
        assumptions: [],
      };
    return {
      accepted: true,
      confirmation: safeMessage(
        value.message,
        "I’ll protect that work money before showing free spending.",
      ),
      patch: { weeklyWorkCosts: value.weeklyWorkCosts },
      assumptions: [],
    };
  }
  if (stage === "MONEY") {
    const value = moneyOutput.parse(extracted);
    if (value.openingBalance === null)
      return {
        accepted: false,
        confirmation:
          "I need the amount available today. A rough figure is fine.",
        patch: {},
        assumptions: [],
      };
    return {
      accepted: true,
      confirmation: safeMessage(
        value.message,
        "Got it. This keeps your safe-to-spend amount honest.",
      ),
      patch: {
        openingBalance: value.openingBalance,
        currentCushion: value.currentCushion ?? 0,
      },
      assumptions: value.currentCushion === null
        ? ["Emergency savings start at ₹0 because none were mentioned."]
        : [],
    };
  }
  const value = billsOutput.parse(extracted);
  if (!value.skipped && !value.commitments.length)
    return {
      accepted: false,
      confirmation:
        "Please include the bill name, amount and due date, or choose “No bills to add”.",
      patch: {},
      assumptions: [],
    };
  const today = new Date(`${nextDate(0)}T00:00:00`).getTime();
  const hasPastBill = value.commitments.some(
    (item) => new Date(`${item.dueDate}T23:59:59`).getTime() < today,
  );
  if (hasPastBill)
    return {
      accepted: false,
      confirmation:
        "One due date has already passed. Please give the next due date.",
      patch: {},
      assumptions: [],
    };
  const essentialCount = value.commitments.filter(
    (item) => item.essential,
  ).length;
  const optionalCount = value.commitments.length - essentialCount;
  return {
    accepted: true,
    confirmation: value.skipped
      ? "No problem. You can add bills later from Money Plan."
      : `I’ve added ${essentialCount} essential and ${optionalCount} non-essential payment${value.commitments.length === 1 ? "" : "s"}.`,
    patch: { commitments: value.skipped ? [] : value.commitments },
    assumptions:
      optionalCount > 0
        ? ["Non-essential bills stay visible but do not reduce Safe to Spend."]
        : [],
  };
}

async function extractWithAi(
  stage: AiStage,
  answer: string,
  userId: string,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      model: process.env.OPENAI_ONBOARDING_MODEL ?? "gpt-4o-mini",
      store: false,
      max_output_tokens: 450,
      safety_identifier: createHash("sha256").update(userId).digest("hex"),
      instructions:
        `You extract one onboarding answer for SuperFinz, an Indian gig-worker money planner. ${stageInstructions[stage]} ` +
        "Never invent a user-provided fact. Use null or an empty array when it was not stated. Rupee amounts may use Indian shorthand such as 5k or 1 lakh. The message must be one warm, plain sentence confirming only what was understood, in the same language and script as the answer. No Markdown, asterisks, advice, promises, or questions unrelated to a missing field.",
      input: `TODAY: ${nextDate(0)}\nSTAGE: ${stage}\nUSER ANSWER: ${answer}`,
      text: {
        format: {
          type: "json_schema",
          name: `superfinz_${stage.toLowerCase()}_answer`,
          strict: true,
          schema: outputSchemas[stage],
        },
      },
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI extraction failed (${response.status})`);
  const text = responseText((await response.json()) as OpenAIResponse);
  if (!text) throw new Error("OpenAI returned an empty extraction");
  return stageParser(stage).parse(JSON.parse(text));
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.onboarded)
    return NextResponse.json(
      { error: "Your dashboard is already set up" },
      { status: 409 },
    );

  const parsed = quickSetupAssistantRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Send a short answer to continue" },
      { status: 400 },
    );

  const { stage, answer } = parsed.data;
  let extracted: unknown;
  let source: QuickSetupAssistantResponse["source"] = "safe-fallback";
  try {
    extracted = await extractWithAi(stage, answer, session.userId);
    if (extracted) source = "ai";
    else extracted = fallbackExtract(stage, answer);
  } catch (cause) {
    console.warn(
      "Onboarding extraction unavailable; safe fallback used.",
      cause instanceof Error ? cause.message : "Unknown error",
    );
    extracted = fallbackExtract(stage, answer);
  }

  try {
    const result = normalize(stage, extracted);
    return NextResponse.json({ ...result, source });
  } catch {
    return NextResponse.json({
      accepted: false,
      confirmation:
        "I couldn’t understand that clearly. Please try the short example shown below.",
      patch: {} satisfies QuickSetupDraft,
      assumptions: [],
      source,
    } satisfies QuickSetupAssistantResponse);
  }
}
