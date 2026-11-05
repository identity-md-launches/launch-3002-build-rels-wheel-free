import type { Signal } from "./api.ts";
import type { OverlayOptions } from "./options.ts";
export type Pose =
  | "waiting"
  | "run"
  | "idle"
  | "sleep"
  | "search"
  | "fault"
  | "slash"
  | "bow"
  | "win"
  | "lose";
const RUN_FRAMES = [
  [34, -38, -30, 24, -35, 32, 0.96, 1.04],
  [15, -14, -15, 62, -18, 17, 1.03, 0.97],
  [-15, 12, 16, 76, 16, -18, 1.05, 0.95],
  [-32, 22, 34, 24, 35, -34, 0.98, 1.02],
  [-30, 24, 34, -38, 32, -35, 0.96, 1.04],
  [-15, 62, 15, -14, 17, -18, 1.03, 0.97],
  [16, 76, -15, 12, -18, 16, 1.05, 0.95],
  [34, 24, -32, 22, -34, 35, 0.98, 1.02],
];
export function mascotSVG(): string {
  return `<svg class="rels-art" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="character-shadow" cx="174" cy="306" rx="61" ry="9" fill="#070e0b" opacity=".45"/>
  <g class="far-leg" transform="rotate(0 180 248)"><path d="m169 241 27 3-2 31-25-1Z" fill="#1a211c" stroke="#080e0a" stroke-width="3"/><g class="far-shin"><path d="m170 265 22 1-2 33-21-1" fill="#d0c9a8"/><path d="m166 291 25-1 12 10q1 7-8 7h-32Z" fill="#292b21" stroke="#090e0b" stroke-width="3"/><path d="m174 294 13 9" stroke="#a99765" stroke-width="4"/></g></g>
  <g class="near-leg"><path d="m142 240 29 3-3 30-29 1Z" fill="#111a15" stroke="#080e0a" stroke-width="3"/><g class="near-shin"><path d="m141 265 25 1-3 33-24-1" fill="#eee4bf"/><path d="m138 291 25-1 16 10q1 7-8 7h-37Z" fill="#2a2c22" stroke="#090e0b" stroke-width="3"/><path d="m145 294 15 9" stroke="#bdad79" stroke-width="4"/></g></g>
  <g class="seated-legs"><path d="M158 278q-51-9-50 13 4 21 57 10 43 13 61-4 17-22-45-20" fill="#1b241d" stroke="#080e0a" stroke-width="4"/><path d="m147 293 29 5-7 9-32-5" fill="#e7daba"/><path d="m169 295 28 4-5 10-23-3" fill="#34372a"/></g>
  <g class="upper-body">
    <g class="far-arm"><path class="far-sleeve" d="m182 202 26 2 36 39-29 22-37-37Z" fill="#151f18" stroke="#080e0a" stroke-width="4"/><path d="m227 242 13 4q9 11-2 15l-14-8" fill="#e9d8ae" stroke="#080e0a" stroke-width="3"/></g>
    <path class="kimono" d="m141 192 46-2 18 61q-31 14-75-1Z" fill="#202a21" stroke="#080e0a" stroke-width="4"/>
    <path d="m144 197 19 29 21-31-11 40-19-1Z" fill="#eee1b9"/><path d="m144 197 18 31-23-12" fill="#4a5140"/>
    <path d="m133 237 65-1 3 13-70 2Z" fill="#c49c52" stroke="#080e0a" stroke-width="3"/><path d="m163 239 8-4 9 9-9 7-10-5" fill="#e6c674"/>
    <g class="katana-hip"><path d="m140 247-61 31q-10 2-10-4l67-38" fill="#202c25" stroke="#080e0a" stroke-width="5"/><path d="m78 269 7 8" stroke="#c6a35d" stroke-width="4"/><g class="sword-handle"><path d="m135 241 28-17" stroke="#090f0b" stroke-width="12" stroke-linecap="round"/><path d="m141 232 4 8m3-12 4 8m3-12 4 8" stroke="#b9a16a" stroke-width="3"/><path d="m131 233 13 18" stroke="#edc56c" stroke-width="5" stroke-linecap="round"/></g></g>
    <g class="near-arm"><path class="sleeve" d="m142 204-30 1-15 42 37 20 31-36" fill="#253027" stroke="#080e0a" stroke-width="4"/><path d="m103 238 32 15" stroke="#45503d" stroke-width="3"/><path d="m128 248 12-1q13 2 11 13-7 8-16 0" fill="#eee0b7" stroke="#080e0a" stroke-width="3"/></g>
    <g class="helmet">
      <path d="M109 157q-10 35 13 46l20-17m57-1 25 12 9-34" fill="#d0c39e" stroke="#131c13" stroke-width="4"/>
      <path d="M104 140q-2-70 65-76 66-4 77 58l-5 47q-58 47-119 4Z" fill="#f0e6c5" stroke="#10190f" stroke-width="5"/>
      <path d="M116 131q-1-46 46-54" fill="none" stroke="#fff5d8" stroke-width="9" stroke-linecap="round"/>
      <path d="m171 112 67 1q11 21 3 45l-69 4q-28-5-28-24 0-20 27-26Z" fill="#dc8c43" stroke="#9d6233" stroke-width="3"/>
      <path d="m172 119 59-1" stroke="#ffc77a" stroke-width="4" stroke-linecap="round"/>
      <path class="eye-open" d="m205 130 9 5-10 5" fill="none" stroke="#392b1d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="eye-sleep" d="m200 138q8 5 16-2" fill="none" stroke="#392b1d" stroke-width="4" stroke-linecap="round"/>
      <path d="m229 144 9 1" stroke="#f4bc75" stroke-width="3" stroke-linecap="round"/>
      <path d="m155 175 17 4-4 19-19-4Z" fill="#d9cda8" stroke="#141d13" stroke-width="3"/>
      <circle cx="118" cy="151" r="9" fill="#d5c69e" stroke="#b3a37c" stroke-width="3"/>
      <g class="kuni">
        <path class="kuni-tail" d="M149 70q-32-8-22-28 5-11 16-2-18 5-1 15" fill="#e9bc57" stroke="#775f2b" stroke-width="3" stroke-linecap="round"/>
        <path d="M144 61q-8-24 13-32 24-9 29 14 7-19 23-9 10 8 0 19-4 12-18 11l-7 11q-23 7-40-2Z" fill="#edc766" stroke="#775f2b" stroke-width="3"/>
        <path d="m154 33 4-9 8 7m30 4 8-10 1 14" fill="#f6e6b4" stroke="#775f2b" stroke-width="2"/>
        <path d="M151 62q18 9 29-3" fill="none" stroke="#c7953d" stroke-width="4" stroke-linecap="round"/>
        <path d="m176 48-11-3 1 16 13-3" fill="#dba84a" stroke="#ab7e36" stroke-width="2"/>
        <path class="kuni-eye" d="m198 44 1 1" stroke="#3e3c21" stroke-width="4" stroke-linecap="round"/>
        <path class="kuni-sleep-eye" d="m195 45 6 1" stroke="#3e3c21" stroke-width="2" stroke-linecap="round"/>
        <path d="m202 55 6-1" stroke="#aa7b31" stroke-width="2" stroke-linecap="round"/>
        <path d="m166 71-3 6m12-5 1 5" stroke="#775f2b" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="kuni-asleep">
        <path class="kuni-sleep-tail" d="M149 70q-31 7-25-11 4-7 12-3" fill="none" stroke="#e9bc57" stroke-width="9" stroke-linecap="round"/>
        <path d="M142 67q-9-24 16-26 26-2 27 22 18-11 22 4 3 13-22 13h-30q-13 0-13-13Z" fill="#edc766" stroke="#775f2b" stroke-width="3"/>
        <path d="M153 60q23-17 24 5-1 13-19 4" fill="none" stroke="#bf8e38" stroke-width="4" stroke-linecap="round"/>
        <path d="m183 64 5-10 4 10" fill="#f6e6b4" stroke="#775f2b" stroke-width="2"/>
        <path d="m192 70 7 1" stroke="#3e3c21" stroke-width="2" stroke-linecap="round"/>
      </g>
    </g>
  </g>
  <g class="win-arms" stroke="#080e0a" stroke-width="4" stroke-linejoin="round">
    <path d="m144 209-29 4-35-49 31-22 40 44Z" fill="#253027"/><path d="m192 209 26 4 45-49-29-22-43 44Z" fill="#253027"/>
    <path d="m82 156-5-13q-1-13 12-13 15-1 16 13l-1 6" fill="#eee0b7"/><path d="m241 149 1-7q2-14 15-12 13 1 10 15l-5 13" fill="#eee0b7"/>
  </g>
  <g class="drawn-sword"><path d="m184 208 108-63q-32 40-100 73" fill="#fff2be" stroke="#ddbd66" stroke-width="2"/><path d="m181 210-22 13" stroke="#242b20" stroke-width="11"/><path d="m180 199 13 23" stroke="#ebc368" stroke-width="5"/></g>
  <g class="sleep-bubbles" fill="#e7d9b1" font-family="monospace" font-size="20"><text x="255" y="143">z</text><text x="276" y="115" font-size="25">Z</text><text x="301" y="85">z</text></g>
  <g class="question-bubble"><path d="M269 88q-25-8-24-32 1-26 26-26 29 0 29 25 0 21-21 26l-10 16Z" fill="#f1e5bc"/><text x="262" y="67" fill="#383d2c" font-size="29" font-family="Georgia,serif">?</text></g>
  <g class="slash-streak" fill="none" stroke-linecap="round"><path d="M27 265Q105 73 333 96 137 102 50 287" stroke="#edc56c" stroke-width="5"/><path d="M18 246Q133 83 333 96" stroke="#fff2c3" stroke-width="3"/></g>
  <g class="confetti">${Array.from({ length: 16 }, (_, i) => `<rect class="confetti-bit" x="${45 + i * 17}" y="${80 + (i % 4) * 20}" width="${i % 2 ? 5 : 8}" height="4" rx="1" fill="${["#edc56c", "#f0e6c5", "#8aaf83"][i % 3]}"/>`).join("")}</g>
  </svg>`;
}
export function dojoSVG(): string {
  return `<svg class="dojo-backdrop" viewBox="0 0 720 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><pattern id="sky-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#91a98a" opacity=".1"/></pattern></defs>
  <rect width="720" height="460" fill="#1a2922"/><rect width="720" height="460" fill="url(#sky-dots)"/>
  <circle cx="543" cy="130" r="58" fill="#e1d8b5"/><path d="M505 96h30v7h-30m52 48h30v7h-30m-68-21h19v6h-19" fill="#c8c8a1" opacity=".55"/>
  <path d="m0 258 67-74 89 93 88-112 112 120 93-87 112 103 70-60 89 55v164H0Z" fill="#24382b"/>
  <path d="m0 319 123-69 119 78 121-49 116 51 121-76 120 59v147H0Z" fill="#1c3025"/>
  <g fill="#101e18"><path d="m575 196 10 151h12l3-148m65-3-3 149h14l6-149"/><path d="m550 177 148-2-5 17-139 8-10-10Zm13 36 125-6-2 10-122 6Z"/><path d="m618 192 8 21h9l-7-22"/></g>
  <g fill="#293c2b"><path d="m0 373 14-18 4 21 19-12 7 20 11-21 6 22 11-7 4 26H0m644-18 10-26 8 26 15-34 7 28 13-17 9 28 14-17v52h-76Z"/></g>
  <path d="M0 389h720v71H0Z" fill="#18271e"/><path d="M0 390h720" stroke="#70815a" stroke-width="1" opacity=".4"/>
  <path d="m0 423 720-11M0 452l720-28" stroke="#455139" opacity=".3"/>
  <g class="ground-far" stroke="#7b8052" opacity=".25"><path d="m44 396h31m94 4h13m231-3h45m99 6h26m59-12h12"/></g>
  <g class="ground-near" stroke="#ad9a5c" opacity=".45"><path d="m15 435h31m99 4h42m118-4h38m136-3h28m102 8h51"/></g>
  <g fill="#9eaf80" opacity=".45"><rect x="105" y="90" width="3" height="3"/><rect x="349" y="56" width="3" height="3"/><rect x="652" y="92" width="3" height="3"/><rect x="415" y="155" width="2" height="2"/><rect x="220" y="126" width="2" height="2"/></g>
  </svg>`;
}
export function overlayMarkup(): string {
  return `<div class="overlay-widget" data-pos="bottom-right" data-theme="dark">
    <div class="block-banner" role="status"><span class="banner-main"></span><span class="banner-name"></span></div>
    <div class="mascot-slot">${mascotSVG()}<span class="pose-label"></span></div>
    <div class="overlay-hud"><div class="overlay-values"><span><b data-live="rpm">—</b> RPM</span><span><b data-live="speed">—</b> m/min</span><span><b data-live="distance">—</b> m today</span></div><div class="overlay-block"><span data-live="block">Waiting for wheel</span><span data-live="percent">—</span></div><div class="progress-track"><div class="progress-fill"></div></div><p class="overlay-work"><span data-live="work">—</span> work left to next block</p><p class="overlay-settled" data-live="settled">Settlement unknown</p><p class="overlay-status" data-live="short-status">Connecting to wheel…</p></div>
  </div>`;
}
const rotate = (el: SVGElement | null, angle: number, x: number, y: number) =>
  el?.setAttribute("transform", `rotate(${angle.toFixed(2)} ${x} ${y})`);
export class RelsScene {
  private art: SVGElement;
  private parts: Record<string, SVGElement | null> = {};
  private time = 0;
  private phase = 0;
  private speed = 0;
  private basePose: Pose = "waiting";
  private action: { pose: Pose; until: number } | null = null;
  private celebrationQueue: bigint[] = [];
  private currentBlock: bigint | null = null;
  private celebrationUntil = 0;
  private name = "";
  private sound = false;
  private soundPlayed = false;
  private audioContext: AudioContext | null = null;
  pose: Pose = "waiting";
  get celebrating(): boolean {
    return this.currentBlock !== null || this.celebrationQueue.length > 0;
  }
  constructor(readonly element: HTMLElement) {
    this.art = element.querySelector(".rels-art")!;
    for (const name of [
      "far-leg",
      "near-leg",
      "far-shin",
      "near-shin",
      "near-arm",
      "far-arm",
      "upper-body",
      "helmet",
      "kuni",
      "kuni-tail",
      "kuni-sleep-tail",
      "sleeve",
      "far-sleeve",
      "win-arms",
      "ground-near",
      "ground-far",
    ])
      this.parts[name] = element.querySelector(`.${name}`);
  }
  setOptions(options: OverlayOptions): void {
    this.name = options.name;
    this.sound = options.sound;
  }
  setSignal(signal: Signal, now: number): void {
    const m = signal.latestMeasurement ?? signal.data?.measurement;
    this.basePose = signal.loading
      ? "waiting"
      : m?.coreStatus === "COUNTER_FAULT" && signal.latestMeasurement
        ? "fault"
        : signal.lost || m?.freshness === "stale"
          ? "search"
          : m?.coreStatus === "ACTIVE"
            ? "run"
            : signal.idleSince !== null && now - signal.idleSince > 20_000
              ? "sleep"
              : "idle";
    const target =
      this.basePose === "run" && m
        ? Math.min(
            180_000,
            Number(m.rpmMilli > 180_000n ? 180_000n : m.rpmMilli),
          ) / 1000
        : 0;
    this.targetSpeed = target;
    const label = this.element.querySelector(".pose-label");
    if (label)
      label.textContent = this.basePose === "fault" ? "wheel hiccup" : "";
  }
  private targetSpeed = 0;
  cheer(): void {
    const queuedTime =
      (this.currentBlock ? this.celebrationUntil - this.time : 0) +
      this.celebrationQueue.length * 2800;
    this.action = { pose: "bow", until: this.time + queuedTime + 1500 };
  }
  react(won: boolean): void {
    this.action = { pose: won ? "win" : "lose", until: this.time + 2200 };
  }
  celebrate(heights: bigint[]): void {
    // Bound the whole pending queue; old bursts cannot monopolize the scene.
    this.celebrationQueue.push(
      ...heights.slice(
        0,
        Math.max(
          0,
          3 - this.celebrationQueue.length - (this.currentBlock ? 1 : 0),
        ),
      ),
    );
  }
  async unlockSound(): Promise<void> {
    try {
      this.audioContext ??= new AudioContext();
      if (this.audioContext.state === "suspended")
        await this.audioContext.resume();
    } catch {
      /* The scene works if a browser or OBS blocks audio. */
    }
  }
  private ding(): void {
    if (!this.sound) return;
    void this.unlockSound().then(() => {
      const ctx = this.audioContext;
      if (!ctx || ctx.state !== "running") return;
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1760,
        ctx.currentTime + 0.08,
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.46);
    });
  }
  frame(dt: number, reduced: boolean, paused: boolean): void {
    if (paused) return;
    this.time += dt;
    if (!this.currentBlock && this.celebrationQueue.length) {
      this.currentBlock = this.celebrationQueue.shift()!;
      this.celebrationUntil = this.time + 2800;
      this.soundPlayed = false;
      const banner = this.element.querySelector(".block-banner");
      banner?.classList.add("visible");
      const title = banner?.querySelector(".banner-main");
      if (title)
        title.textContent = `BLOCK #${this.currentBlock} MINED BY SQUEEKTOSHI`;
      const name = banner?.querySelector(".banner-name");
      if (name)
        name.textContent = this.name ? `Celebrating with ${this.name}` : "";
    }
    if (this.currentBlock && this.time >= this.celebrationUntil) {
      this.currentBlock = null;
      this.element.querySelector(".block-banner")?.classList.remove("visible");
    }
    if (this.currentBlock && !this.soundPlayed) {
      this.ding();
      this.soundPlayed = true;
    }
    if (this.action && this.time >= this.action.until) this.action = null;
    const previousPose = this.pose;
    this.pose = this.currentBlock
      ? "slash"
      : (this.action?.pose ?? this.basePose);
    if (reduced && previousPose !== this.pose) {
      this.art.animate([{ opacity: 0.65 }, { opacity: 1 }], {
        duration: 150,
        easing: "linear",
      });
    }
    this.element.dataset.pose = this.pose;
    this.element.dataset.reduced = String(reduced);
    // Reduced motion uses static pose changes and opacity, without a run, parallax or nod loop.
    this.speed += (this.targetSpeed - this.speed) * (1 - Math.exp(-dt / 450));
    this.phase +=
      (dt / 1000) * Math.min(4, Math.max(0.65, 0.65 + this.speed / 45));
    const t = this.time / 1000;
    let nearLeg = 0,
      farLeg = 0,
      nearShin = 0,
      farShin = 0,
      nearArm = 0,
      farArm = 0,
      sx = 1,
      sy = 1,
      head = 0;
    let upperY = this.pose === "sleep" ? 22 : 0;
    if (!reduced) {
      if (this.pose === "run") {
        const p = (this.phase * 8) % 8,
          index = Math.floor(p),
          mix = p - index;
        const a = RUN_FRAMES[index],
          b = RUN_FRAMES[(index + 1) % 8];
        const v = a.map((x, i) => x + (b[i] - x) * mix);
        [nearLeg, nearShin, farLeg, farShin, nearArm, farArm, sx, sy] = v;
      } else if (this.pose === "sleep") {
        head = 5 + Math.sin(t * 0.7) * 4;
        nearArm = 8 + Math.sin(t) * 2;
        farArm = -7;
      } else if (this.pose === "idle") {
        nearArm = Math.sin(t * 1.1) * 3;
        farArm = Math.sin(t * 1.1 + 1) * 2;
      } else if (this.pose === "search" || this.pose === "waiting") {
        head = Math.sin(t * 1.6) * 9;
        nearArm = -7;
      } else if (this.pose === "fault") {
        nearArm = 145 + Math.sin(t * 7) * 7;
        head = -5;
      } else if (this.pose === "bow") {
        head =
          23 *
          Math.sin(Math.PI * (1 - (this.action!.until - this.time) / 1500));
        nearArm = -20;
        farArm = 15;
        upperY = 3;
      } else if (this.pose === "win") {
        nearArm = 145;
        farArm = -140;
        nearLeg = -12;
        farLeg = 12;
        sx = 1.04;
        sy = 0.97;
      } else if (this.pose === "lose") {
        head = 19 + Math.sin(t * 3) * 3;
        nearArm = 12;
        upperY = 8;
      } else if (this.pose === "slash") {
        const draw = Math.min(
          1,
          (2800 - (this.celebrationUntil - this.time)) / 350,
        );
        nearArm = 25 - 90 * draw;
        farArm = -35;
        nearLeg = 25;
        farLeg = -25;
        sx = 1.08;
        sy = 0.95;
        head = -8;
      }
    } else if (this.pose === "bow" || this.pose === "lose") head = 15;
    else if (this.pose === "fault") nearArm = 140;
    else if (this.pose === "win") {
      nearArm = 130;
      farArm = -130;
    } else if (this.pose === "slash") {
      nearArm = -65;
      farArm = -35;
    }
    rotate(this.parts["near-leg"], nearLeg, 155, 247);
    rotate(this.parts["far-leg"], farLeg, 181, 248);
    rotate(this.parts["near-shin"], nearShin, 153, 269);
    rotate(this.parts["far-shin"], farShin, 181, 269);
    rotate(this.parts["near-arm"], nearArm, 142, 209);
    rotate(this.parts["far-arm"], farArm, 188, 208);
    rotate(
      this.parts["win-arms"],
      !reduced ? Math.sin(t * 8) * 3 : 0,
      170,
      209,
    );
    const sleeveLag =
      !reduced && this.pose === "run"
        ? Math.sin(this.phase * Math.PI * 2 - 0.8) * 9
        : 0;
    rotate(this.parts.sleeve, sleeveLag, 142, 209);
    rotate(this.parts["far-sleeve"], -sleeveLag, 188, 208);
    rotate(this.parts.helmet, head, 170, 189);
    if (
      !reduced &&
      (this.pose === "search" || this.pose === "waiting") &&
      Math.sin(t * 1.1) < -0.25
    ) {
      this.parts.helmet?.setAttribute(
        "transform",
        `translate(340 0) scale(-1 1) rotate(${head.toFixed(2)} 170 189)`,
      );
    }
    this.parts["upper-body"]?.setAttribute(
      "transform",
      `translate(0 ${upperY}) translate(170 247) scale(${sx} ${sy}) translate(-170 -247)`,
    );
    const tail = reduced
      ? 0
      : Math.sin(t * (2 + this.speed / 12)) *
        (this.pose === "sleep"
          ? Math.sin(t / 4) > 0.9
            ? 8
            : 0
          : 10 + this.speed / 12);
    rotate(this.parts["kuni-tail"], tail, 147, 66);
    rotate(this.parts["kuni-sleep-tail"], tail, 147, 66);
    rotate(
      this.parts.kuni,
      !reduced && this.pose === "slash"
        ? (1 - (this.celebrationUntil - this.time) / 2800) * 720
        : 0,
      173,
      54,
    );
    const blink = this.pose === "sleep" || (!reduced && t % 5 > 4.8);
    this.art.classList.toggle("kuni-blink", blink);
    if (!reduced && this.pose === "run") {
      this.groundOffset = (this.groundOffset + dt * this.speed * 0.0015) % 90;
      this.parts["ground-near"]?.setAttribute(
        "transform",
        `translate(${-this.groundOffset} 0)`,
      );
      this.parts["ground-far"]?.setAttribute(
        "transform",
        `translate(${-this.groundOffset / 3} 0)`,
      );
    }
    if (reduced) {
      this.parts["ground-near"]?.removeAttribute("transform");
      this.parts["ground-far"]?.removeAttribute("transform");
    }
    const progress = this.currentBlock
      ? 1 - (this.celebrationUntil - this.time) / 2800
      : 0;
    this.art.style.setProperty("--celebration-progress", String(progress));
    if (!reduced && this.currentBlock) {
      this.art
        .querySelectorAll<SVGElement>(".confetti-bit")
        .forEach((el, i) =>
          el.setAttribute(
            "transform",
            `translate(${Math.sin(i * 7 + progress * 3) * 35} ${progress * (120 + i * 4)}) rotate(${progress * 360} ${45 + i * 17} ${80 + (i % 4) * 20})`,
          ),
        );
    }
  }
  private groundOffset = 0;
}
