import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:5188'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.PORTFOLIO_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5188 --strictPort',
    url: 'http://127.0.0.1:5188',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1000 } } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'android-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
})
