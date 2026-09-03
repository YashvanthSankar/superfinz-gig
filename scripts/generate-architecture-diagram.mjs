import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const OUTPUT = resolve("docs/architecture/superfinz-full-architecture.excalidraw");
const SVG_OUTPUT = resolve("docs/architecture/superfinz-full-architecture.svg");
const LOGO_INPUT = resolve("public/superfinz-mark.webp");
const LOGO_FILE_ID = "superfinz-architecture-logo";
const WIDTH = 1920;
const HEIGHT = 1240;
const NOW = 1788466200000;
const logoDataUrl = `data:image/webp;base64,${(await readFile(LOGO_INPUT)).toString("base64")}`;

const palette = {
  canvas: "#f8fafc",
  ink: "#0f172a",
  body: "#475569",
  muted: "#64748b",
  blue: "#1d4ed8",
  blueBright: "#2563eb",
  blueDark: "#102a43",
  blueLine: "#93c5fd",
  bluePale: "#eff6ff",
  blueSoft: "#dbeafe",
  ice: "#f0f9ff",
  white: "#ffffff",
  amber: "#f59e0b",
  amberPale: "#fef3c7",
  slatePale: "#f1f5f9",
  slateLine: "#cbd5e1",
};

let counter = 0;
const frames = [];
const connectors = [];
const shapes = [];
const labels = [];

function id(prefix) {
  counter += 1;
  return `${prefix}-${String(counter).padStart(3, "0")}`;
}

function base(type, elementId, x, y, width, height, options = {}) {
  const order = counter + 1;
  return {
    id: elementId,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: options.strokeColor ?? palette.ink,
    backgroundColor: options.backgroundColor ?? "transparent",
    fillStyle: "solid",
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: options.strokeStyle ?? "solid",
    roughness: options.roughness ?? 0,
    opacity: options.opacity ?? 100,
    groupIds: options.groupIds ?? [],
    frameId: null,
    index: `a${String(order).padStart(3, "0")}`,
    roundness: options.roundness ?? { type: 3 },
    seed: 1009 + order * 7919,
    version: 1,
    versionNonce: 4001 + order * 3571,
    isDeleted: false,
    boundElements: null,
    updated: NOW,
    link: null,
    locked: false,
  };
}

function rect(target, x, y, width, height, options = {}) {
  const elementId = options.id ?? id("rect");
  const element = base("rectangle", elementId, x, y, width, height, options);
  target.push(element);
  return elementId;
}

function ellipse(target, x, y, width, height, options = {}) {
  const elementId = options.id ?? id("ellipse");
  const element = {
    ...base("ellipse", elementId, x, y, width, height, {
      ...options,
      roundness: null,
    }),
  };
  target.push(element);
  return elementId;
}

function imageElement(target, x, y, width, height, fileId) {
  const elementId = id("image");
  target.push({
    ...base("image", elementId, x, y, width, height, {
      strokeColor: "transparent",
      backgroundColor: "transparent",
      strokeWidth: 0,
      roughness: 0,
      roundness: null,
    }),
    fileId,
    status: "saved",
    scale: [1, 1],
    crop: null,
  });
}

function text(target, value, x, y, width, fontSize, options = {}) {
  const elementId = options.id ?? id("text");
  const lineHeight = options.lineHeight ?? 1.25;
  const lines = value.split("\n").length;
  const height = Math.ceil(lines * fontSize * lineHeight);
  target.push({
    ...base("text", elementId, x, y, width, height, {
      strokeColor: options.color ?? palette.ink,
      backgroundColor: "transparent",
      strokeWidth: 1,
      roughness: 0,
      roundness: null,
    }),
    text: value,
    fontSize,
    fontFamily: 2,
    textAlign: options.align ?? "left",
    verticalAlign: "top",
    containerId: null,
    originalText: value,
    autoResize: false,
    lineHeight,
  });
  return elementId;
}

