# SuperFinz Design System

SuperFinz is a calm, high-contrast financial resilience dashboard for people with irregular income. It must make the next safe action obvious without hiding uncertainty.

## Product principles

- Lead with **safe to spend**, never total balance alone.
- Label settled money, expected income, and simulations separately.
- Keep credit subordinate to non-credit choices and full regulated disclosures.
- Use plain language, visible formulas, undoable user actions, and explicit confirmation for Smart Split.
- Never use contacts, messages, protected traits, dark patterns, fake urgency, or guaranteed financial outcomes.

## Visual direction

Cool, professional fintech: crisp neutral surfaces, deep navy structure, and a focused sapphire action color. Blue creates the brand, but most of each screen stays neutral so the interface never becomes a flat wall of blue. Green and red are reserved for meaningful success and error states, never used as brand decoration. No purple, competing green/red branding, gradients, neon colors, glass effects, neo-brutalism, excessive pills, or decorative chart clutter.

| Role         | Value     |
| ------------ | --------- |
| Paper        | `#F7F9FC` |
| Paper 2      | `#EEF3F8` |
| Surface      | `#FFFFFF` |
| Ink          | `#122033` |
| Ink soft     | `#46566C` |
| Brand navy   | `#102A43` |
| Action blue  | `#2563EB` |
| Accent soft  | `#EAF2FF` |
| Good         | `#087A55` |
| Good soft    | `#E2F3EB` |
| Warning      | `#8A6200` |
| Warning soft | `#FFF3D6` |
| Destructive  | `#B42318` |

Typography uses the repository's Geist Sans for both interface copy and clear display headings. Money uses tabular numerals.

## Components

- Cards: 1px neutral border, 20px rounded corners, and a soft low-elevation shadow.
- Buttons and touch targets: minimum 44px web and 48px native. Every icon-only action has an accessible label.
- Inputs: 16px or larger, persistent visible label, 2px ink border, high-contrast focus ring, inline validation.
- Status: communicate with text and icon as well as color.
- Loading, empty, success, and retryable error states are required for every data surface.
- Motion is limited to feedback and must respect reduced-motion preferences.

## Responsive rules

- Mobile: one-column task flow, 5-item bottom navigation, safe-area padding, primary action reachable by thumb.
- Desktop: persistent 240px sidebar and content width capped near 1152px.
- No horizontal page scrolling at 320px. Cards and forms stack before labels or currency values collide.

## Accessibility checklist

- Semantic headings, landmarks, labels, progress values, and live regions.
- Keyboard-visible focus and logical tab order.
- Zoom is not disabled.
- Body copy is at least 16px where users read or enter financial information.
- Do not rely on hover, color, or motion alone.
