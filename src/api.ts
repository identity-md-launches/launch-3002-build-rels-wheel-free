/** Only the documented v1 fields are read. Additional fields are deliberately ignored. */
export const API_URL = "https://api.squeekchain.com/v1/status";
export const PROGRESS_SCALE = 1_000_000_000n;
export type CoreStatus = "ACTIVE" | "IDLE" | "COUNTER_FAULT";
export interface Measurement {
  coreStatus: CoreStatus;
  freshness: "online" | "stale";
  rpmMilli: bigint;
  speedMmPerSecond: bigint;
  distanceMm: bigint;
  observedAt: string;
}
export interface LiveStatus {
  measurement: Measurement;
  projected: {
    blockHeight: bigint;
    blockProgress: bigint;
    workPerThousandBlocks: bigint;
  };
  anchor: { blockHeight: bigint; transactionHash: string | null };
}
export type ParsedStatus =
  | { kind: "available"; data: LiveStatus }
  | { kind: "unavailable"; reason: string; measurement?: Measurement };
export interface Signal {
  data: LiveStatus | null;
  lost: boolean;
  loading: boolean;
  reason: string;
  latestMeasurement?: Measurement;
  lastActiveAt: number | null;
  idleSince: number | null;
  checkedAt: number | null;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid status object");
  return value as Record<string, unknown>;
}
export function decimal(value: unknown, allowNumber = false): bigint {
  if (
    allowNumber &&
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
    return BigInt(value);
  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value))
    throw new Error("Invalid unsigned decimal");
  return BigInt(value);
}
function measurement(value: unknown): Measurement {
  const m = record(value);
  if (!["ACTIVE", "IDLE", "COUNTER_FAULT"].includes(m.coreStatus as string))
    throw new Error("Unknown core status");
  if (m.freshness !== "online" && m.freshness !== "stale")
    throw new Error("Unknown freshness");
  if (
    typeof m.observedAt !== "string" ||
    !Number.isFinite(Date.parse(m.observedAt))
  )
    throw new Error("Invalid observation time");
  return {
    coreStatus: m.coreStatus as CoreStatus,
    freshness: m.freshness,
    observedAt: m.observedAt,
    rpmMilli: decimal(m.rpmMilli, true),
    speedMmPerSecond: decimal(m.speedMmPerSecond, true),
    distanceMm: decimal(m.distanceMm, true),
  };
}
export function parseStatus(value: unknown): ParsedStatus {
  const root = record(value);
  if (root.schemaVersion !== 1) throw new Error("Unsupported status schema");
  if (root.status === "unavailable")
    return { kind: "unavailable", reason: "The wheel API is unavailable." };
  if (root.measurement == null)
    return {
      kind: "unavailable",
      reason: "Waiting for the first wheel measurement.",
    };
  const m = measurement(root.measurement);
  const builder = record(root.builder);
  if (builder.status === "unavailable")
    return {
      kind: "unavailable",
      reason: "The block builder is unavailable.",
      measurement: m,
    };
  if (builder.status !== "available") throw new Error("Unknown builder status");
  const p = record(builder.projected),
    a = record(builder.anchor);
  const progress = decimal(p.blockProgress),
    work = decimal(p.workPerThousandBlocks);
  if (progress > PROGRESS_SCALE || work === 0n)
    throw new Error("Invalid block projection");
  const transactionHash =
    typeof a.transactionHash === "string" &&
    /^0x[0-9a-fA-F]{64}$/.test(a.transactionHash)
      ? a.transactionHash
      : null;
  return {
    kind: "available",
    data: {
      measurement: m,
      projected: {
        blockHeight: decimal(p.blockHeight),
        blockProgress: progress,
        workPerThousandBlocks: work,
      },
      anchor: { blockHeight: decimal(a.blockHeight), transactionHash },
    },
  };
}
/** Format rational numbers without ever converting an unbounded integer to Number. */
export function fixed(value: bigint, divisor: bigint, digits = 1): string {
  const scale = 10n ** BigInt(digits);
  const rounded = (value * scale + divisor / 2n) / divisor;
  const whole = (rounded / scale).toLocaleString("en-US");
  return digits
    ? `${whole}.${(rounded % scale).toString().padStart(digits, "0")}`
    : whole;
}
export function progressPercent(progress: bigint): string {
  return fixed(progress * 100n, PROGRESS_SCALE);
}
export function workLeft(data: LiveStatus): string {
  return fixed(
    (PROGRESS_SCALE - data.projected.blockProgress) *
      data.projected.workPerThousandBlocks,
    PROGRESS_SCALE * 1000n,
    3,
  );
}
export function retryDelay(
  header: string | null,
  failures: number,
  now = Date.now(),
): number {
  let retry = 0;
  if (header) {
    const seconds = Number(header);
    retry = Number.isFinite(seconds)
      ? Math.max(0, seconds * 1000)
      : Math.max(0, Date.parse(header) - now) || 0;
  }
  // Respect the complete server delay, then add capped exponential backoff.
  return (
    retry + Math.min(60_000, 3000 * 2 ** Math.min(Math.max(0, failures - 1), 5))
  );
}
export class StatusPoller {
  private listeners = new Set<(signal: Signal) => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | null = null;
  private etag: string | null = null;
  private cached: ParsedStatus | null = null;
  private failures = 0;
  private running = false;
  private pending = false;
  private retryAt = 0;
  signal: Signal = {
    data: null,
    lost: false,
    loading: true,
    reason: "",
    lastActiveAt: null,
    idleSince: null,
    checkedAt: null,
  };
  private fetcher: typeof fetch;
  private now: () => number;
  constructor(
    fetcher: typeof fetch = (...args) => fetch(...args),
    now: () => number = Date.now,
  ) {
    this.fetcher = fetcher;
    this.now = now;
  }
  subscribe(listener: (signal: Signal) => void): () => void {
    this.listeners.add(listener);
    listener(this.signal);
    return () => this.listeners.delete(listener);
  }
  start(): void {
    if (!this.running) {
      this.running = true;
      this.schedule();
    }
  }
  stop(): void {
    this.running = false;
    clearTimeout(this.timer);
    this.controller?.abort();
  }
  private schedule(): void {
    clearTimeout(this.timer);
    if (!this.running) return;
    const wait = Math.max(0, this.retryAt - this.now());
    this.timer = setTimeout(
      () => {
        void this.request();
      },
      Math.min(wait, 2_147_483_647),
    );
  }
  async request(): Promise<void> {
    if (this.pending) return;
    // A tab becoming visible must not bypass the API's Retry-After.
    if (this.now() < this.retryAt) {
      this.schedule();
      return;
    }
    this.pending = true;
    const started = this.now();
    this.controller = new AbortController();
    const timeout = setTimeout(() => this.controller?.abort(), 10_000);
    let delay = 3000;
    try {
      const headers: Record<string, string> = {};
      if (this.etag) headers["If-None-Match"] = this.etag;
      const response = await this.fetcher(API_URL, {
        headers,
        signal: this.controller.signal,
        cache: "no-cache",
        credentials: "omit",
      });
      if (!response.ok && response.status !== 304) {
        if (response.status === 429 || response.status === 503)
          delay = retryDelay(
            response.headers.get("Retry-After"),
            this.failures + 1,
            this.now(),
          );
        throw new Error(`Wheel API returned ${response.status}.`);
      }
      let parsed: ParsedStatus;
      if (response.status === 304) {
        if (!this.cached) throw new Error("No cached wheel signal");
        parsed = this.cached;
      } else {
        parsed = parseStatus(await response.json());
        this.cached = parsed;
        this.etag = response.headers.get("ETag");
      }
      this.failures = 0;
      const m =
        parsed.kind === "available"
          ? parsed.data.measurement
          : parsed.measurement;
      const lastActiveAt =
        m?.coreStatus === "ACTIVE" && m.freshness === "online"
          ? this.now()
          : this.signal.lastActiveAt;
      const idleSince =
        m?.coreStatus === "IDLE" ? (this.signal.idleSince ?? this.now()) : null;
      this.signal = {
        ...this.signal,
        loading: false,
        lost: parsed.kind === "unavailable",
        reason: parsed.kind === "unavailable" ? parsed.reason : "",
        data: parsed.kind === "available" ? parsed.data : this.signal.data,
        latestMeasurement: m,
        lastActiveAt,
        idleSince,
        checkedAt: this.now(),
      };
    } catch (error) {
      if (
        !this.running &&
        error instanceof DOMException &&
        error.name === "AbortError"
      )
        return;
      this.failures++;
      delay = Math.max(delay, retryDelay(null, this.failures, this.now()));
      this.signal = {
        ...this.signal,
        loading: false,
        lost: true,
        latestMeasurement: undefined,
        reason:
          "The wheel signal could not be reached. Retrying automatically.",
      };
    } finally {
      clearTimeout(timeout);
      this.pending = false;
      this.retryAt =
        started +
        (delay === 3000 && this.failures === 0
          ? delay
          : this.now() - started + delay);
      if (this.running) this.schedule();
    }
    for (const listener of this.listeners) listener(this.signal);
  }
}
// One instance per page. Both scenes, all HUDs and the game subscribe to this instance.
export const statusPoller = new StatusPoller();
