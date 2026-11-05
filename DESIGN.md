# Implemented design: Rels on the Wheel

## Overview

A free companion for streamers and Squeekchain spectators. The visual idea is a quiet night dojo where a tiny samurai follows a real hamster’s pace. Dark forest neutrals, cream character shapes, warm gold, a torii silhouette, and a restrained dot grid carry that identity. The resting scene is a primary state, not an empty state.

The landing page combines an action-led introduction and live scene, a compact data strip, three explanatory steps, a builder, and the prediction game. The transparent overlay is a separate static page. These are implemented in `src/main.ts`; illustration and articulated poses live in `src/scene.ts`.

## Colors

Canonical values are the hex tokens at the start of `src/style.css`. Use semantic roles for interface surfaces and text. The SVG illustration has its own fixed cream/orange/yellow palette.

| Token | Value | Role |
| --- | --- | --- |
| `--page` | `#111715` | Landing background |
| `--surface` | `#18211c` | Selectable options, overlay dark HUD |
| `--surface-raised` | `#202a23` | Disabled action surface |
| `--field` | `#111a15` | Inputs and selects |
| `--text` | `#f1efdf` | Primary text |
| `--muted` | `#a7b2a6` | Hints, secondary copy |
| `--line` | `#344036` | Structural dividers |
| `--accent` | `#edc56c` | Primary action, progress, brand illustration accents |
| `--accent-hover` | `#f6d488` | Hovered primary action |
| `--on-accent` | `#202219` | Text on gold |
| `--focus` | `#f6d488` | 2px focus perimeter with 4px offset |
| `--success` | `#a7c69d` | Connected indicator and game win text |
| `--warning` | `#ebae80` | Lost-signal indicator and counter-fault label |

The builder section uses `#151e18` to separate the task area without a floating card. The dojo background is `#1a2922`, with layered flat silhouettes. No gradients, blurred glows, or interface shadows are used.

Overlay theme tokens are scoped to `.overlay-widget[data-theme]`. Dark: `--hud-bg #18211c`, `--hud-text #f1efdf`, `--hud-muted #b7c0af`, `--hud-track #414c38`. Light: `#f0e8d2`, `#283024`, `#4e5945`, `#b3b59a`, respectively. Its progress fill becomes `#8b641c`, and its focus ring uses `#5b6352`. Light lost-signal values use `#5b6352`, corrected from a lower-contrast initial value. Themes affect the HUD only; the page background stays transparent and the mascot keeps its palette.

The review’s measured contrast evidence and its limits are in `artifacts/validation.md`. Do not assume overlay art has a known contrast against a streamer’s arbitrary video; the HUD uses an opaque background to keep its data readable.

## Typography

No font downloads. The system stack is `Arial, Helvetica, sans-serif`, with `Georgia, 'Times New Roman', serif` for the italic brand phrase and decorative dojo sign. `Courier New, monospace` is reserved for numeric data and the generated URL. The implementation uses normal 400 and bold 700; the serif accent uses its italic face.

The six source tokens are `--small .75rem` (12px), `--label .875rem` (14px), `--body 1rem` (16px), `--subhead 1.5rem` (24px), `--heading 2.5rem` (40px), and `--display 4rem` (64px). Mobile uses the 40px headline; desktop uses 64px. Section headings generally use 24px, while the game title uses 40px. H3 uses 16px. Numeric readouts use 24px with tabular numbers; HUD readouts use 14px.

Headline line-height is 1.03 desktop and 1.07 mobile; section headings use 1.15–1.3, body text 1.6, data labels 1.5, and descriptions up to 1.7. Display tracking is `-.055em`, section headings `-.025em` to `-.035em`; body text has natural tracking. Headings balance wrapping. Body descriptions have constrained measures; the hero description is at most 355px on desktop and 310px on a narrow phone. The URL input scrolls/selects its full value instead of deleting or abbreviating it. Editable fields remain 16px on mobile; the readonly URL also becomes 16px there.

## Layout

`.wrap` is the shared content edge: a maximum 1280px box with 48px inline padding, reduced to 32px at 1100px, 24px at 760px, and 20px at 480px. Common spacing is 8/12/16/20/24/32/40/48/64/80px. Section spacing is generous; within forms and data groups it is compact.

Desktop hero columns use `1fr 1.12fr`, with a 48px gap. The data strip spans both columns. The builder uses a 340px control column and flexible preview with a 64px gap; these become 300px/32px at 1100px. Below 760px both hero and builder stack. The builder uses a two-column arrangement for compatible controls at intermediate widths, then a single control column below 480px. The explanatory steps move from three columns to stacked rows below 480px. The game uses two columns on desktop, then one below 760px; its mascot sits beside streaks so reactions remain near the player.

At 390px, the name, headline, explanation, main “Build your overlay” action, watch link, and live character all appear on the first screen. At 320px there is no horizontal scrolling. Breakpoints at 1280, 1100, 760, 480, and 350px are implemented in `src/style.css`; the 350px adjustment only reduces the game companion and streak spacing. Rendered reflow was checked at 320/390/768/1440px. Native browser zoom and a full RTL-localized product were not verified.

