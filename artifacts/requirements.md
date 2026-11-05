# Delivery coverage

This maps the brief to the implemented files and worker checks. No production requirement is fulfilled with fixture or random data. Test-only fixtures are explicitly confined to `tests/`.

| Requirement | Delivery and evidence |
| --- | --- |
| Free companion, landing `/`, transparent OBS `/overlay` | `src/main.ts`, `dist/index.html`, `dist/overlay/index.html`; static subpath browser checks. Use the canonical generated `/overlay/` URL. |
| Independent-project disclaimer in footer, title and share metadata | Landing footer in `src/main.ts`; shared head in `index.html` and both exports; local 1200 × 630 share PNG also includes the disclaimer. |
| Watch Squeektoshi live | Hero and closing links use the supplied `https://sepolia.squeekchain.com`. |
| Public, real data only | Runtime source has one endpoint: `https://api.squeekchain.com/v1/status`. No initial sample data or demo URL options. Real API response bridge is test-only; direct browser network limitation is documented. |
| Shared 3-second poller, ETag, 304, rate-limit/backoff behavior | `src/api.ts`, single exported instance; unit and browser request-count/header/cadence/retry checks. |
| Schema version and unknown fields | Explicit version 1 parser, selected known fields, decimal validation, unknown-field tolerance; unit tests. |
| BigInt and correct units/progress/work left | `src/api.ts` rational arithmetic/formatters; exact large-height and 42.6%/5.483 work tests. |
| Both projected and Ethereum-settled height, receipt link | `paintSignal` in `src/main.ts`; landing and overlay HUDs; real receipt hash from the API only. Already-settled caption case tested. |
| Unavailable/request-failure states, last good values, no missing zero | Parser/poller preserve good data, muted values, Signal lost; unit/browser unavailable/recovery/error-state checks. |
| Normal IDLE, session last run, seated after 20 seconds | `RelsScene.setSignal`, session times in poller, matching resting labels; browser pose and last-run checks; sleeping pose visually reviewed. |
| Original Rels and lil Kuni, left-hip katana | Inline SVG in `src/scene.ts`; cream helmet, orange visor, yellow horned curled dragon, black wide sleeves, short legs; rendered screenshots reviewed. |
| Distinct articulated run with squash/stretch and RPM-following parallax/tail | Eight interpolated run frames, individual joints/sleeve lag, eased bounded speed; alternating transforms and rendered run capture checked. Hardware frame rate unverified. The overlay and builder preview gained their own transparent parallax layers in the revision; those layers have not been executed (see `validation.md`, “Revision”). |
| Idle motion without breathing bounce | Fixed seated body, head nod, sleeve movement, blinking/tail flick, separate curled Kuni frame and sleepy letters. Source and sleep capture reviewed. |
| Stale/lost search, fault scratch | Pose state machine, question bubble, fault label; browser state checks. Stale/lost now outrank a counter fault; the updated checks have not been executed (see `validation.md`, “Revision”). |
| New-block slash, streak, spinning Kuni, confetti, ding, named banner, queue cap | Scene event queue with maximum three pending/current celebrations; real Web Audio nodes, text-only names; browser burst/banner/sound checks. Actual audibility depends on browser autoplay and remains unmeasured. |
| All URL options and safe defaults | `src/options.ts`; every builder option, invalid values, encoded names, all four positions, both scale endpoints, HUD-off and light theme checked. |
| OBS 1920 × 1080 and 1280 × 720, no clicks or scrollbars | Transparent static page; visible widget and banner bounds tested in 16 resolution/corner/scale combinations. Physical OBS remains unverified. |
| Three-step wheel → work → blocks → SQK explanation | Landing `#how-it-works`; separates optimistic work from Ethereum settlement and SQK checkpointing. |
| Builder, sample frame, live preview, copy, numbered setup | Landing `#builder`; shared live signal, all option controls, keyboard flow, clipboard and manual-copy fallback. |
| Beat the Wheel buckets, one open guess, win/lose, current/best streak | `src/game.ts`, landing `#game`; correct boundary scoring, reload reset, storage denial/corruption, locked state and in-view result poses tested. |
| Just for fun, no money, no wallet | Explicit game copy; no wallet, payment or transaction code/dependencies. |
| Local cheer bow | Hero button; bow and absence of a new request tested. |
| Static Vite + TypeScript, no runtime trackers/fonts/images from third parties | Relative assets, local illustration, zero runtime dependencies; export and local-resource checks. |
| RAF, hidden-tab pause, reduced motion | One shared RAF scheduler; visibility suspension and static reduced-motion limb transforms tested. Native background throttling and device frame rate not certified. |
| Responsive first phone screen, accessible labels and contrast | 320/390/768/1440 checks; first screen reviewed at 390 × 844; keyboard flow, axe, contrast calculations and rendered probe. |
| Title, favicon, description, og:title and og:image | Both exported heads include them; SVG favicon and PNG share image bundled. |
| Unit tests, production build and typecheck | Delivered tests and scripts; 14 unit cases, clean install/build/typecheck passed. |
| Better Interface six-domain review and repairs | `artifacts/validation.md`, `DESIGN.md`; explicit coverage, source citations, fixes and limitations. |
| README screenshots, API fields, OBS and self-host instructions | Root `README.md` plus real-data screenshots under `artifacts/screenshots/`. |
| Complete static export plus source/lockfile, 8 MiB budget | `dist/` is not ignored. Generated dependencies/caches excluded at all nesting levels. Exact added-file and export totals in `artifacts/submission-budget.json`. |

The remaining gaps are verification coverage, not concealed substitute features: direct browser API transport on this host, WebKit/Safari, physical OBS, audible output, screen-reader use, native zoom and hardware frame rate. See `validation.md` for the actual tool outcomes.
