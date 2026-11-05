import "./style.css";
import { statusPoller, fixed, progressPercent, workLeft } from "./api.ts";
import type { Signal } from "./api.ts";
import { BUCKETS, loadStreak, saveStreak, settleGuess } from "./game.ts";
import type { Bucket, Guess } from "./game.ts";
import { DEFAULT_OPTIONS, overlayURL, parseOptions } from "./options.ts";
import { dojoSVG, mascotSVG, overlayMarkup, RelsScene } from "./scene.ts";
const app = document.querySelector<HTMLDivElement>("#app")!;
const isOverlay = /\/overlay(?:\/index\.html|\/)?$/.test(location.pathname);
const arrow =
  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const wheel =
  '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="5" stroke="currentColor" stroke-width="2"/><path d="m20 5 1 10m14 5-10 1m-5 14-1-10M5 20l10-1M9 9l8 8m14 14-8-8m8-14-8 8M9 31l8-8" stroke="currentColor" stroke-width="2"/></svg>';
const miniRels =
  '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M5 29C0 4 39 2 40 24l-4 12H8Z" fill="#efe3bd"/><path d="M23 19h15v12H23c-8 0-8-12 0-12" fill="#dc8c43"/><path d="m28 22 4 3-4 3" fill="none" stroke="#33291e" stroke-width="2.5"/><path d="M13 10c-5-12 13-13 13-6 0 6-8 5-8 2" fill="none" stroke="#edc766" stroke-width="5" stroke-linecap="round"/></svg>';
