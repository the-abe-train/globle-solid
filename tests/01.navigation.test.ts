import puppeteer, { Browser, Page } from "puppeteer";
import { test, expect, describe, beforeAll, afterAll } from "vitest";

describe("Navigation tests", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    console.log("🚀 Starting Navigation tests - setting up browser");
    // await startAppServer();
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    console.log("✅ Browser setup complete");
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up browser for Navigation tests");
    await browser.close();
    console.log("✅ Browser closed");
  });

  test("should display header and footer", async () => {
    console.log("🧪 Running header and footer test");
    await page.goto("http://localhost:3000/", {
      waitUntil: "networkidle2",
    });
    console.log("📄 Page loaded: " + (await page.title()));

    const h1Text = await page.$eval("h1", (el) => el.textContent);
    console.log("📝 Found h1 text: " + h1Text);
    expect(h1Text).toBe("GLOBLE");

    const anchorText = await page.$eval(
      'a[href="https://trainwrecklabs.com"]',
      (el) => el.textContent
    );
    console.log("📝 Found footer link text: " + anchorText);
    expect(anchorText).toBe("by Trainwreck Labs");
    console.log("✅ Header and footer test completed");
  });
});

describe("Explore all navigation links", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    console.log("🚀 Starting navigation links test - setting up browser");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    console.log("✅ Browser setup complete");
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up browser for navigation links test");
    await browser.close();
    console.log("✅ Browser closed");
  });

  test("Visits every nav link", async () => {
    console.log("🧪 Starting navigation links journey test");

    // Visit homepage
    console.log("🌐 Navigating to homepage");
    await page.goto("http://localhost:8788/", {
      waitUntil: "networkidle2",
    });
    const title = await page.title();
    console.log("📄 Page title is: " + title);
    expect(title).toBe("Globle");

    const howToPlayText = await page.$eval("h2", (el) => el.textContent);
    console.log("📝 How to Play text is: " + howToPlayText);
    expect(howToPlayText).toBe("How to Play");

    // Click Settings link
    console.log("🌐 Navigating to Settings page");
    await Promise.all([
      page.click('[data-cy="settings-link"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    console.log("📄 Current URL: " + page.url());
    expect(page.url()).toContain("/settings");
    const settingsText = await page.$eval("h2", (el) => el.textContent);

    console.log("📝 Settings text found: " + settingsText);
    expect(settingsText).toBe(true);

    // Click Practice link
    console.log("🌐 Navigating to Practice page");
    await page.click('[data-cy="practice-link"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("📄 Current URL: " + page.url());
    expect(page.url()).toContain("/practice");
    const practiceText = await page.evaluate(() => {
      return document.body.innerText.includes("playing a practice game");
    });
    console.log("📝 Practice text found: " + practiceText);
    expect(practiceText).toBe(true);

    // Click Game link
    console.log("🌐 Navigating to Game page");
    await page.click('[data-cy="game-link"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("📄 Current URL: " + page.url());
    expect(page.url()).toContain("/game");
    const gameText = await page.evaluate(() => {
      return document.body.innerText.includes("first guess");
    });
    console.log("📝 Game text found: " + gameText);
    expect(gameText).toBe(true);

    // Click FAQ link
    console.log("🌐 Navigating to FAQ page");
    await page.click('[data-cy="faq-footer-link"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("📄 Current URL: " + page.url());
    expect(page.url()).toContain("/faq");
    const faqText = await page.evaluate(() => {
      return document.body.innerText.includes("FAQ");
    });
    console.log("📝 FAQ text found: " + faqText);
    expect(faqText).toBe(true);

    // Click Privacy Policy link
    console.log("🌐 Navigating to Privacy Policy page");
    await page.evaluate(() => {
      const privacyLink = Array.from(document.querySelectorAll("a")).find(
        (el) => el.textContent?.includes("privacy policy")
      );
      console.log("Found privacy policy link:", privacyLink ? true : false);
      if (privacyLink) privacyLink.click();
    });
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("📄 Current URL: " + page.url());
    expect(page.url()).toContain("/privacy-policy");
    const privacyText = await page.evaluate(() => {
      return document.body.innerText.includes("Privacy Policy");
    });
    console.log("📝 Privacy Policy text found: " + privacyText);
    expect(privacyText).toBe(true);

    console.log("✅ Navigation links test completed successfully");
  });
});
