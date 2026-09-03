# SuperFinz Design System

SuperFinz is a calm, high-contrast financial resilience dashboard for people with irregular income. It must make the next safe action obvious without hiding uncertainty.

## Product principles

- Lead with **safe to spend**, never total balance alone.
- Label settled money, expected income, and simulations separately.
- Keep credit subordinate to non-credit choices and full regulated disclosures.
- Use plain language, visible formulas, undoable user actions, and explicit confirmation for Smart Split.
- Never use contacts, messages, protected traits, dark patterns, fake urgency, or guaranteed financial outcomes.

## Visual direction

Warm neo-brutalism: cream paper, black structure, orange action color, green confirmation, mustard warning, and red only for destructive/error states. No gradients, glass effects, generic banking blue, excessive pills, or decorative chart clutter.

| Role | Value |
| --- | --- |
| Paper | `#F5F0E4` |
| Paper 2 | `#EDE6D3` |
| Ink | `#1A1612` |
| Ink soft | `#3A322A` |
| Accent | `#FF5A1F` |
| Accent soft | `#FFE0CC` |
| Good | `#0A6B3B` |
| Good soft | `#D6EADD` |
| Warning | `#B8860B` |
| Warning soft | `#F4E4BC` |
| Destructive | `#C4281B` |

Typography uses the repository's Geist Sans for interface copy and Gatwick/Georgia for editorial display headings. Money uses tabular numerals.

## Components

- Cards: 2px ink border, hard 2–6px shadow, square corners.
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
