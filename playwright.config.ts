import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a real build with the seeded demo world.
// Locally: npm run build && npm run e2e. In CI they run when Supabase secrets exist.
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: process.env.CI ? undefined : "chrome" } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
