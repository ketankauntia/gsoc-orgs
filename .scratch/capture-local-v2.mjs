import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const scenarios = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
  },
];

for (const scenario of scenarios) {
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    viewport: scenario.viewport,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3005", {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `.scratch/gsoc-home-v2-${scenario.name}.png`,
  });
  await context.close();
}

await browser.close();