if (isOverlay) {
  document.documentElement.classList.add("overlay-page");
  app.innerHTML = `<main class="obs-stage" aria-label="Rels live stream overlay">${overlayMarkup()}</main>`;
} else {
  app.innerHTML = `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header wrap"><a class="brand" href="./" aria-label="Rels on the Wheel home">${miniRels}<span>Rels on the Wheel<span class="brand-sub">A little samurai. A real hamster.</span></span></a><nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#builder">Overlay builder</a><a href="#game">Play the game ${arrow}</a></nav><span class="network"><span class="network-mark"></span>Sepolia</span></header>
  <main id="main">
    <section class="hero wrap" aria-labelledby="hero-heading">
      <div class="hero-copy"><h1 id="hero-heading">Small paws.<br><em>Legendary blocks.</em></h1><p class="hero-description">A free stream companion powered by Squeektoshi, the hamster behind Squeekchain.</p><div class="hero-actions"><a class="button primary" href="#builder">Build your overlay ${arrow}</a><a class="text-link watch-link" href="https://sepolia.squeekchain.com" target="_blank" rel="noopener noreferrer">Watch Squeektoshi live ${arrow}</a></div><div class="hero-note"><span class="small-star">✦</span> Meet Rels &amp; his tiny dragon, lil Kuni.<br><span class="note-indent">Their next adventure follows the wheel.</span></div></div>
      <div class="hero-scene scene" id="hero-scene" data-pose="waiting"><div class="scene-canvas">${dojoSVG()}<div class="scene-top"><span class="signal-indicator" role="status"><i></i><span data-live="signal">Connecting to wheel…</span></span><button class="icon-button" id="pause-motion" type="button" aria-label="Pause animation" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2"/></svg></button></div><span class="scene-sign" aria-hidden="true">風<br>林<br>火<br>山</span><div class="hero-mascot">${mascotSVG()}</div><span class="pose-label"></span><div class="block-banner" role="status"><span class="banner-main"></span><span class="banner-name"></span></div><p class="scene-state" data-live="status">Finding Squeektoshi’s signal…</p></div><div class="scene-bottom"><span><span class="scene-dot"></span> Rels &amp; lil Kuni <span class="muted">/ on wheel time</span></span><button id="cheer" class="cheer-button" type="button">Cheer Rels <span aria-hidden="true">♡</span></button></div></div>
      <div class="live-dashboard" aria-label="Live wheel data"><dl class="metrics"><div><dt>Wheel speed</dt><dd><span data-live="rpm">—</span><span class="unit">RPM</span></dd></div><div><dt>Running pace</dt><dd><span data-live="speed">—</span><span class="unit">m/min</span></dd></div><div><dt>Distance today</dt><dd><span data-live="distance">—</span><span class="unit">metres</span></dd></div><div><dt>Projected block</dt><dd class="height-value" data-live="height">—</dd></div></dl><div class="block-progress"><div class="progress-label"><span>Next block</span><strong data-live="percent">—</strong></div><div class="progress-track" role="progressbar" aria-label="Progress to next block" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill"></div></div><div class="progress-details"><span><span data-live="work">—</span> work left to next block</span><span data-live="settled">Settlement unknown</span></div></div></div>
      <div class="data-caption"><span><span class="data-dot"></span> Public wheel signal · refreshes every 3 seconds</span><span data-live="mined-caption">Projected block unknown</span></div>
    </section>
    <section class="how-section wrap" id="how-it-works" aria-labelledby="how-heading"><div class="section-heading"><div><h2 id="how-heading">One wheel. A whole little world.</h2><p>Real movement becomes work on Squeekchain.</p></div><a class="text-link" href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noopener noreferrer">Meet the chain ${arrow}</a></div><ol class="how-steps"><li><span class="step-icon">${wheel}</span><div><span class="step-number">01 / The wheel</span><h3>Squeektoshi sets the pace.</h3><p>A real hamster runs, rests, and runs again. Rels follows every turn.</p></div></li><li><span class="step-icon"><svg viewBox="0 0 40 40" aria-hidden="true" fill="none"><path d="m5 27 8-8 7 5 13-16M25 8h8v8M6 34h28" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><span class="step-number">02 / The work</span><h3>Little steps add up.</h3><p>The wheel’s measured work advances the next block.</p></div></li><li><span class="step-icon"><svg viewBox="0 0 40 40" aria-hidden="true" fill="none"><path d="m20 3 15 8v18l-15 8-15-8V11Zm0 17v17M5 11l15 9 15-9M12 7l15 9v7" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span><div><span class="step-number">03 / Blocks → SQK</span><h3>A block. A tiny celebration.</h3><p>Rels draws his katana. Blocks settle on Ethereum; checkpointing issues SQK.</p></div></li></ol></section>
    <section class="builder-section" id="builder" aria-labelledby="builder-heading"><div class="wrap"><div class="section-heading"><div><h2 id="builder-heading">Make room for a little legend.</h2><p>Your stream. Your corner. Rels takes it from here.</p></div><span class="section-aside">Free to use, no sign-up.</span></div><div class="builder-grid"><form id="builder-form" class="builder-controls"><div class="field"><label for="streamer-name">Streamer name <span class="muted">(optional)</span></label><input id="streamer-name" name="name" type="text" maxlength="40" placeholder="Your name on the block banner" autocomplete="nickname"><p class="field-hint">Shown when Squeektoshi mines a block.</p></div><div class="field-row"><div class="field"><label for="position">Position</label><select id="position" name="pos"><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></div><div class="field"><label for="theme">HUD theme</label><select id="theme" name="theme"><option value="dark">Dark</option><option value="light">Light</option></select></div></div><div class="field"><div class="range-label"><label for="scale">Character size</label><output id="scale-value" for="scale">1×</output></div><input id="scale" name="scale" type="range" min="0.5" max="2" value="1" step="0.1"><div class="range-limits"><span>0.5×</span><span>2×</span></div></div><label class="switch-row" for="hud"><span>Show live HUD<span class="field-hint">Speed, distance &amp; block progress</span></span><input id="hud" name="hud" type="checkbox" role="switch" checked><span class="switch-visual" aria-hidden="true"></span></label><label class="switch-row" for="sound"><span>Block celebration sound<span class="field-hint">A little ding for a new block</span></span><input id="sound" name="sound" type="checkbox" role="switch"><span class="switch-visual" aria-hidden="true"></span></label></form><div class="preview-column"><div class="stream-preview" role="img" aria-label="Live preview of your stream overlay"><div class="sample-stream" aria-hidden="true"><div class="sample-top"><span class="sample-live">Stream preview</span><span>1920 × 1080</span></div><svg class="sample-landscape" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice"><circle cx="385" cy="150" r="65" fill="#576c59"/><path d="M0 350 138 135 245 277 378 202 563 355 707 175 800 312v138H0" fill="#263f36"/><path d="m0 390 178-107 181 122 210-112 231 80v77H0" fill="#1c332d"/><path d="M400 324 293 450h218Z" fill="#476252"/><g fill="#142a24"><path d="m120 190 46 132H74Zm590 32 50 143H660ZM43 275l35 104H8Z"/></g><path d="m0 415 800-3" stroke="#839375" opacity=".2"/></svg><div class="sample-center"><svg viewBox="0 0 40 40" fill="none"><path d="m14 10 17 10-17 10Z" stroke="currentColor" stroke-width="1.5"/></svg><span>Your stream goes here</span></div></div><div class="preview-overlay-area" inert>${overlayMarkup()}</div></div><div class="preview-caption"><span><span class="data-dot"></span> Live preview · same real wheel signal</span><a id="open-overlay" class="text-link" href="./overlay/" target="_blank" rel="noopener noreferrer">Open overlay ${arrow}</a></div><div class="copy-area"><label for="obs-url">Your OBS Browser Source URL</label><div class="copy-row"><input id="obs-url" type="text" readonly spellcheck="false" aria-describedby="copy-feedback"><button class="button primary" id="copy-url" type="button">Copy OBS URL <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="7" y="7" width="9" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M12 7V3H3v10h4" stroke="currentColor" stroke-width="1.5"/></svg></button></div><p id="copy-feedback" class="field-hint" role="status">Transparent and ready for OBS.</p></div></div></div><div class="obs-setup"><h3>On your stream in a minute.</h3><ol><li><span>1</span>In OBS, find <strong>Sources</strong></li><li><span>2</span>Select <strong>+ → Browser</strong></li><li><span>3</span>Paste your <strong>overlay URL</strong></li><li><span>4</span>Set <strong>1920 × 1080</strong><small>or 1280 × 720</small></li></ol></div><p class="builder-footnote">Sound is off by default. If your browser blocks audio, allow autoplay for the Browser Source. Keep “Shutdown source when not visible” off to retain its session.</p></div></section>
    <section class="game-section wrap" id="game" aria-labelledby="game-heading"><div class="game-intro"><span class="game-wheel" aria-hidden="true">${wheel}</span><h2 id="game-heading">Beat the Wheel</h2><p>One hamster. One next block.<br>How long do you think it’ll take?</p><p class="game-disclaimer">Just for fun, with no money or wallet.</p><div class="game-companion-row"><dl class="streaks"><div><dt>Current streak</dt><dd id="streak">0</dd></div><div><dt>Best streak</dt><dd id="best-streak">0</dd></div></dl><div id="game-rels" class="game-rels" data-pose="waiting" role="img" aria-label="Rels, your wheel prediction companion">${mascotSVG()}</div></div></div><div class="game-play"><div class="game-topline"><span id="game-next-block">Waiting for the wheel signal</span><span class="muted">One guess at a time</span></div><fieldset id="guess-options"><legend>Pick the time from now to the next block.</legend><div class="guess-grid">${BUCKETS.map((b) => `<label class="guess-option"><input type="radio" name="guess" value="${b.id}"><span><strong>${b.label}</strong><span>${b.detail}</span></span><span class="radio-mark" aria-hidden="true"></span></label>`).join("")}</div></fieldset><button class="button primary" id="lock-guess" type="button">Lock in my guess ${arrow}</button><p id="game-feedback" class="game-feedback" role="status">Pick a window, then lock it in before the next block.</p><p class="field-hint">Streaks stay in this browser. An open guess resets on reload.<br>Timing uses when this page detects the block; gaps can affect results.</p></div></section>
    <section class="closing wrap"><span>${miniRels}</span><p>Every legend starts with<br><em>one small step.</em></p><a class="text-link" href="https://sepolia.squeekchain.com" target="_blank" rel="noopener noreferrer">Watch Squeektoshi live ${arrow}</a></section>
  </main><footer class="site-footer wrap"><a class="footer-brand" href="./">Rels on the Wheel</a><p>Built on Squeekchain · community project, not an official Squeekchain site</p><a href="https://docs.squeekchain.com/developers/api/" target="_blank" rel="noopener noreferrer">Powered by the public API ${arrow}</a></footer><div id="local-feedback" class="sr-only" role="status"></div>`;
}
let options = isOverlay
  ? parseOptions(new URLSearchParams(location.search))
  : { ...DEFAULT_OPTIONS };
