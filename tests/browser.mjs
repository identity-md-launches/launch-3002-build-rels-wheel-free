// Browser-only fixtures below exercise events and outages. They are never included in dist/.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const runFile = promisify(execFile);
const dependency = async (name) =>
  process.env.RELS_TEST_TOOLS
    ? import(
        pathToFileURL(resolve(process.env.RELS_TEST_TOOLS, name, "index.mjs"))
          .href
      )
    : import(name);
const { chromium, webkit } = await dependency("playwright");
const axeModule = process.env.RELS_TEST_TOOLS
  ? await import(
      pathToFileURL(
        resolve(
          process.env.RELS_TEST_TOOLS,
          "@axe-core/playwright/dist/index.mjs",
        ),
      ).href
    )
  : await import("@axe-core/playwright");
const AxeBuilder = axeModule.default;
const root = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/preview/")) {
      res.writeHead(404).end();
      return;
    }
    let file = resolve(
      root,
      "." + decodeURIComponent(url.pathname.slice("/preview".length)),
    );
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file += "/index.html";
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
await mkdir("test/scratch/browser-results", { recursive: true });
await mkdir("artifacts/screenshots", { recursive: true });
const reports = [];
const fixture = () => ({
  schemaVersion: 1,
  measurement: {
    freshness: "online",
    coreStatus: "IDLE",
    rpmMilli: 0,
    speedMmPerSecond: 0,
    distanceMm: 3455808,
    observedAt: "2026-11-05T17:00:00.000Z",
  },
  builder: {
    status: "available",
    projected: {
      blockHeight: "366",
      blockProgress: "425653103",
      workPerThousandBlocks: "9546",
    },
    anchor: { blockHeight: "360", transactionHash: null },
  },
});
const API = "https://api.squeekchain.com/v1/status";
async function pass(name, fn) {
  await fn();
  reports.push({ name, passed: true });
  console.log("PASS", name);
}
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.RELS_CHROMIUM
      ? { executablePath: process.env.RELS_CHROMIUM }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__synthesizedDings = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (...args) {
      const oscillator = original.apply(this, args);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (...values) => {
        window.__synthesizedDings++;
        return start(...values);
      };
      return oscillator;
    };
  });
  const errors = [],
    failures = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(url) && r.status() >= 400)
      failures.push(`${r.status()} ${r.url()}`);
  });
  let state = fixture(),
    status = 200,
    calls = [],
    tag = '"fixture-1"';
  await page.route(API, async (route) => {
    calls.push({
      headers: route.request().headers(),
      at: await page.evaluate(() => Date.now()),
    });
    await route.fulfill({
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "ETag, Retry-After",
        ETag: tag,
        ...(status === 429 ? { "Retry-After": "12" } : {}),
      },
      body: status === 304 ? undefined : JSON.stringify(state),
    });
  });
  await page.clock.install({ time: new Date("2026-11-05T17:00:00Z") });
  async function nextPoll() {
    const now = await page.evaluate(() => Date.now());
    const until = calls.at(-1).at + 3000 - now;
    await page.clock.runFor(Math.max(0, until) + 120);
  }
  await page.goto(url);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-live="percent"]')?.textContent === "42.6%",
  );
  await pass(
    "landing loads beneath a static subpath with exact progress and distinct projected/settled heights",
    async () => {
      assert.equal(
        await page.locator('.metrics [data-live="height"]').textContent(),
        "#366",
      );
      assert.match(
        await page
          .locator('.block-progress [data-live="settled"]')
          .textContent(),
        /#360 settled on Ethereum/,
      );
      assert.equal(
        await page.locator('.block-progress [data-live="work"]').textContent(),
        "5.483",
      );
      assert.equal(calls.length, 1);
    },
  );
  await pass(
    "one shared poller supplies both scenes; conditional requests repeat at 3 seconds",
    async () => {
      status = 304;
      await page.clock.runFor(3100);
      await page.waitForFunction(
        () =>
          document.querySelector('[data-live="signal"]')?.textContent ===
          "Wheel signal online",
      );
      assert.equal(calls.length, 2);
      assert.equal(calls[1].headers["if-none-match"], tag);
      assert.ok(Math.abs(calls[1].at - calls[0].at - 3000) < 150);
      status = 200;
    },
  );
  await pass(
    "visibility changes suspend the poller and animation, then resume cleanly",
    async () => {
      const before = calls.length;
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      const pose = await page
        .locator("#hero-scene .helmet")
        .getAttribute("transform");
      await page.clock.runFor(10000);
      assert.equal(calls.length, before);
      assert.equal(
        await page.locator("#hero-scene .helmet").getAttribute("transform"),
        pose,
      );
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.clock.runFor(100);
      assert.equal(calls.length, before + 1);
    },
  );
  await pass(
    "the builder completes by keyboard with a visible focus indicator",
    async () => {
      await page.getByLabel("Streamer name").focus();
      await page.keyboard.type("Keyboard");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "position",
      );
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "theme",
      );
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "scale",
      );
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Space");
      assert.equal(
        await page.getByRole("switch", { name: /Show live HUD/ }).isChecked(),
        false,
      );
      await page.keyboard.press("Tab");
      await page.keyboard.press("Space");
      assert.equal(
        await page
          .getByRole("switch", { name: /Block celebration sound/ })
          .isChecked(),
        true,
      );
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "copy-url",
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document
          .querySelector("#copy-feedback")
          ?.textContent.startsWith("Copied"),
      );
      assert.match(
        await page.locator("#copy-feedback").textContent(),
        /Copied/,
      );
      await page.locator(".copy-row").screenshot({
        path: "test/scratch/browser-results/keyboard-focus.png",
      });
    },
  );
  await pass(
    "every builder option changes the real URL and preview; clipboard copies it",
    async () => {
      await page.getByLabel("Streamer name").fill("Mika <&>");
      await page
        .getByLabel("Position", { exact: true })
        .selectOption("top-left");
      await page.getByLabel("HUD theme").selectOption("light");
      await page.getByLabel("Character size").fill("1.5");
      await page.getByRole("switch", { name: /Show live HUD/ }).uncheck();
      await page
        .getByRole("switch", { name: /Block celebration sound/ })
        .check();
      const generated = new URL(await page.locator("#obs-url").inputValue());
      assert.equal(generated.pathname, "/preview/overlay/");
      for (const [k, v] of Object.entries({
        pos: "top-left",
        theme: "light",
        scale: "1.5",
        hud: "0",
        sound: "1",
        name: "Mika <&>",
      }))
        assert.equal(generated.searchParams.get(k), v);
      assert.equal(
        await page
          .locator(".preview-overlay-area .overlay-widget")
          .getAttribute("data-theme"),
        "light",
      );
      assert.equal(
        await page.locator(".preview-overlay-area .overlay-hud").isVisible(),
        false,
      );
      await page.getByRole("button", { name: "Copy OBS URL" }).click();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        generated.href,
      );
      await page.getByRole("switch", { name: /Show live HUD/ }).check();
      await page
        .getByRole("switch", { name: /Block celebration sound/ })
        .uncheck();
      await page.getByLabel("HUD theme").selectOption("dark");
    },
  );
  await pass(
    "cheer bows locally and pause freezes articulated motion",
    async () => {
      const requests = calls.length;
      await page.getByRole("button", { name: "Cheer Rels" }).click();
      await page.clock.runFor(20);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "bow",
      );
      await page.getByRole("button", { name: "Pause animation" }).click();
      const before = await page
        .locator("#hero-scene .helmet")
        .getAttribute("transform");
      await page.clock.runFor(500);
      assert.equal(
        await page.locator("#hero-scene .helmet").getAttribute("transform"),
        before,
      );
      assert.equal(calls.length, requests);
      await page.getByRole("button", { name: "Resume animation" }).click();
      await page.clock.runFor(1700);
    },
  );
  await pass(
    "idle beyond twenty seconds sits and sleeps; active session gets a real articulated run",
    async () => {
      await page.clock.runFor(21000);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "sleep",
      );
      await page
        .locator("#hero-scene")
        .screenshot({ path: "test/scratch/browser-results/sleep.png" });
      state.measurement.coreStatus = "ACTIVE";
      state.measurement.rpmMilli = 90000;
      state.measurement.speedMmPerSecond = 1317;
      await page.clock.runFor(3100);
      await page.waitForFunction(
        () =>
          document.querySelector("#hero-scene")?.getAttribute("data-pose") ===
          "run",
      );
      const near = await page
        .locator("#hero-scene .near-leg")
        .getAttribute("transform");
      await page.clock.runFor(180);
      assert.notEqual(
        await page.locator("#hero-scene .near-leg").getAttribute("transform"),
        near,
      );
      assert.notEqual(
        await page.locator("#hero-scene .near-leg").getAttribute("transform"),
        await page.locator("#hero-scene .far-leg").getAttribute("transform"),
      );
      await page
        .locator("#hero-scene")
        .screenshot({ path: "test/scratch/browser-results/run.png" });
      state.measurement.coreStatus = "IDLE";
      state.measurement.rpmMilli = 0;
      await page.clock.runFor(3100);
      assert.match(
        await page.locator('[data-live="status"]').textContent(),
        /last run \d+s ago/,
      );
    },
  );
  await pass(
    "guess validation, a single locked guess, new block win and persistent streak",
    async () => {
      await page
        .getByRole("switch", { name: /Block celebration sound/ })
        .check();
      await page.getByRole("button", { name: "Lock in my guess" }).click();
      assert.match(
        await page.locator("#game-feedback").textContent(),
        /Choose one/,
      );
      await page.getByRole("radio", { name: /Under 10 min/ }).check();
      await page.getByRole("button", { name: "Lock in my guess" }).click();
      assert.equal(await page.locator("#lock-guess").isDisabled(), true);
      state.builder.projected.blockHeight = "367";
      await nextPoll();
      await page.waitForFunction(
        () => document.querySelector("#streak")?.textContent === "1",
      );
      assert.match(
        await page.locator("#game-feedback").textContent(),
        /You called it/,
      );
      assert.match(
        await page.locator("#hero-scene .banner-main").textContent(),
        /BLOCK #367 MINED BY SQUEEKTOSHI/,
      );
      await page.clock.runFor(3000);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "win",
      );
      assert.equal(
        await page.locator("#game-rels").getAttribute("data-pose"),
        "win",
      );
      await page
        .locator("#game")
        .screenshot({ path: "test/scratch/browser-results/game-win.png" });
      assert.ok(await page.evaluate(() => window.__synthesizedDings > 0));
      await page
        .getByRole("switch", { name: /Block celebration sound/ })
        .uncheck();
      assert.deepEqual(
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("rels-wheel-streak-v1")),
        ),
        { streak: 1, best: 1 },
      );
    },
  );
  await pass(
    "loss resets current streak, retains best, and produces the lose pose after slash",
    async () => {
      await page.clock.runFor(2500);
      await page.getByRole("radio", { name: /Over 1 h/ }).check();
      await page.getByRole("button", { name: "Lock in my guess" }).click();
      state.builder.projected.blockHeight = "368";
      await nextPoll();
      await page.waitForFunction(
        () => document.querySelector("#streak")?.textContent === "0",
      );
      assert.equal(await page.locator("#best-streak").textContent(), "1");
      assert.match(
        await page.locator("#game-feedback").textContent(),
        /other plans/,
      );
      await page.clock.runFor(3000);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "lose",
      );
      assert.equal(
        await page.locator("#game-rels").getAttribute("data-pose"),
        "lose",
      );
    },
  );
  await pass(
    "stale, unavailable, fault and recovery retain good values and use distinct states",
    async () => {
      await page.clock.runFor(2500);
      state.measurement.freshness = "stale";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "search",
      );
      state.measurement.freshness = "online";
      state.builder.status = "unavailable";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator('[data-live="signal"]').textContent(),
        "Signal lost",
      );
      assert.equal(
        await page.locator('.metrics [data-live="height"]').textContent(),
        "#368",
      );
      assert.match(
        await page.locator(".live-dashboard").getAttribute("class"),
        /values-muted/,
      );
      state.measurement.coreStatus = "COUNTER_FAULT";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "search",
      );
      assert.equal(
        await page.locator("#hero-scene .question-bubble").isVisible(),
        true,
      );
      state.builder.status = "available";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "fault",
      );
      assert.equal(
        await page.locator("#hero-scene .pose-label").textContent(),
        "wheel hiccup",
      );
      state.measurement.freshness = "stale";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator("#hero-scene").getAttribute("data-pose"),
        "search",
      );
      assert.equal(
        await page.locator("#hero-scene .pose-label").textContent(),
        "",
      );
      state.measurement.freshness = "online";
      state.measurement.coreStatus = "IDLE";
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator('[data-live="signal"]').textContent(),
        "Wheel signal online",
      );
    },
  );
  await pass(
    "progress width matches its value and an already-settled projection is labeled correctly",
    async () => {
      state.builder.anchor.blockHeight = state.builder.projected.blockHeight;
      await page.clock.runFor(3100);
      assert.match(
        await page.locator('[data-live="mined-caption"]').textContent(),
        /settled on Ethereum/,
      );
      const widths = await page
        .locator(".block-progress .progress-track")
        .evaluate((el) => ({
          track: el.getBoundingClientRect().width,
          fill: el.firstElementChild.getBoundingClientRect().width,
        }));
      assert.ok(Math.abs(widths.fill / widths.track - 0.426) < 0.001);
      state.builder.anchor.blockHeight = "360";
    },
  );
  await pass(
    "429 honors Retry-After plus backoff; no preview creates extra requests",
    async () => {
      status = 429;
      await page.clock.runFor(3100);
      assert.equal(
        await page.locator('[data-live="signal"]').textContent(),
        "Signal lost",
      );
      const before = calls.length;
      const remaining =
        calls.at(-1).at + 15000 - (await page.evaluate(() => Date.now()));
      await page.clock.runFor(Math.max(0, remaining - 100));
      assert.equal(calls.length, before);
      status = 200;
      await page.clock.runFor(250);
      assert.equal(calls.length, before + 1);
    },
  );
  await pass(
    "three-block celebration cap and plain-text streamer banner",
    async () => {
      state.builder.projected.blockHeight = "400";
      await nextPoll();
      const seen = new Set();
      for (let i = 0; i < 9; i++) {
        const t = await page
          .locator(".preview-overlay-area .block-banner.visible .banner-main")
          .textContent()
          .catch(() => null);
        if (t) seen.add(t);
        await page.clock.runFor(1000);
      }
      assert.equal(seen.size, 3);
      assert.match(
        await page.locator(".preview-overlay-area .banner-name").textContent(),
        /Mika <&>/,
      );
      assert.equal(
        await page.locator(".preview-overlay-area .banner-name script").count(),
        0,
      );
    },
  );
  await pass(
    "open guesses reset on reload while best streak persists",
    async () => {
      await page.getByRole("radio", { name: /Under 10 min/ }).check();
      await page.getByRole("button", { name: "Lock in my guess" }).click();
      await page.reload();
      await page.clock.runFor(100);
      await page.waitForFunction(
        () =>
          document.querySelector('[data-live="signal"]')?.textContent ===
          "Wheel signal online",
      );
      assert.equal(await page.locator("#lock-guess").isDisabled(), false);
      assert.equal(await page.locator("input[name=guess]:checked").count(), 0);
      assert.equal(await page.locator("#best-streak").textContent(), "1");
    },
  );
  await pass(
    "mobile first screen, reflow at 320/390/768/1440, keyboard focus, reduced motion, axe",
    async () => {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `overflow at ${width}`,
        );
        if (width === 390) {
          const action = await page
            .getByRole("link", { name: "Build your overlay" })
            .boundingBox();
          const product = await page.locator(".hero-scene").boundingBox();
          assert.ok(action.y + action.height < 844 && product.y < 844);
          await page.screenshot({
            path: "test/scratch/browser-results/mobile-fixture.png",
            fullPage: true,
          });
        }
      }
      await page.locator("#streamer-name").focus();
      assert.equal(
        await page
          .locator("#streamer-name")
          .evaluate((el) => getComputedStyle(el).outlineStyle),
        "solid",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      state.measurement.coreStatus = "ACTIVE";
      state.measurement.rpmMilli = 120000;
      await page.clock.runFor(3100);
      const before = await page
        .locator("#hero-scene .near-leg")
        .getAttribute("transform");
      await page.clock.runFor(500);
      assert.equal(
        await page.locator("#hero-scene .near-leg").getAttribute("transform"),
        before,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      await writeFile(
        "test/scratch/browser-results/axe.json",
        JSON.stringify(audit.violations, null, 2),
      );
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
    },
  );
  await pass(
    "standalone overlay is transparent at 1080p/720p; all positions and scale endpoints fit",
    async () => {
      const overlay = await context.newPage();
      await overlay.clock.install();
      let overlayState = fixture();
      await overlay.route(API, (route) =>
        route.fulfill({ json: overlayState }),
      );
      for (const size of [
        { width: 1920, height: 1080 },
        { width: 1280, height: 720 },
      ]) {
        await overlay.setViewportSize(size);
        for (const pos of [
          "bottom-left",
          "bottom-right",
          "top-left",
          "top-right",
        ]) {
          for (const scale of [0.5, 2]) {
            overlayState = fixture();
            await overlay.goto(
              `${url}overlay/?pos=${pos}&scale=${scale}&theme=light`,
            );
            await overlay.waitForFunction(
              () =>
                document.querySelector('[data-live="percent"]')?.textContent ===
                "42.6%",
            );
            const b = await overlay.locator(".overlay-widget").boundingBox();
            assert.ok(
              b.x >= 0 &&
                b.y >= 0 &&
                b.x + b.width <= size.width &&
                b.y + b.height <= size.height,
              JSON.stringify({ size, pos, scale, b }),
            );
            assert.equal(
              await overlay.evaluate(
                () => getComputedStyle(document.body).backgroundColor,
              ),
              "rgba(0, 0, 0, 0)",
            );
            assert.equal(
              await overlay.evaluate(
                () =>
                  document.documentElement.scrollWidth <= innerWidth &&
                  document.documentElement.scrollHeight <= innerHeight,
              ),
              true,
            );
            overlayState.builder.projected.blockHeight = "367";
            await overlay.clock.runFor(3100);
            await overlay.waitForFunction(() =>
              document
                .querySelector(".block-banner")
                ?.classList.contains("visible"),
            );
            const banner = await overlay.locator(".block-banner").boundingBox();
            assert.ok(
              banner.x >= 0 &&
                banner.y >= 0 &&
                banner.x + banner.width <= size.width &&
                banner.y + banner.height <= size.height,
              `banner clipped: ${JSON.stringify({ size, pos, scale, banner })}`,
            );
          }
        }
      }
      await overlay.setViewportSize({ width: 1920, height: 1080 });
      overlayState = fixture();
      overlayState.measurement.coreStatus = "ACTIVE";
      overlayState.measurement.rpmMilli = 90000;
      await overlay.goto(`${url}overlay/?hud=1&scale=1&theme=light`);
      await overlay.waitForFunction(
        () => document.querySelector(".overlay-widget")?.dataset.pose === "run",
      );
      const groundShift = () =>
        overlay.evaluate(() =>
          [".ground-near", ".ground-far"].map((selector) => {
            const match = document
              .querySelector(`.overlay-widget ${selector}`)
              .getAttribute("transform")
              ?.match(/translate\((-?[\d.]+) /);
            return match ? Number(match[1]) : 0;
          }),
        );
      await overlay.clock.runFor(2000);
      const [near, far] = await groundShift();
      assert.ok(near < 0 && far < 0, JSON.stringify({ near, far }));
      assert.ok(
        Math.abs(near / far - 3) < 0.01,
        `ground layers must move at different speeds: ${near} / ${far}`,
      );
      assert.equal(
        await overlay.evaluate(
          () =>
            getComputedStyle(document.querySelector(".overlay-ground"))
              .backgroundColor,
        ),
        "rgba(0, 0, 0, 0)",
      );
      overlayState = { ...fixture(), builder: { status: "unavailable" } };
      await overlay.clock.runFor(3100);
      await overlay.waitForFunction(() =>
        document
          .querySelector(".overlay-hud")
          ?.classList.contains("values-muted"),
      );
      assert.equal(
        await overlay
          .locator('[data-live="rpm"]')
          .evaluate((el) => getComputedStyle(el).color),
        "rgb(91, 99, 82)",
      );
      const audit = await new AxeBuilder({ page: overlay })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => v.id),
        [],
      );
      await overlay.goto(
        `${url}overlay/?pos=bad&scale=NaN&hud=0&sound=bad&theme=bad`,
      );
      assert.equal(await overlay.locator(".overlay-hud").isVisible(), false);
      assert.equal(
        await overlay.locator(".overlay-widget").getAttribute("data-pos"),
        "bottom-right",
      );
      await overlay.close();
    },
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  reports.push({ name: "Chromium console and local resources", passed: true });
  await context.close();
  // Capture the real public service separately. No fixture routes exist in this context.
  const live = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
  });
  await live.goto(url);
  await live
    .waitForFunction(
      () =>
        !document
          .querySelector('[data-live="signal"]')
          ?.textContent.includes("Connecting"),
      { timeout: 15000 },
    )
    .catch(() => {});
  const liveSignal = await live.locator('[data-live="signal"]').textContent();
  reports.push({
    name: "Direct live API transport",
    passed: liveSignal === "Wheel signal online",
    detail: liveSignal,
    limitation:
      liveSignal !== "Wheel signal online"
        ? "This sandbox browser returned net::ERR_EMPTY_RESPONSE for the public HTTPS API; curl transport is checked below."
        : undefined,
  });
  if (liveSignal !== "Wheel signal online") {
    // Only the test uses curl as a transport bridge. Bodies are fetched afresh from the real API.
    // No synthetic values are used for documentation screenshots, and this code is not bundled.
    await live.route(API, async (route) => {
      const headersPath = resolve(
        "test/scratch/browser-results/live-headers.txt",
      );
      const args = [
        "--silent",
        "--show-error",
        "--fail",
        "--max-time",
        "12",
        "-D",
        headersPath,
      ];
      const etag = route.request().headers()["if-none-match"];
      if (etag) args.push("-H", `If-None-Match: ${etag}`);
      try {
        const { stdout } = await runFile("curl", [...args, API]);
        const raw = await readFile(headersPath, "utf8");
        const tag = raw.match(/^etag:\s*(.+)$/im)?.[1].trim();
        const notModified = /HTTP\/[\d.]+ 304/.test(raw);
        await route.fulfill({
          status: notModified ? 304 : 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "ETag, Retry-After",
            ...(tag ? { ETag: tag } : {}),
          },
          body: notModified ? undefined : stdout,
        });
        if (!notModified)
          await writeFile(
            "test/scratch/browser-results/live-response.json",
            stdout,
          );
      } catch {
        await route.abort();
      }
    });
    await live.reload();
    await live.waitForFunction(
      () =>
        document.querySelector('[data-live="signal"]')?.textContent ===
        "Wheel signal online",
      { timeout: 15000 },
    );
    reports.push({
      name: "Real API data through a test-only curl transport bridge",
      passed: true,
    });
  }
  await live.screenshot({
    path: "artifacts/screenshots/landing-desktop.png",
    fullPage: false,
  });
  await live.setViewportSize({ width: 390, height: 844 });
  await live.screenshot({
    path: "artifacts/screenshots/landing-mobile.png",
    fullPage: false,
  });
  await live.screenshot({ path: "artifacts/screenshots/first-screen-390.png" });
  await live.setViewportSize({ width: 1920, height: 1080 });
  await live.goto(`${url}overlay/?pos=bottom-right&scale=1.5&hud=1`);
  await live
    .waitForFunction(
      () =>
        document.querySelector('[data-live="percent"]')?.textContent !== "—",
      { timeout: 15000 },
    )
    .catch(() => {});
  await live.screenshot({
    path: "artifacts/screenshots/overlay-1080.png",
    omitBackground: true,
  });

  await live.close();
  await browser.close();
  browser = null;
  // Safari engine primary flow, when this host has the native dependencies.
  try {
    const safari = await webkit.launch({
      headless: true,
      ...(process.env.RELS_WEBKIT
        ? { executablePath: process.env.RELS_WEBKIT }
        : {}),
    });
    try {
      const p = await safari.newPage({ viewport: { width: 390, height: 844 } });
      await p.route(API, (route) => route.fulfill({ json: fixture() }));
      await p.goto(url);
      await p.waitForFunction(
        () =>
          document.querySelector('[data-live="percent"]')?.textContent ===
          "42.6%",
      );
      await p.getByLabel("Position", { exact: true }).selectOption("top-left");
      await p.getByLabel("Streamer name").fill("Safari");
      assert.equal(
        new URL(await p.locator("#obs-url").inputValue()).searchParams.get(
          "name",
        ),
        "Safari",
      );
      await p.getByRole("radio", { name: /Under 10 min/ }).check();
      await p.getByRole("button", { name: "Lock in my guess" }).click();
      assert.equal(await p.locator("#lock-guess").isDisabled(), true);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      reports.push({ name: "WebKit mobile builder and game", passed: true });
    } finally {
      await safari.close();
    }
  } catch (e) {
    reports.push({
      name: "WebKit mobile builder and game",
      passed: false,
      limitation: e.message.split("\n").slice(0, 7).join("\n"),
    });
  }
} catch (e) {
  reports.push({
    name: "Browser validation failure",
    passed: false,
    detail: e.stack,
  });
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  await writeFile(
    "test/scratch/browser-results/results.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(JSON.stringify(reports, null, 2));
}
