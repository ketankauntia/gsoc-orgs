import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3005";
const localServer = process.env.BASE_URL
  ? undefined
  : {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3005",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 180_000,
    };

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".playwright-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  reporter: process.env.CI ? [["github"], ["line"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: localServer,
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "chrome",
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        channel: process.env.CI ? undefined : "chrome",
      },
    },
  ],
});
