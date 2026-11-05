# Worker validation and design review

Date: 2026-11-05. These are checks performed by the worker, not independent certification. The assignment’s verifier checks paths and bytes; it does not establish runtime behavior.

## Scope and assumptions

Reviewed the production export of `/` and the actual static `/overlay/` route, served under `/preview/` to exercise subpath URLs. The site is vanilla TypeScript + Vite, with locally drawn inline SVG. Source, lockfile, export, share image, screenshots, and design documentation are delivered. No hosting or publication was performed.

Consequential choices: dark forest/dojo palette with gold; default bottom-right position, HUD enabled, sound disabled; 40-character optional names; half-open game windows at 10/30/60 minutes; detection-time scoring; first three block celebrations from a burst; viewport-fit scaling when necessary at 720p. A valid explicit counter fault takes the scratch pose even if the builder is unavailable, while its HUD still reports Signal lost. No data, history, payouts, peers, or leaderboard are synthesized in the application.

## Build, tests, and live service

| Check | Actual result |
| --- | --- |
| Clean `npm ci` using copies of the delivered manifests in the disposable test area | Passed; 19 packages installed. No installed dependencies are submitted. |
| `npm run typecheck` (`tsc --noEmit`) | Passed, including after the final source change. |
| `npm test` | Passed: 14 tests, zero failures. BigInt precision, fractional progress, work left, version checks, unavailable/missing values, safe measurements, ETag/304, recovery, Retry-After, game boundaries, streak storage, and URL sanitization. |
| `npm run build` | Passed using the clean lockfile installation; Vite 7.3.7, eight modules, then a real `dist/overlay/index.html` export. |
| `npm audit --audit-level=high` | Passed, zero reported vulnerabilities at the time checked. An earlier Vite development-server advisory was resolved by pinning 7.3.7. This is not a general security certification. |
| `node tests/browser.mjs` / `npm run test:browser` | Chromium primary interaction checks, accessibility checks, and standalone overlay cases executed against the export. The JSON summary is in `check-results.json`; environment limitations are distinguished below. |
| Real public API GET via curl | HTTP 200, schema version 1, valid decimal-string projection/anchor values and measurement integers. ETag and expose headers observed. |
| Real API OPTIONS preflight with `Origin` and `if-none-match` | HTTP 204; `Access-Control-Allow-Origin: *`, `GET,OPTIONS`, `if-none-match` allowed, and ETag/Retry-After exposed. |
| Direct public API request from this host’s Chromium | Failed: `net::ERR_EMPTY_RESPONSE`. Both ordinary and ignore-certificate-error contexts failed. The app correctly displayed Signal lost and unknown values. This is an unverified end-to-end browser transport on this host, not a passing live-network claim. |
| Real data rendered through a test-only transport bridge | Passed. The browser test fetched fresh bodies from the same public API using curl, then supplied those unchanged bodies to the page. Screenshot values are real. No bridge, fixtures, or local server code is included in `dist/`. |
| WebKit/Safari engine | Attempted but unable to launch with the native shared libraries available to this host. The supplied browser-tool launcher also failed to initialize Chromium; a local headless Chromium fallback performed the actual rendered checks. No Safari pass is claimed. |

Browser dependencies and downloaded browser/native-library archives were confined to ignored `test/scratch/`. The supplied browser launcher’s generated `.cache/` files are also ignored. A normal installation uses the package scripts shown in README. The pinned probe was run with its supported `IMD_PLAYWRIGHT` entry override pointing to the locally working Chromium launcher; the probe itself was not modified.

### Interaction coverage

The browser harness validates all of the following rather than inferring them from the build:

