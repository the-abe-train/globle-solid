import puppeteer, { Browser, Page } from "puppeteer";
import {
  test,
  expect,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import dayjs from "dayjs";
import rawAnswerData from "../src/data/country_data.json";
import crypto from "crypto-js";
import dotenv from "dotenv";

let browser: Browser;
let page: Page;

describe("Game play tests", () => {
  function decrypt(encryptedAnsKey: string) {
    console.log("🔑 Decrypting answer key...", encryptedAnsKey);
    const cryptoKey = process.env.CRYPTO_KEY;
    if (!cryptoKey) {
      throw new Error("CRYPTO_KEY is not defined in environment variables");
    }
    const bytes = crypto.AES.decrypt(encryptedAnsKey, cryptoKey);
    const originalText = bytes.toString(crypto.enc.Utf8);
    const answerKey = parseInt(originalText);
    expect(answerKey).toBeGreaterThanOrEqual(0);
    console.log("🔑 Decrypted answer key: " + answerKey);
    const answer = rawAnswerData["features"][answerKey] as Country;
    console.log("🌍 Answer data: ", answer.properties.NAME);
    return answer.properties.NAME;
  }

  beforeAll(async () => {
    dotenv.config();
    console.log("🚀 Starting Game play tests - setting up browser");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("✅ Browser setup complete");
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up browser for Game play tests");
    await browser.close();
    console.log("✅ Browser closed");
  });

  test("should access environment variables", () => {
    expect(process.env.CRYPTO_KEY).toBeDefined();
  });

  test("plays today's game", async () => {
    console.log("🧪 Running today's game test");

    // Create a new page for this test
    page = await browser.newPage();

    // Set up request interception to capture the answer
    let answerData: any;
    await page.setRequestInterception(true);
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/answer")) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          answerData = data;
          console.log("📦 Answer data captured: ", answerData);
        } catch (e) {
          console.error("Failed to parse answer response", e);
        }
      }
    });

    page.on("request", (request) => request.continue());

    // Visit the game page
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });

    // Wait for answerData to be populated
    // await page.waitForTimeout(1000);

    if (answerData) {
      const answer = decrypt(answerData.answer);
      console.log(`🔍 Today's answer: ${answer}`);

      // Enter the answer in the guess input
      await page.type('[data-cy="guesser"]', answer);
      await page.keyboard.press("Enter");

      // Wait for the statistics display
      await page.waitForSelector("text/Statistics", { timeout: 5000 });
      const statsExist = await page.evaluate(() => {
        return document.body.innerText.includes("Statistics");
      });

      expect(statsExist).toBe(true);
    } else {
      throw new Error("Failed to capture answer data");
    }

    await page.close();
  });
});
