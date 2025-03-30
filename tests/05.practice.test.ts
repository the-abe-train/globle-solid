import puppeteer, { Browser, Page } from "puppeteer";
import { test, expect, describe, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import rawAnswerData from "../src/data/country_data.json";

describe("Play a practice game", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    dotenv.config();
    console.log("🚀 Starting Game play tests - setting up browser");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("✅ Browser setup complete");
    // Create a new page for each test
    page = await browser.newPage();
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up browser for Game play tests");
    await browser.close();
    console.log("✅ Browser closed");
  });

  async function checkMsgText(expectedText: string) {
    const msg = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg).toContain(expectedText);
  }

  test("practice game", async () => {
    // Set fake answer
    const answer = rawAnswerData.features.find(
      (feature) => feature.properties.NAME === "Madagascar"
    ) as Country;

    // Set localStorage BEFORE navigating to the page
    await page.evaluateOnNewDocument((answerData) => {
      localStorage.setItem("practice", answerData);
    }, JSON.stringify(answer));

    // Go to practice page
    await page.goto("http://localhost:8788/practice", {
      waitUntil: "networkidle2",
    });

    // Check for practice game message
    const practiceGameMessage = await page.$eval(
      "p.italic",
      (element) => element.textContent
    );
    expect(practiceGameMessage).toContain("You are playing a practice game");

    // Enter a guess
    await page.type('input[data-cy="guesser"]', "Canada");
    await page.keyboard.press("Enter");
    await checkMsgText("Drag, click, and zoom-in");

    // Reveal answer
    await page.click('button[data-i18n="Game18"]');
    await checkMsgText("Madagascar");

    // Play again
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await page.click('button[data-i18n="Yes"]');
    await checkMsgText("any country");
  });
});
