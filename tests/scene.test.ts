import test from "node:test";
import assert from "node:assert/strict";
import type { CoreStatus, Signal } from "../src/api.ts";
import { dojoSVG, overlayMarkup, RelsScene } from "../src/scene.ts";
// Just enough of the DOM for RelsScene: it only writes attributes and text to what it finds.
function fakeNode() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    textContent: "",
    dataset: {} as Record<string, string>,
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    animate() {},
    querySelector: (_selector: string) => null as unknown,
    querySelectorAll: () => [],
  };
}
function fakeScene() {
  const nodes = new Map<string, ReturnType<typeof fakeNode>>();
  const root = fakeNode();
  root.querySelector = (selector: string) => {
    if (!overlayMarkup().includes(`class="${selector.slice(1)}"`)) return null;
    if (!nodes.has(selector)) nodes.set(selector, fakeNode());
    return nodes.get(selector);
  };
  return {
    root,
    nodes,
    scene: new RelsScene(root as unknown as HTMLElement),
  };
}
function signal(
  coreStatus: CoreStatus,
  freshness: "online" | "stale",
  lost = false,
  rpmMilli = 0n,
): Signal {
  return {
    data: null,
    lost,
    loading: false,
    reason: "",
    latestMeasurement: {
      coreStatus,
      freshness,
      rpmMilli,
      speedMmPerSecond: 0n,
      distanceMm: 200000n,
      observedAt: "2026-11-05T17:00:00Z",
    },
    lastActiveAt: null,
    idleSince: null,
    checkedAt: null,
  };
}
const count = (markup: string, name: string) =>
  markup.split(`class="${name}"`).length - 1;
test("the overlay and hero both carry the two ground layers", () => {
  for (const markup of [overlayMarkup(), dojoSVG()]) {
    assert.equal(count(markup, "ground-near"), 1);
    assert.equal(count(markup, "ground-far"), 1);
  }
});
test("overlay ground is stroke-only, leaving the OBS canvas transparent", () => {
  const ground = overlayMarkup().match(
    /<svg class="overlay-ground"[\s\S]*?<\/svg>/,
  )![0];
  assert.match(ground, /fill="none"/);
  assert.doesNotMatch(ground, /<rect|fill="#/);
});
test("each ground layer repeats at the distance it travels before wrapping", () => {
  const starts = (name: string) => {
    const group = overlayMarkup().match(
      new RegExp(`<g class="${name}"><path d="([^"]+)"`),
    )![1];
    return [...group.matchAll(/M(\d+) /g)].map((m) => Number(m[1]));
  };
  for (const [name, period] of [
    ["ground-near", 90],
    ["ground-far", 30],
  ] as const) {
    const xs = starts(name);
    assert.equal(xs[1] - xs[0], period);
    // Still covers the 340-wide canvas once fully shifted by the 90-unit wrap.
    assert.ok(xs.at(-1)! + period >= 340 + 90);
  }
});
test("ground layers scroll faster with RPM and at different speeds", () => {
  const shift = (rpmMilli: bigint) => {
    const { scene, nodes } = fakeScene();
    scene.setSignal(signal("ACTIVE", "online", false, rpmMilli), 0);
    // Stays under one 90-unit wrap, so the two readings compare directly.
    for (let i = 0; i < 12; i++) scene.frame(16.67, false, false);
    assert.equal(scene.pose, "run");
    const x = (name: string) =>
      Number(
        nodes
          .get(`.${name}`)!
          .attributes.get("transform")!
          .match(/translate\((-?[\d.]+) /)![1],
      );
    return { near: x("ground-near"), far: x("ground-far") };
  };
  const slow = shift(30000n),
    fast = shift(90000n);
  assert.ok(slow.near < 0 && slow.far < 0);
  assert.ok(Math.abs(fast.near) > Math.abs(slow.near));
  assert.ok(Math.abs(fast.far) > Math.abs(slow.far));
  assert.ok(Math.abs(fast.near / fast.far - 3) < 1e-9);
});
test("a stale or lost signal outranks every core status", () => {
  const cases: [Signal, string][] = [
    [signal("ACTIVE", "stale"), "search"],
    [signal("IDLE", "stale"), "search"],
    [signal("COUNTER_FAULT", "stale"), "search"],
    [signal("COUNTER_FAULT", "online", true), "search"],
    [signal("COUNTER_FAULT", "online"), "fault"],
    [signal("ACTIVE", "online"), "run"],
    [signal("IDLE", "online"), "idle"],
  ];
  for (const [input, pose] of cases) {
    const { scene, nodes } = fakeScene();
    const label = fakeNode();
    nodes.set(".pose-label", label);
    scene.setSignal(input, 0);
    scene.frame(16.67, false, false);
    assert.equal(scene.pose, pose, JSON.stringify(input.latestMeasurement?.coreStatus));
    assert.equal(label.textContent, pose === "fault" ? "wheel hiccup" : "");
  }
});