const sceneElements = isOverlay
  ? [document.querySelector<HTMLElement>(".overlay-widget")!]
  : [
      document.querySelector<HTMLElement>("#hero-scene")!,
      document.querySelector<HTMLElement>(
        ".preview-overlay-area .overlay-widget",
      )!,
      document.querySelector<HTMLElement>("#game-rels")!,
    ];
const scenes = sceneElements.map((el) => new RelsScene(el));
const initialSignal = statusPoller.signal;
let latestSignal = initialSignal;
let paused = false;
let currentHeight: bigint | null = null;
let guess: Guess | null = null;
let streak = loadStreak();
let gameResult = "";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function put(name: string, value: string): void {
  document.querySelectorAll(`[data-live="${name}"]`).forEach((el) => {
    if (el.textContent !== value) el.textContent = value;
  });
}
function timeAgo(at: number | null, now: number): string {
  if (at === null) return "—";
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
function paintSignal(signal: Signal): void {
  const now = Date.now(),
    data = signal.data;
  const m = signal.latestMeasurement ?? data?.measurement;
  const stale = m?.freshness === "stale";
  const status = signal.loading
    ? "Finding Squeektoshi’s signal…"
    : signal.lost
      ? "Signal lost · retrying automatically"
      : stale
        ? "Wheel signal stale · waiting for a fresh reading"
        : m?.coreStatus === "COUNTER_FAULT"
          ? "Wheel hiccup · checking the counter"
          : m?.coreStatus === "ACTIVE"
            ? "Squeektoshi is running · every step adds up"
            : `Squeektoshi is resting · last run ${timeAgo(signal.lastActiveAt, now)}`;
  put("status", status);
  put(
    "short-status",
    signal.lost
      ? "Signal lost"
      : stale
        ? "Signal stale"
        : m?.coreStatus === "IDLE"
          ? `Squeektoshi is resting · last run ${timeAgo(signal.lastActiveAt, now)}`
          : m?.coreStatus === "COUNTER_FAULT"
            ? "wheel hiccup"
            : signal.loading
              ? "Connecting to wheel…"
              : "Squeektoshi is running",
  );
  put(
    "signal",
    signal.loading
      ? "Connecting to wheel…"
      : signal.lost
        ? "Signal lost"
        : stale
          ? "Signal stale"
          : "Wheel signal online",
  );
  document
    .querySelectorAll(".live-dashboard, .overlay-hud")
    .forEach((el) =>
      el.classList.toggle("values-muted", signal.lost || !!stale),
    );
  document.querySelectorAll(".signal-indicator").forEach((el) => {
    el.classList.toggle("disconnected", signal.lost || !!stale);
  });
  if (data) {
    put("rpm", fixed(data.measurement.rpmMilli, 1000n));
    put("speed", fixed(data.measurement.speedMmPerSecond * 60n, 1000n));
    put("distance", fixed(data.measurement.distanceMm, 1000n));
    put("height", `#${data.projected.blockHeight.toLocaleString("en-US")}`);
    put("block", `Block #${data.projected.blockHeight} mined`);
    put(
      "mined-caption",
      `Block #${data.projected.blockHeight} mined · ${data.projected.blockHeight > data.anchor.blockHeight ? "awaiting settlement" : "settled on Ethereum"}`,
    );
    put("percent", `${progressPercent(data.projected.blockProgress)}%`);
    put("work", workLeft(data));
    const pct = progressPercent(data.projected.blockProgress);
    document
      .querySelectorAll<HTMLElement>(".progress-fill")
      .forEach((el) => (el.style.width = `${pct}%`));
    document.querySelectorAll('[role="progressbar"]').forEach((el) => {
      el.setAttribute("aria-valuenow", pct);
      el.setAttribute(
        "aria-valuetext",
        `${pct}% toward the next block${signal.lost ? ", last known value" : ""}`,
      );
    });
    document.querySelectorAll('[data-live="settled"]').forEach((el) => {
      const text = `#${data.anchor.blockHeight.toLocaleString("en-US")} settled on Ethereum`;
      const hash = data.anchor.transactionHash;
      if (hash) {
        let link = el.querySelector("a");
        if (!link) {
          link = document.createElement("a");
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          el.replaceChildren(link);
        }
        link.href = `https://sepolia.etherscan.io/tx/${hash}`;
        link.textContent = text;
      } else el.textContent = `${text} · receipt unavailable`;
    });
  }
  scenes.forEach((scene) => scene.setSignal(signal, now));
  updateGame();
}
function updateGame(): void {
  if (isOverlay) return;
  document.querySelector("#streak")!.textContent = String(streak.streak);
  document.querySelector("#best-streak")!.textContent = String(streak.best);
  const valid =
    !latestSignal.loading &&
    !latestSignal.lost &&
    latestSignal.data?.measurement.freshness === "online" &&
    latestSignal.data.measurement.coreStatus !== "COUNTER_FAULT";
  document.querySelector("#game-next-block")!.textContent = latestSignal.data
    ? `Predicting block #${latestSignal.data.projected.blockHeight + 1n}`
    : "Waiting for the wheel signal";
  const button = document.querySelector<HTMLButtonElement>("#lock-guess")!;
  button.disabled = !!guess || !valid;
  button.textContent = guess
    ? "Guess locked · watching the wheel"
    : "Lock in my guess";
  document.querySelector<HTMLFieldSetElement>("#guess-options")!.disabled =
    !!guess || !valid;
  let feedback =
    gameResult || "Pick a window, then lock it in before the next block.";
  if (guess)
    feedback = `Locked: ${BUCKETS.find((b) => b.id === guess!.bucket)!.label}. Waiting for the next block${!valid ? " · signal interrupted; your guess stays open" : ""}.`;
  else if (!valid)
    feedback = latestSignal.loading
      ? "Connecting to the wheel. You can guess as soon as it’s online."
      : "Waiting for a fresh wheel signal. Guesses reopen automatically.";
  document.querySelector("#game-feedback")!.textContent = feedback;
}
statusPoller.subscribe((signal) => {
  latestSignal = signal;
  if (!signal.lost && signal.data) {
    const height = signal.data.projected.blockHeight;
    if (currentHeight !== null && height > currentHeight) {
      const count = Number(
        height - currentHeight > 3n ? 3n : height - currentHeight,
      );
      const heights = Array.from(
        { length: count },
        (_, i) => currentHeight! + BigInt(i + 1),
      );
      scenes.forEach((scene) => scene.celebrate(heights));
      if (guess) {
        const result = settleGuess(guess, height, Date.now(), streak);
        if (result) {
          streak = result.streak;
          saveStreak(streak);
          guess = null;
          const actual = BUCKETS.find((b) => b.id === result.actual)!.label;
          gameResult = result.won
            ? `You called it! ${actual}. Rels salutes your wheel wisdom.`
            : `The wheel had other plans: ${actual}. Try the next block!`;
          document
            .querySelector("#game-feedback")
            ?.classList.toggle("game-won", result.won);
          // Let the slash finish first; queued win/lose is kept until celebrations finish.
          pendingReaction = result.won;
          document
            .querySelectorAll<HTMLInputElement>('input[name="guess"]')
            .forEach((el) => {
              el.checked = false;
            });
        }
      }
    }
    // A rollback never creates a block event; an open guess keeps its original height target.
    currentHeight = height;
  }
  paintSignal(signal);
});
let pendingReaction: boolean | null = null;
if (isOverlay) {
  const widget = sceneElements[0];
  function sizeOverlay(): void {
    const fit = Math.min(
      options.scale,
      (innerWidth - 48) / 420,
      (innerHeight - 48) / (widget.offsetHeight + 15),
    );
    widget.style.setProperty("--overlay-scale", String(Math.max(0.2, fit)));
  }
  widget.dataset.pos = options.pos;
  widget.dataset.theme = options.theme;
  widget.classList.toggle("no-hud", !options.hud);
  sizeOverlay();
  addEventListener("resize", sizeOverlay);
  scenes[0].setOptions(options);
} else {
  const form = document.querySelector<HTMLFormElement>("#builder-form")!;
  const urlField = document.querySelector<HTMLInputElement>("#obs-url")!;
  function updateBuilder(): void {
    const values = new FormData(form);
    options = parseOptions(
      new URLSearchParams({
        name: String(values.get("name") ?? ""),
        pos: String(values.get("pos")),
        scale: String(values.get("scale")),
        theme: String(values.get("theme")),
        hud: values.has("hud") ? "1" : "0",
        sound: values.has("sound") ? "1" : "0",
      }),
    );
    const url = overlayURL(options, location.href);
    urlField.value = url;
    document.querySelector<HTMLAnchorElement>("#open-overlay")!.href = url;
    document.querySelector("#scale-value")!.textContent = `${options.scale}×`;
    const widget = sceneElements[1];
    widget.dataset.pos = options.pos;
    widget.dataset.theme = options.theme;
    widget.classList.toggle("no-hud", !options.hud);
    widget.style.setProperty(
      "--preview-character-scale",
      String(options.scale),
    );
    scenes[1].setOptions(options);
    if (options.sound) void scenes[1].unlockSound();
    document.querySelector("#copy-feedback")!.textContent =
      "Transparent and ready for OBS.";
    document.querySelector("#copy-url")!.firstChild!.textContent =
      "Copy OBS URL ";
  }
  form.addEventListener("input", updateBuilder);
  form.addEventListener("submit", (e) => e.preventDefault());
  updateBuilder();
  new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    sceneElements[1].style.setProperty("--preview-fit", String(width / 1920));
  }).observe(document.querySelector(".preview-overlay-area")!);
  document.querySelector("#copy-url")!.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(urlField.value);
      document.querySelector("#copy-feedback")!.textContent =
        "Copied. Paste this URL into an OBS Browser Source.";
      document.querySelector("#copy-url")!.firstChild!.textContent = "Copied! ";
    } catch {
      urlField.focus();
      urlField.select();
      document.querySelector("#copy-feedback")!.textContent =
        "URL selected. Press Ctrl+C or Command+C to copy.";
    }
  });
  document.querySelector("#cheer")!.addEventListener("click", () => {
    scenes[0].cheer();
    document.querySelector("#local-feedback")!.textContent =
      "Rels bows. Thanks for the cheer!";
    const button = document.querySelector("#cheer")!;
    button.firstChild!.textContent = "Rels says thanks ";
    setTimeout(() => {
      button.firstChild!.textContent = "Cheer Rels ";
    }, 1600);
  });
  document.querySelector("#pause-motion")!.addEventListener("click", () => {
    paused = !paused;
    const button = document.querySelector("#pause-motion")!;
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute(
      "aria-label",
      paused ? "Resume animation" : "Pause animation",
    );
    document.body.classList.toggle("motion-paused", paused);
    button.innerHTML = paused
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2"/></svg>';
  });
  document.querySelector("#lock-guess")!.addEventListener("click", () => {
    if (guess || latestSignal.lost || !latestSignal.data) return;
    const chosen = document.querySelector<HTMLInputElement>(
      'input[name="guess"]:checked',
    );
    if (!chosen) {
      gameResult = "Choose one of the four time windows first.";
      updateGame();
      document.querySelector<HTMLInputElement>('input[name="guess"]')!.focus();
      return;
    }
    guess = {
      bucket: chosen.value as Bucket,
      at: Date.now(),
      height: latestSignal.data.projected.blockHeight,
    };
    gameResult = "";
    updateGame();
  });
}
let raf = 0,
  lastFrame = 0,
  lastTextUpdate = 0;
function animate(timestamp: number): void {
  const dt = lastFrame ? Math.min(timestamp - lastFrame, 80) : 16.67;
  lastFrame = timestamp;
  scenes.forEach((scene) => scene.frame(dt, reducedMotion.matches, paused));
  if (pendingReaction !== null && scenes.every((scene) => !scene.celebrating)) {
    scenes[0].react(pendingReaction);
    scenes[2]?.react(pendingReaction);
    pendingReaction = null;
  }
  if (timestamp - lastTextUpdate >= 1000) {
    paintSignal(latestSignal);
    lastTextUpdate = timestamp;
  }
  raf = requestAnimationFrame(animate);
}
function visibility(): void {
  cancelAnimationFrame(raf);
  lastFrame = 0;
  if (document.hidden) statusPoller.stop();
  else {
    statusPoller.start();
    raf = requestAnimationFrame(animate);
  }
}
document.addEventListener("visibilitychange", visibility);
visibility();