The preview is a 16:9 sample stream, with a ResizeObserver scaling the actual overlay to a represented 1920px canvas. A standalone widget has a base 340px width, a 250px mascot slot, and content-sized HUD. Its four corners are physical stream coordinates, intentionally not RTL mirrored. The requested scale is reduced if necessary to preserve a 24px viewport inset. Overlay pages have transparent backgrounds and no document scrolling.

## Elevation & Depth

Depth comes from flat silhouette layers in the dojo and sample stream, not box shadows. One border encloses the hero scene; separators structure the HUD, OBS steps, and footer. Stream content is cropped by its frame, while the mascot’s SVG allows articulated limbs and streaks to extend inside that frame. Banners sit above the mascot, scene controls above the background, and the keyboard skip link above the page.

## Shapes

Use 4–5px radii for controls, 6px for the stream preview, and 8px for the live scene. The character’s large round helmet is the main soft shape. Selected guesses have a gold border and a filled radio indicator. Switches use a 36 × 20px track with a 12px thumb; the enclosing label provides the larger hit target. Progress bars are thin, rectangular, and separate from the surrounding text.

## Components

- **Buttons and links** (`src/style.css`, `.button`, `.primary`, `.text-link`): one gold primary action per task, neutral secondary links; explicit hover, active, disabled, and focus states. Press scale is .96 outside reduced motion. SVG arrow/copy icons follow text color.
- **Live scene** (`src/scene.ts`, `RelsScene` and `mascotSVG`; `src/main.ts`, `#hero-scene`): one original articulated SVG with eight interpolated run frames, separate sleeve lag, head, limbs, Kuni tail, seated legs, and curled dragon. Body squash/stretch does not slide the entire figure. States are waiting/search, running, standing idle, sleeping, counter fault, bow, slash, win, and lose. One global RAF clock updates all instances and stops when the tab is hidden. The landing has a pause control. Reduced motion freezes loops/parallax and uses a short opacity fade between static poses. Stale and lost signals resolve to the search pose before any core status; the fault pose needs a current, online reading.
- **Overlay ground** (`src/scene.ts`, `overlayGroundSVG`; `src/style.css`, `.overlay-ground`): two stroke-only tick layers in a 30px band at the foot of the 250px mascot slot, painted behind Rels, so the OBS canvas stays transparent. Far ticks are 7 units long with a 30-unit period (`#d9d3ad`); near ticks are 34 units with a 90-unit period (`#edc56c`). Each has a dark `#101e18` understroke to stay visible over bright video. They reuse the hero’s `ground-near`/`ground-far` transforms, so near moves three times as fast as far, both scaled by eased RPM. The band is hidden in the fault pose, where the “wheel hiccup” label occupies it.
- **HUD** (`src/main.ts`, `paintSignal`; `src/scene.ts`, `overlayMarkup`): exact BigInt formatting, known zero distinct from missing values, progress, work left, optimistic height, and independent settlement receipt. Signal loss keeps good values in grey. Status uses text as well as color.
- **Builder fields** (`src/main.ts`, `updateBuilder`; `src/options.ts`): native labeled input, select, range, checkbox switches, output, and readonly URL. Every control updates the same preview and encoded URL. Copy has a persistent success message or a selectable fallback.
- **Game** (`src/game.ts`; `src/main.ts`, `#game`): native fieldset, legend, radio inputs, lock button, pending/result text, streaks, and an in-view Rels companion. A locked guess disables alternatives. The result live region communicates the outcome without relying on motion. Storage is optional.
- **Block banner** (`src/scene.ts`, `.block-banner`): uppercase text is an explicit assignment requirement, confined to this event. Optional streamer names are inserted as plain text. Up to three celebrations are queued. Synthesized sound is optional and defaults off.

## Do’s and Don’ts

- Start a new landing section with `.wrap`, the existing heading scale, and shared spacing. Keep one named primary task and use native controls.
- Subscribe new readouts to the existing `statusPoller`; do not add another timer, iframe poller, or data endpoint.
- Keep the full community-project disclaimer in the footer, title, and share metadata. Keep projected and settled heights distinct.
- Preserve the cream helmet, orange visor, yellow dragon, black wide sleeves, and single left-hip katana. Animate individual joints; idle must not use a breathing bounce.
- Use `BigInt` for quantities; never supply fictional initial data or convert missing values to zero.
- Keep art local and inline. Do not add wallets, tracking, external fonts, or a backend to this static product.
- Keep motion opt-out, all statuses readable as text, and controls keyboard usable.

Design-review knowledge was adapted from Jakub Krehel’s Better Interface (MIT); documentation guidance was adapted from Paul Bakaus’s Impeccable (Apache-2.0). The pinned attribution and license texts are retained in `artifacts/THIRD_PARTY_NOTICES.txt`.

The preview’s overlay subtree is `inert`: it stays visually live while avoiding tiny duplicate receipt links in the keyboard order. Standalone overlay settlement links remain clickable. Progress bars update immediately to the first real value, and the mined caption only says “awaiting settlement” when projected height exceeds anchored height. Event banners stay within the widget bounds, including at maximum scale.
The sample stream frame has `role="img"` and a concise accessible label; its decorative scene is not a second interactive form.

The overlay uses the same full “Squeektoshi is resting · last run …” status as the hero, including an unknown last run for a session that has not observed ACTIVE.
