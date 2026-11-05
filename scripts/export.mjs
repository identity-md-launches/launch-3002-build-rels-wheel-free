import { readFile, writeFile, mkdir } from "node:fs/promises";
const html = await readFile("dist/index.html", "utf8");
await mkdir("dist/overlay", { recursive: true });
// An actual static route: no fallback/rewrite server needed. Relative URLs survive subpath hosting.
await writeFile(
  "dist/overlay/index.html",
  html
    .replaceAll("./assets/", "../assets/")
    .replaceAll("./favicon.svg", "../favicon.svg")
    .replaceAll("./share.png", "../share.png"),
);
