import test from "node:test";
import assert from "node:assert/strict";
import {
  scoreBucket,
  settleGuess,
  loadStreak,
  saveStreak,
} from "../src/game.ts";
import { parseOptions, overlayURL } from "../src/options.ts";
test("prediction windows are unambiguous at all boundaries", () => {
  assert.equal(scoreBucket(0), "under10");
  assert.equal(scoreBucket(599999), "under10");
  assert.equal(scoreBucket(600000), "10to30");
  assert.equal(scoreBucket(1799999), "10to30");
  assert.equal(scoreBucket(1800000), "30to60");
  assert.equal(scoreBucket(3599999), "30to60");
  assert.equal(scoreBucket(3600000), "over60");
  for (const n of [-1, Infinity, NaN]) assert.throws(() => scoreBucket(n));
});
test("a guess only settles on an increased projected height, once, with exact BigInt comparison", () => {
  const guess = {
    bucket: "under10" as const,
    at: 1000,
    height: 900719925474099312345n,
  };
  assert.equal(
    settleGuess(guess, guess.height, 2000, { streak: 2, best: 4 }),
    null,
  );
  assert.equal(
    settleGuess(guess, guess.height - 1n, 2000, { streak: 2, best: 4 }),
    null,
  );
  assert.deepEqual(
    settleGuess(guess, guess.height + 10n, 2000, { streak: 2, best: 4 }),
    { won: true, actual: "under10", streak: { streak: 3, best: 4 } },
  );
});
test("wins extend best streak; losses reset current but retain best", () => {
  const guess = { bucket: "under10" as const, at: 0, height: 4n };
  assert.deepEqual(
    settleGuess(guess, 5n, 100, { streak: 3, best: 3 })?.streak,
    { streak: 4, best: 4 },
  );
  assert.deepEqual(
    settleGuess(guess, 5n, 600000, { streak: 3, best: 6 })?.streak,
    { streak: 0, best: 6 },
  );
});
test("optional storage tolerates denial and corrupt data; no pending guess is persisted", () => {
  assert.deepEqual(
    loadStreak({
      getItem() {
        throw new Error("denied");
      },
    }),
    { streak: 0, best: 0 },
  );
  for (const input of [
    "null",
    "{",
    '{"streak":-1,"best":2}',
    '{"streak":3,"best":2}',
  ])
    assert.deepEqual(loadStreak({ getItem: () => input }), {
      streak: 0,
      best: 0,
    });
  assert.deepEqual(loadStreak({ getItem: () => '{"streak":2,"best":5}' }), {
    streak: 2,
    best: 5,
  });
  assert.doesNotThrow(() =>
    saveStreak(
      { streak: 2, best: 5 },
      {
        setItem() {
          throw new Error("denied");
        },
      },
    ),
  );
});
test("bad overlay values default safely and streamer names are bounded plain text", () => {
  const r = parseOptions(
    new URLSearchParams(
      "pos=evil&scale=Infinity&hud=bad&sound=bad&theme=unknown&name=%00hello",
    ),
  );
  assert.deepEqual(r, {
    pos: "bottom-right",
    scale: 1,
    hud: true,
    sound: false,
    theme: "dark",
    name: "hello",
  });
  assert.equal(parseOptions(new URLSearchParams("scale=0.4")).scale, 1);
  assert.equal(
    parseOptions(new URLSearchParams("scale=2&hud=0&sound=1&theme=light"))
      .scale,
    2,
  );
  const url = new URL(
    overlayURL(
      { ...r, name: "<script>& friend" },
      "https://example.com/ipfs/real-path/index.html#builder",
    ),
  );
  assert.equal(url.pathname, "/ipfs/real-path/overlay/");
  assert.equal(url.searchParams.get("name"), "<script>& friend");
});
