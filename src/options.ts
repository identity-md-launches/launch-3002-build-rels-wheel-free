export const POSITIONS = [
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right",
] as const;
export interface OverlayOptions {
  pos: (typeof POSITIONS)[number];
  scale: number;
  hud: boolean;
  sound: boolean;
  theme: "dark" | "light";
  name: string;
}
export const DEFAULT_OPTIONS: OverlayOptions = {
  pos: "bottom-right",
  scale: 1,
  hud: true,
  sound: false,
  theme: "dark",
  name: "",
};
export function parseOptions(params: URLSearchParams): OverlayOptions {
  const pos = params.get("pos");
  const scale = Number(params.get("scale") ?? 1);
  return {
    pos: POSITIONS.includes(pos as OverlayOptions["pos"])
      ? (pos as OverlayOptions["pos"])
      : DEFAULT_OPTIONS.pos,
    scale: Number.isFinite(scale) && scale >= 0.5 && scale <= 2 ? scale : 1,
    hud: params.get("hud") !== "0",
    sound: params.get("sound") === "1",
    theme: params.get("theme") === "light" ? "light" : "dark",
    name: (params.get("name") ?? "")
      .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
      .trim()
      .slice(0, 40),
  };
}
export function overlayURL(
  options: OverlayOptions,
  locationURL: string,
): string {
  const base = new URL("./", locationURL);
  const url = new URL("overlay/index.html", base);
  url.search = new URLSearchParams({
    pos: options.pos,
    scale: String(options.scale),
    hud: options.hud ? "1" : "0",
    sound: options.sound ? "1" : "0",
    theme: options.theme,
    name: options.name,
  }).toString();
  return url.href;
}
