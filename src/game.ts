export const BUCKETS = [
  { id: "under10", label: "Under 10 min", detail: "A quick sprint" },
  { id: "10to30", label: "10–30 min", detail: "Finding a rhythm" },
  { id: "30to60", label: "30–60 min", detail: "Taking it easy" },
  { id: "over60", label: "Over 1 h", detail: "A well-earned nap" },
] as const;
export type Bucket = (typeof BUCKETS)[number]["id"];
export interface Guess {
  bucket: Bucket;
  at: number;
  height: bigint;
}
export interface Streak {
  streak: number;
  best: number;
}
export function scoreBucket(elapsedMs: number): Bucket {
  if (elapsedMs < 0 || !Number.isFinite(elapsedMs))
    throw new Error("Invalid elapsed time");
  if (elapsedMs < 10 * 60_000) return "under10";
  if (elapsedMs < 30 * 60_000) return "10to30";
  if (elapsedMs < 60 * 60_000) return "30to60";
  return "over60";
}
export function settleGuess(
  guess: Guess,
  height: bigint,
  now: number,
  previous: Streak,
): { won: boolean; actual: Bucket; streak: Streak } | null {
  if (height <= guess.height) return null;
  const actual = scoreBucket(Math.max(0, now - guess.at));
  const won = actual === guess.bucket;
  const streak = won ? previous.streak + 1 : 0;
  return {
    won,
    actual,
    streak: { streak, best: Math.max(previous.best, streak) },
  };
}
export function loadStreak(storage?: Pick<Storage, "getItem">): Streak {
  try {
    const value = JSON.parse(
      (storage ?? localStorage).getItem("rels-wheel-streak-v1") ?? "null",
    );
    if (
      value &&
      Number.isSafeInteger(value.streak) &&
      value.streak >= 0 &&
      Number.isSafeInteger(value.best) &&
      value.best >= value.streak
    )
      return { streak: value.streak, best: value.best };
  } catch {
    /* Storage is optional in private browsing and OBS. */
  }
  return { streak: 0, best: 0 };
}
export function saveStreak(
  value: Streak,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    (storage ?? localStorage).setItem(
      "rels-wheel-streak-v1",
      JSON.stringify(value),
    );
  } catch {
    /* Keep playing in memory. */
  }
}
