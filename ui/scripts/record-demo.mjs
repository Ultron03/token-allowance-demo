// Records ../demo/console.gif: alice's dollar budget running out in Chat, then carol's agent stopped at five model calls.
// Needs a freshly started app on the gemini,priced profiles and the console on port 3000 (npm run build && npm start).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const SIZE = { width: 1280, height: 800 };
const WAIT_SPEEDUP = 6;
const gif = fileURLToPath(new URL("../../demo/console.gif", import.meta.url));

const browser = await chromium.launch();
const videoDir = mkdtempSync(join(tmpdir(), "console-demo-"));
const context = await browser.newContext({ viewport: SIZE, recordVideo: { dir: videoDir, size: SIZE } });
const page = await context.newPage();
const startedAt = Date.now();
const now = () => (Date.now() - startedAt) / 1000;
const modelWaits = [];

async function sendAndWait() {
  await page.keyboard.press("Enter");
  const answering = page.locator('[data-state="answering"]');
  await answering.waitFor();
  const from = now();
  await answering.waitFor({ state: "detached", timeout: 120_000 });
  modelWaits.push([from, now()]);
  await page.waitForTimeout(2500);
}

await page.goto("http://localhost:3000/?user=alice&mode=chat");
await page.getByText("Connected to the demo app").waitFor();
await page.getByText("$0.000250").first().waitFor();
const shownFrom = now();
await page.waitForTimeout(1500);

for (const message of ["One-line fun fact about octopuses.", "One-line fun fact about owls.", "One-line fun fact about bees."]) {
  await page.locator("#message").pressSequentially(message, { delay: 35 });
  await sendAndWait();
}
await page.waitForTimeout(2000);

await page.getByRole("button", { name: /^carol/ }).click();
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Agent", exact: true }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^Who is at the very top/ }).click();
await page.waitForTimeout(800);
await page.locator("#message").focus();
await sendAndWait();
await page.waitForTimeout(2500);

const shownTo = now();
const video = page.video();
await context.close();
await browser.close();

const pieces = [];
let at = shownFrom;
for (const [from, to] of modelWaits) {
  pieces.push([at, from, 1], [from, to, WAIT_SPEEDUP]);
  at = to;
}
pieces.push([at, shownTo, 1]);

const trims = pieces.map(([from, to, speed], i) => `[0:v]trim=${from}:${to},setpts=(PTS-STARTPTS)/${speed}[p${i}]`);
const joined = `${pieces.map((_, i) => `[p${i}]`).join("")}concat=n=${pieces.length}`;
const palette = "mpdecimate,fps=10,split[a][b];[a]palettegen=stats_mode=diff:max_colors=96[pal];[b][pal]paletteuse=dither=none:diff_mode=rectangle";
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", await video.path(), "-filter_complex", `${trims.join(";")};${joined},${palette}`, gif]);
rmSync(videoDir, { recursive: true });
console.log(`Wrote ${gif}`);