- One page poller supplies the hero, builder, and game. A subsequent conditional request returns its ETag; nominal cadence is three seconds. A 304 preserves data. Multiple scenes do not introduce requests.
- Emulated visibility changes stop both poller and transforms, then resume cleanly. Actual OS/browser background-tab scheduling was not separately measured.
- All seven builder options update the URL and preview. The copied URL retains its `/preview/` base. Names containing `<` and `&` render as text on a real block banner.
- The complete builder flow works by keyboard: name entry, select changes, range change, both switches, and copy. Focus is visibly outlined in the captured keyboard state. Pointer interaction is tested separately.
- Cheer is local and produces a bow; pause freezes the articulated transforms.
- More than twenty seconds of IDLE produces the seated/sleep pose; ACTIVE produces alternating leg transforms and a faster run; observed ACTIVE followed by IDLE produces a session last-run time.
- No selection gives actionable guess validation. A locked guess prevents a second one. A new projected height scores a win or loss, preserves best streak appropriately, and produces the corresponding in-game Rels pose after the slash. Enabled sound creates a real Web Audio oscillator; audibility was not measured.
- A burst queues three celebrations and no more. Reload removes a pending guess while preserving the saved streak.
- Stale, builder unavailable, counter fault, HTTP 429, and recovery have distinct state text and retain last good readings. Retry-After plus backoff prevents premature retry.
- Actual progress fill width agrees with 42.6%, and an already-settled projected height is not labeled as awaiting settlement.
- Layout has no horizontal overflow at 320, 390, 768, and 1440px. At 390 × 844, both the main action and product are on the first screen.
- Both OBS sizes, every corner, and scale 0.5/2 are checked: 16 combinations total. The widget and visible block banner stay in frame; the canvas is transparent; there are no document scrollbars. Invalid options and HUD-off are checked.
- Reduced motion holds limb transforms still during ACTIVE. WCAG A/AA-tagged axe checks cover the landing and light lost-signal HUD. This is not a screen-reader session or a full WCAG conformance claim.
- No script exceptions or missing local resources occurred in the deterministic interaction context. Expected external failures are reported separately above.

Test fixtures are explicitly test-only, including the run, burst, and game outcome states. They are not public live data and are never imported by the application.

## Better Interface: six-domain coverage

Read and applied the pinned workflow and the core principles of all six domains while building. One visual idea carries the site: a quiet night dojo inhabited by a small samurai whose energy follows a real wheel.

| Domain | Coverage and evidence | Limits |
| --- | --- | --- |
| Accessibility | Checked native labels/roles, fieldsets, status regions, skip link, focus tokens, keyboard builder flow, radio/lock behavior, SVG decorative handling, inert preview subtree, reduced-motion handling, and axe scans. | No physical assistive-technology session, forced-colors device session, or complete screen-reader audit. |
| Layout | Checked source reading order, shared edges, responsive grids; rendered 320/390/768/1440 widths; product/action on first phone screen; 1080p/720p overlay corner/scale/banner bounds. | Native 200% browser zoom and localized/RTL product layouts not verified. OBS corners intentionally use physical coordinates. |
| Writing | Checked action labels and option semantics, clear retry/unknown states, local-only game language, independent-project disclaimer, projected/settled distinction, plain OBS steps. Removed redundant slogan fragments and the ambiguous claim that resting creates work. | External linked sites’ content and availability are outside the static deliverable. |
| Typography | Checked six tokens, descending headings, two weights, three families, numeric tabular settings, label/input sizes, visible wrapping, and lack of clipping at reviewed widths. | Exact fallback font appearance across operating systems is not certified. Decorative SVG letters are art. |
| Colors | Checked semantic hex tokens, dark and light HUDs, declared contrast calculations, actual computed light lost-state color, axe, and the probe’s rendered solid-background contrast checks. | Arbitrary streamer video behind the transparent mascot has no known contrast; the HUD is deliberately opaque. Decorative illustration contrast is not treated as data-text contrast. |
| UI | Checked loading, missing, idle, run, stale, fault, unavailable, recovery, pending guess, win/loss, copy success, hover/press/focus source states, reduced motion, celebration cap and Web Audio construction. Reviewed actual scene, sleeping pose, game and focus captures. | No physical OBS run, audible speaker test, native device test, slow-motion DevTools replay, or hardware 60fps certification. RAF animation targets display cadence; a frame-rate guarantee is not claimed. |

### Contrast calculations

WCAG 2 sRGB luminance calculations for the identified opaque token pairs (also checked against their rendered roles) were:

| Foreground / background | Ratio |
| --- | --- |
| `#f1efdf` / `#111715` primary text | 15.69:1 |
| `#a7b2a6` / `#111715` secondary text | 8.26:1 |
| `#a7b2a6` / `#151e18` builder hints | 7.77:1 |
| `#202219` / `#edc56c` primary button | 9.82:1 |
| `#4e5945` / `#f0e8d2` light HUD secondary text | 6.05:1 |
| `#5b6352` / `#f0e8d2` corrected light lost-state text/focus | 5.13:1 |

The earlier light lost-state `#68705f` pair calculated to 4.22:1, below the 4.5:1 body-text threshold. It was replaced and the final rendered color `rgb(91, 99, 82)` was asserted in the browser; the light HUD axe check passed. The probe passed its measured solid-background text pairs. Neither check establishes contrast for every pixel of transparent illustration over arbitrary video.

## Findings, corrections, and rechecks

Locations refer to the final source, so a reviewer can find the changed component. Initial behavior is stated separately; it is not alleged to remain in the final build.