function arrow(points, options = {}) {
  const elementId = options.id ?? id("arrow");
  const minX = Math.min(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxX = Math.max(...points.map(([x]) => x));
  const maxY = Math.max(...points.map(([, y]) => y));
  connectors.push({
    ...base("arrow", elementId, minX, minY, maxX - minX, maxY - minY, {
      strokeColor: options.color ?? palette.blue,
      backgroundColor: "transparent",
      strokeWidth: options.strokeWidth ?? 2,
      strokeStyle: options.dashed ? "dashed" : "solid",
      roughness: 0,
      roundness: { type: 2 },
    }),
    points: points.map(([x, y]) => [x - minX, y - minY]),
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: options.both ? "arrow" : null,
    endArrowhead: "arrow",
    elbowed: false,
  });
  if (options.label) {
    const [a, b] = [points[0], points[points.length - 1]];
    const labelX = options.labelX ?? (a[0] + b[0]) / 2 - 60;
    const labelY = options.labelY ?? (a[1] + b[1]) / 2 - 13;
    rect(shapes, labelX - 6, labelY - 3, 132, 26, {
      strokeColor: palette.blueLine,
      backgroundColor: palette.white,
      strokeWidth: 1,
    });
    text(labels, options.label, labelX, labelY, 120, 12, {
      color: palette.blue,
      align: "center",
      lineHeight: 1,
    });
  }
}

function frame(title, subtitle, x, y, width, height, options = {}) {
  rect(frames, x, y, width, height, {
    strokeColor: options.strokeColor ?? palette.slateLine,
    backgroundColor: options.backgroundColor ?? palette.white,
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: options.dashed ? "dashed" : "solid",
    opacity: options.opacity ?? 100,
  });
  text(labels, title, x + 24, y + 18, width - 48, 17, {
    color: options.titleColor ?? palette.blueDark,
  });
  if (subtitle) {
    text(labels, subtitle, x + 24, y + 45, width - 48, 12, {
      color: palette.muted,
    });
  }
}

function card({
  x,
  y,
  width,
  height,
  title,
  body,
  fill,
  stroke,
  dashed = false,
  badge,
  titleColor = palette.ink,
  bodyColor = palette.body,
}) {
  rect(shapes, x, y, width, height, {
    strokeColor: stroke ?? palette.blueLine,
    backgroundColor: fill ?? palette.white,
    strokeWidth: 2,
    strokeStyle: dashed ? "dashed" : "solid",
  });
  text(labels, title, x + 18, y + 16, width - 36, 18, {
    color: titleColor,
    lineHeight: 1.15,
  });
  text(labels, body, x + 18, y + 48, width - 36, 13, {
    color: bodyColor,
    lineHeight: 1.35,
  });
  if (badge) {
    const badgeWidth = badge.length * 7 + 22;
    rect(shapes, x + width - badgeWidth - 14, y + 12, badgeWidth, 25, {
      strokeColor: badge === "FUTURE" ? palette.amber : palette.blueLine,
      backgroundColor: badge === "FUTURE" ? palette.amberPale : palette.bluePale,
      strokeWidth: 1,
    });
    text(labels, badge, x + width - badgeWidth - 10, y + 18, badgeWidth - 8, 10, {
      color: badge === "FUTURE" ? "#92400e" : palette.blue,
      align: "center",
      lineHeight: 1,
    });
  }
}

// Header and legend.
rect(shapes, 52, 42, 58, 58, {
  strokeColor: palette.blueLine,
  backgroundColor: palette.bluePale,
  strokeWidth: 1,
});
imageElement(shapes, 56, 46, 50, 50, LOGO_FILE_ID);
text(labels, "SuperFinz — Full Product Architecture", 132, 38, 1060, 38, {
  color: palette.ink,
  lineHeight: 1.1,
});
text(
  labels,
  "A salary-like money layer for people whose income is not salary-like",
  132,
  84,
  950,
  17,
  { color: palette.body },
);
rect(shapes, 1450, 40, 410, 66, {
  strokeColor: palette.slateLine,
  backgroundColor: palette.white,
  strokeWidth: 1,
});
text(labels, "SOLID  Implemented today", 1470, 57, 180, 12, { color: palette.blue });
text(labels, "DASHED  Planned integration", 1660, 57, 180, 12, { color: "#92400e" });
text(labels, "Security rule: secrets and raw database access stay server-side", 1470, 79, 370, 11, {
  color: palette.muted,
});

// Primary architecture frames.
frame("1  EXPERIENCE LAYER", "Simple, accessible surfaces for low digital confidence", 40, 140, 320, 660, {
  backgroundColor: palette.white,
  strokeColor: palette.slateLine,
});
frame(
  "2  VERCEL + NEXT.JS SERVER TRUST BOUNDARY",
  "Authenticated orchestration, deterministic decisions, and server-only secrets",
  390,
  140,
  1020,
  660,
  { backgroundColor: palette.bluePale, strokeColor: palette.blueLine },
);
frame("3  MANAGED SERVICES + PARTNERS", "External services receive only bounded, purpose-specific data", 1440, 140, 440, 660, {
  backgroundColor: palette.white,
  strokeColor: palette.slateLine,
});

// Connectors are declared before cards so they render behind the nodes.
arrow([[330, 287], [430, 287]], { label: "React / RSC", labelX: 319, labelY: 247 });
arrow([[330, 435], [385, 435], [385, 442], [430, 442]], { label: "HTTPS JSON", labelX: 320, labelY: 397 });
arrow([[330, 565], [385, 565], [385, 472], [430, 472]]);
arrow([[330, 700], [380, 700], [380, 492], [430, 492]], { dashed: true });
arrow([[570, 345], [570, 390]], { label: "actions", labelX: 510, labelY: 353 });
arrow([[570, 510], [570, 560]], { label: "auth guard", labelX: 510, labelY: 520 });
arrow([[710, 445], [765, 345]]);
arrow([[710, 470], [735, 470], [735, 560], [765, 560]]);
arrow([[1065, 345], [1120, 287]]);
arrow([[1065, 560], [1420, 560], [1420, 355], [1750, 355], [1750, 340]], {
  dashed: true,
  label: "bounded plan context",
  labelX: 1190,
  labelY: 522,
});
arrow([[710, 635], [1085, 635], [1085, 330], [1120, 330]], {
  label: "session ownership",
  labelX: 850,
  labelY: 625,
});
arrow([[710, 665], [730, 665], [730, 775], [1385, 775], [1385, 287], [1470, 287]], {
  label: "OAuth verification",
  labelX: 1100,
  labelY: 752,
});
arrow([[1370, 287], [1420, 287], [1420, 490], [1470, 490]], {
  label: "server key only",
  labelX: 1360,
  labelY: 361,
});
arrow([[1370, 447], [1425, 447], [1425, 700], [1470, 700]], {
  label: "privacy-safe outcomes",
  labelX: 1190,
  labelY: 720,
});
arrow([[1370, 475], [1420, 475], [1420, 535], [1470, 535]]);
arrow([[710, 498], [730, 498], [730, 785], [1435, 785], [1435, 725], [1470, 725]], {
  both: true,
  dashed: true,
});

// Experience layer.
card({
  x: 70,
  y: 230,
  width: 260,
  height: 115,
  title: "Next.js Web",
  body: "Landing + public demo\nOnboarding + dashboard",
  fill: palette.blueSoft,
  stroke: palette.blue,
  badge: "LIVE",
});
card({
  x: 70,
  y: 385,
  width: 120,
  height: 100,
  title: "iOS",
  body: "Expo 57\nReact Native",
  fill: palette.ice,
  stroke: palette.blueLine,
});
card({
  x: 210,
  y: 385,
  width: 120,
  height: 100,
  title: "Android",
  body: "Expo 57\nReact Native",
  fill: palette.ice,
  stroke: palette.blueLine,
});
card({
  x: 70,
  y: 520,
  width: 260,
  height: 90,
  title: "Worker input",
  body: "Payouts · UPI · bank · cash\nBills · fuel · work costs",
  fill: palette.white,
  stroke: palette.slateLine,
});
card({
  x: 70,
  y: 650,
  width: 260,
  height: 100,
  title: "Consented data feeds",
  body: "Account Aggregator\nDirect platform payout feeds",
  fill: palette.amberPale,
  stroke: palette.amber,
  dashed: true,
  badge: "FUTURE",
});

// Server-side application layer.
card({
  x: 430,
  y: 230,
  width: 280,
  height: 115,
  title: "Product presentation",
  body: "Server Components + React UI\nToday · Money · Plan\nSafety · Coach",
  fill: palette.white,
  stroke: palette.blueLine,
});
card({
  x: 430,
  y: 390,
  width: 280,
  height: 120,
  title: "Authenticated API routes",
  body: "Onboarding · ledger · sources\nCommitments · payout split\nScenarios · outcomes",
  fill: palette.white,
  stroke: palette.blue,
  badge: "LIVE",
});
card({
  x: 430,
  y: 560,
  width: 280,
  height: 145,
  title: "Identity + session guard",
  body: "Web: NextAuth JWT cookie\nNative: 15m access JWT\nRotating 30d refresh token\nSecureStore on device",
  fill: palette.slatePale,
  stroke: palette.slateLine,
});

card({
  x: 765,
  y: 230,
  width: 300,
  height: 225,
  title: "Shared decision engine",
  body: "TypeScript + Zod\n\nSafe-to-spend horizon\nAdaptive payout protection\nForecast + true net income\nShock scenarios + resilience\nNon-credit-first next action",
  fill: palette.blueDark,
  stroke: palette.blueDark,
  badge: "CORE",
  titleColor: palette.white,
  bodyColor: "#dbeafe",
});
card({
  x: 765,
  y: 500,
  width: 300,
  height: 120,
  title: "Plan-grounded Coach",
  body: "Verified figures first\nPlain-language guidance\nOpenAI optional; fallback always",
  fill: palette.white,
  stroke: palette.blueLine,
});
card({
  x: 765,
  y: 655,
  width: 300,
  height: 100,
  title: "Shared contracts",
  body: "One schema across web, iOS,\nAndroid, API, and automated tests",
  fill: palette.white,
  stroke: palette.slateLine,
});

card({
  x: 1120,
  y: 230,
  width: 250,
  height: 110,
  title: "Convex server adapter",
  body: "Server-only access\nQueries + mutations\nKey never ships",
  fill: palette.white,
  stroke: palette.blue,
});
card({
  x: 1120,
  y: 395,
  width: 250,
  height: 105,
  title: "Outcome + partner API",
  body: "Useful action events\nCohort-level metrics only",
  fill: palette.white,
  stroke: palette.blueLine,
});
card({
  x: 1120,
  y: 555,
  width: 250,
  height: 150,
  title: "Server safeguards",
  body: "Ownership checks\nZod validation + rate limits\nNo public DB credentials\nNo contact/message access",
  fill: palette.slatePale,
  stroke: palette.slateLine,
});

// Managed services and future partners.
card({
  x: 1470,
  y: 230,
  width: 160,
  height: 110,
  title: "Google OAuth",
  body: "Web + native\nidentity verification",
  fill: palette.white,
  stroke: palette.blueLine,
});
card({
  x: 1660,
  y: 230,
  width: 180,
  height: 110,
  title: "OpenAI Responses",
  body: "Optional explanation\nNo database access",
  fill: palette.white,
  stroke: palette.blueLine,
});
card({
  x: 1470,
  y: 395,
  width: 370,
  height: 210,
  title: "Convex database",
  body: "Users + sessions\nGig profiles + sources\nLedger + commitments\nProtected pockets + rules\nPreferences + outcomes\n\nPer-user ownership enforced",
  fill: palette.blueSoft,
  stroke: palette.blue,
  badge: "LIVE",
});
card({
  x: 1470,
  y: 650,
  width: 370,
  height: 100,
  title: "Banks · platforms · cooperatives",
  body: "Embedded distribution\nConsented feeds + benefits\nCohort reporting",
  fill: palette.amberPale,
  stroke: palette.amber,
  dashed: true,
  badge: "FUTURE",
});

// Closed product decision loop.
frame(
  "4  THE CLOSED RESILIENCE LOOP",
  "Every saved change recalculates the same plan; AI never invents the financial result",
  40,
  835,
  1840,
  355,
  { backgroundColor: palette.white, strokeColor: palette.slateLine },
);

const loopCards = [
  [70, "1  Observe", "Settled income\ncash + work costs"],
  [320, "2  Protect", "Bills · earning costs\n+ safety cushion"],
  [570, "3  Calculate", "Safe to spend\nuntil next payout"],
  [820, "4  Prepare", "Adaptive split\n+ shock scenarios"],
  [1070, "5  Explain", "One next action\n+ grounded coach"],
  [1320, "6  Confirm", "Worker reviews\nand approves"],
  [1570, "7  Learn", "Outcome events\n+ cohort metrics"],
];

for (const [x, titleValue, body] of loopCards) {
  card({
    x,
    y: 930,
    width: 220,
    height: 125,
    title: titleValue,
    body,
    fill: titleValue.startsWith("3") ? palette.blueSoft : palette.white,
    stroke: titleValue.startsWith("3") ? palette.blue : palette.blueLine,
  });
}

for (let index = 0; index < loopCards.length - 1; index += 1) {
  const startX = loopCards[index][0] + 220;
  const endX = loopCards[index + 1][0];
  arrow([[startX + 4, 992], [endX - 4, 992]], { strokeWidth: 3 });
}
arrow([[1680, 1055], [1680, 1100], [180, 1100], [180, 1055]], {
  color: palette.blue,
  strokeWidth: 2,
  label: "next payout / new event",
  labelX: 850,
  labelY: 1087,
});
rect(shapes, 70, 1135, 1740, 37, {
  strokeColor: palette.blueLine,
  backgroundColor: palette.bluePale,
  strokeWidth: 1,
});
text(
  labels,
  "SAFETY INVARIANTS   Pending income is never spendable  •  Every amount is explainable  •  User confirms every split  •  Credit comes after non-credit actions",
  88,
  1145,
  1704,
  12,
  { color: palette.blueDark, align: "center", lineHeight: 1 },
);

const elements = [...frames, ...connectors, ...shapes, ...labels];

const scene = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: {
    gridSize: 20,
    gridStep: 5,
    gridModeEnabled: false,
    viewBackgroundColor: palette.canvas,
    currentItemStrokeColor: palette.ink,
    currentItemBackgroundColor: "transparent",
    currentItemFillStyle: "solid",
    currentItemStrokeWidth: 2,
    currentItemStrokeStyle: "solid",
    currentItemRoughness: 0,
    currentItemOpacity: 100,
    currentItemFontFamily: 2,
    currentItemFontSize: 20,
    currentItemTextAlign: "left",
    currentItemStartArrowhead: null,
    currentItemEndArrowhead: "arrow",
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 0.6 },
  },
  files: {
    [LOGO_FILE_ID]: {
      mimeType: "image/webp",
      id: LOGO_FILE_ID,
      dataURL: logoDataUrl,
      created: NOW,
      lastRetrieved: NOW,
    },
  },
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgText(element) {
  const anchor = element.textAlign === "center" ? "middle" : "start";
  const baseX = element.textAlign === "center" ? element.x + element.width / 2 : element.x;
  const lineHeight = element.fontSize * element.lineHeight;
  const lines = element.text
    .split("\n")
    .map(
      (line, index) =>
        `<text x="${baseX}" y="${element.y + element.fontSize + index * lineHeight}" fill="${element.strokeColor}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${element.fontSize}" font-weight="${element.fontSize >= 17 ? 700 : 500}" text-anchor="${anchor}">${escapeXml(line || " ")}</text>`,
    )
    .join("");
  return lines;
}

