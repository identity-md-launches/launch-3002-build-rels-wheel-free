import test from "node:test";
import assert from "node:assert/strict";
import {
  parseStatus,
  decimal,
  progressPercent,
  fixed,
  workLeft,
  retryDelay,
  StatusPoller,
} from "../src/api.ts";
function fixture() {
  return {
    schemaVersion: 1,
    measurement: {
      coreStatus: "IDLE",
      freshness: "online",
      rpmMilli: 12500,
      speedMmPerSecond: 1127,
      distanceMm: 3455808,
      observedAt: "2026-11-05T16:39:00.480Z",
    },
    builder: {
      status: "available",
      projected: {
        blockHeight: "900719925474099312345",
        blockProgress: "425653103",
        workPerThousandBlocks: "9546",
      },
      anchor: { blockHeight: "900719925474099312300", transactionHash: null },
    },
  };
}
test("v1 parsing keeps large block heights exact and accepts documented integer measurements", () => {
  const result = parseStatus(fixture());
  assert.equal(result.kind, "available");
  if (result.kind !== "available") return;
  assert.equal(result.data.projected.blockHeight, 900719925474099312345n);
  assert.equal(result.data.measurement.rpmMilli, 12500n);
  assert.equal(fixed(result.data.measurement.rpmMilli, 1000n), "12.5");
  assert.equal(
    fixed(result.data.measurement.speedMmPerSecond * 60n, 1000n),
    "67.6",
  );
  assert.equal(fixed(result.data.measurement.distanceMm, 1000n), "3,455.8");
});
test("progress uses a billion units and work left uses difficulty per thousand", () => {
  const r = parseStatus(fixture());
  assert.equal(progressPercent(425653103n), "42.6");
  assert.equal(progressPercent(0n), "0.0");
  assert.equal(progressPercent(1_000_000_000n), "100.0");
  if (r.kind === "available") assert.equal(workLeft(r.data), "5.483");
  assert.equal(
    fixed(900719925474099312345n, 1000n, 3),
    "900,719,925,474,099,312.345",
  );
});
test("unavailable responses and builders stay unknown; no missing value becomes zero", () => {
  assert.deepEqual(parseStatus({ schemaVersion: 1, status: "unavailable" }), {
    kind: "unavailable",
    reason: "The wheel API is unavailable.",
  });
  const f = fixture();
  f.builder.status = "unavailable";
  assert.equal(parseStatus(f).kind, "unavailable");
  assert.equal(
    parseStatus({ schemaVersion: 1, measurement: null }).kind,
    "unavailable",
  );
  const bad = fixture();
  delete (bad.measurement as Partial<typeof bad.measurement>).distanceMm;
  assert.throws(() => parseStatus(bad));
});
test("unknown fields are ignored but unknown versions, unsafe numbers and malformed decimals fail", () => {
  assert.equal(
    parseStatus({ ...fixture(), futureField: { arbitrary: true } }).kind,
    "available",
  );
  assert.throws(
    () => parseStatus({ ...fixture(), schemaVersion: 2 }),
    /schema/,
  );
  for (const invalid of [
    "",
    "-1",
    "1e3",
    "0.4",
    "01",
    null,
    undefined,
    123,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.throws(() => decimal(invalid));
  assert.throws(() => decimal(Number.MAX_SAFE_INTEGER + 1, true));
  const bad = fixture();
  bad.builder.projected.blockProgress = "1000000001";
  assert.throws(() => parseStatus(bad));
});
test("stale and counter-fault measurements remain distinct from unavailability", () => {
  const f = fixture();
  f.measurement.freshness = "stale";
  f.measurement.coreStatus = "COUNTER_FAULT";
  const r = parseStatus(f);
  assert.equal(r.kind, "available");
  if (r.kind === "available")
    assert.equal(r.data.measurement.coreStatus, "COUNTER_FAULT");
});
test("Retry-After is respected before capped exponential backoff, including HTTP dates", () => {
  assert.equal(retryDelay("12", 1, 0), 15000);
  assert.equal(retryDelay(null, 2), 6000);
  assert.equal(retryDelay("Thu, 01 Jan 1970 00:01:00 GMT", 1, 0), 63000);
  assert.equal(retryDelay("bad", 40), 60000);
});
test("shared subscriptions use one conditional request and 304 preserves values", async () => {
  const calls: RequestInit[] = [];
  let now = 0;
  const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(init!);
    return calls.length === 1
      ? new Response(JSON.stringify(fixture()), {
          headers: { ETag: '"revision-one"' },
        })
      : new Response(null, { status: 304 });
  };
  const poller = new StatusPoller(fetcher, () => now);
  let updates = 0;
  poller.subscribe(() => updates++);
  poller.subscribe(() => updates++);
  await poller.request();
  now += 3000;
  await poller.request();
  assert.equal(calls.length, 2);
  assert.equal(updates, 6);
  assert.equal(
    (calls[1].headers as Record<string, string>)["If-None-Match"],
    '"revision-one"',
  );
  assert.equal(
    poller.signal.data?.projected.blockHeight,
    900719925474099312345n,
  );
  assert.equal(poller.signal.lost, false);
  poller.stop();
});
test("failed and builder-unavailable requests preserve good values and recover through 304", async () => {
  let count = 0,
    now = 0;
  const fetcher = async () => {
    count++;
    if (count === 1)
      return new Response(JSON.stringify(fixture()), {
        headers: { ETag: '"good"' },
      });
    if (count === 2) throw new Error("offline");
    if (count === 3) return new Response(null, { status: 304 });
    return new Response(
      JSON.stringify({ ...fixture(), builder: { status: "unavailable" } }),
    );
  };
  const poller = new StatusPoller(fetcher, () => now);
  await poller.request();
  const data = poller.signal.data;
  now += 3000;
  await poller.request();
  assert.equal(poller.signal.lost, true);
  assert.equal(poller.signal.data, data);
  now += 3000;
  await poller.request();
  assert.equal(poller.signal.lost, false);
  assert.equal(poller.signal.data, data);
  now += 3000;
  await poller.request();
  assert.equal(poller.signal.lost, true);
  assert.equal(poller.signal.data, data);
  poller.stop();
});
test("429 does not retry early even when manually resumed", async () => {
  let calls = 0,
    now = 0;
  const poller = new StatusPoller(
    async () => {
      calls++;
      return new Response("", {
        status: 429,
        headers: { "Retry-After": "30" },
      });
    },
    () => now,
  );
  await poller.request();
  now = 32000;
  await poller.request();
  assert.equal(calls, 1);
  now = 33000;
  await poller.request();
  assert.equal(calls, 2);
  poller.stop();
});