| Severity/domain | Source and initial finding | Correction and recheck |
| --- | --- | --- |
| Medium / typography | `src/style.css:384`, `.scene-sign`: its generic `serif` family made the first probe count four families. | Reused the Georgia stack. Final probe counts Arial, Georgia, Courier New: three families, two weights. |
| Medium / writing | `src/main.ts:30`, copy feedback and builder aside; `src/main.ts:31`, game disclaimer: five short multi-sentence slogan fragments across the page. | “Transparent and ready for OBS”, “Free to use, no sign-up”, and a single plain no-money/no-wallet sentence. Probe now counts two two-beat lines, within its threshold. |
| High / color-accessibility | `src/style.css:1273`, light `.overlay-hud.values-muted`: the original grey calculated to 4.22:1 on cream. | Changed to `#5b6352` (5.13:1), including the local light focus color. Actual computed color asserted; light lost-signal axe scan passed. |
| Medium / UI-layout | `src/main.ts:31`, `#game-rels`; `src/main.ts:352`, result dispatch: outcome animation originally appeared only in the hero above the game viewport. | Added an articulated companion beside streaks and dispatches win/lose to it. Both result poses are asserted in the game; rendered game capture reviewed. |
| Medium / UI | `src/scene.ts:68`, `.win-arms`: the first raised-arm transform was visually masked by the large helmet. | Added explicit articulated victory arms above the helmet’s painting order; they wave outside its silhouette. Game win capture reviewed. Reduced motion keeps them static. |
| Medium / UI-data | `src/style.css:491`, `.progress-fill`: a 600ms initial width transition made the first real 42.6% reading momentarily look near zero. | Removed that transition. Browser compares rendered fill/track width to 0.426. Final real-data screenshot shows the correct bar immediately. |
| Medium / writing-data | `src/main.ts:124`, `mined-caption`: unconditional “awaiting settlement” contradicted an anchor already equal to projected height. | Derive the caption from both heights. Browser explicitly tests the already-settled case. Both heights and receipt remain separately visible. |
| Medium / overlay layout | `src/style.css:1284`, `.overlay-widget .block-banner`: negative inline insets could put an enlarged banner outside a 24px corner inset. | Keep the banner within widget width. Browser checks the visible banner bounds at all 16 resolution/corner/scale combinations. |
| Medium / accessibility | `src/main.ts:30`, `.preview-overlay-area` and `.stream-preview`: tiny preview receipt links could enter the keyboard order; after making that subtree inert, axe identified the generic frame’s label as prohibited ARIA. | Preview subtree is inert and its sample frame is a named `role="img"`. Real standalone receipt links remain usable. Final keyboard flow and axe were rechecked. |

No known unresolved implementation defect blocks the requested primary flows. The environment and manual-check limitations above remain explicit.

## Pinned taste probe

Ran, from the repository root, the unmodified pinned script:

```sh
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The working local Chromium launcher was supplied with `IMD_PLAYWRIGHT`. The script generated 390px and 1440px full-page and viewport screenshots, checked 320px reflow and reduced motion, and produced a JSON report. Its final check summary is retained in `taste-checks.json`; the scratch screenshots are intentionally not submission dependencies.

**15/16 checks passed.** The only flag is `repetition`: “work left to next block” appears in the primary live HUD and again in the builder’s live HUD preview (`src/main.ts:26`, `src/scene.ts:99`). This repetition is deliberate required data in two contexts, rather than a repeated marketing line. Removing it would obscure the requested live preview. It is recorded as an assignment-driven exception, not silently scored as a pass. The required uppercase block-event banner is also an explicit brief choice; it is not an all-caps content style.

## Screenshots and completion

Delivered captures:

- `screenshots/landing-desktop.png`: 1440 × 1080 production viewport, real public API values.
- `screenshots/landing-mobile.png` and `screenshots/first-screen-390.png`: 390 × 844 first screen, main action and live character visible.
- `screenshots/overlay-1080.png`: 1920 × 1080 transparent production overlay, `scale=1.5`, real API values.

Additional fixture-only run/sleep/game/focus captures were inspected from `test/scratch/browser-results/`; they are not represented as live screenshots. Documentation screenshots use the test-only real-response transport described above. The shipped site always requests the public API directly and correctly exposes its own loading/outage states.

**Complete for the static implementation and the performed Chromium checks, with the listed verification limitations.** Safari/WebKit behavior, direct live API transport in this sandbox browser, physical OBS behavior, audible playback, screen-reader use, native zoom, and hardware frame rate are not certified. The live service itself was reachable and its real responses were parsed and rendered through the test bridge. The full export is included; generated dependencies and caches are excluded. Exact file totals are in `submission-budget.json`. A requirement-by-requirement map is in `requirements.md`.