function svgShape(element) {
  if (element.type === "rectangle") {
    const dash = element.strokeStyle === "dashed" ? ' stroke-dasharray="9 7"' : "";
    return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="18" fill="${element.backgroundColor}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity / 100}"${dash}/>`;
  }
  if (element.type === "ellipse") {
    return `<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" fill="${element.backgroundColor}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}"/>`;
  }
  if (element.type === "arrow") {
    const points = element.points
      .map(([x, y]) => `${x + element.x},${y + element.y}`)
      .join(" ");
    const dash = element.strokeStyle === "dashed" ? ' stroke-dasharray="9 7"' : "";
    const start = element.startArrowhead ? ' marker-start="url(#arrow-start)"' : "";
    return `<polyline points="${points}" fill="none" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"${start}${dash}/>`;
  }
  if (element.type === "image") {
    return `<image href="${logoDataUrl}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return "";
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.blue}"/></marker>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 10 0 L 0 5 L 10 10 z" fill="${palette.blue}"/></marker>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.08"/></filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.canvas}"/>
  <g filter="url(#shadow)">${frames.map(svgShape).join("")}</g>
  <g>${connectors.map(svgShape).join("")}</g>
  <g filter="url(#shadow)">${shapes.map(svgShape).join("")}</g>
  <g>${labels.map(svgText).join("")}</g>
</svg>`;

await mkdir(dirname(OUTPUT), { recursive: true });
await Promise.all([
  writeFile(OUTPUT, `${JSON.stringify(scene, null, 2)}\n`, "utf8"),
  writeFile(SVG_OUTPUT, `${svg}\n`, "utf8"),
]);

console.log(`Wrote ${OUTPUT}`);
console.log(`Wrote ${SVG_OUTPUT}`);
