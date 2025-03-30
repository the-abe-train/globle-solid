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

describe("Game play tests", () => {
  let browser: Browser;
  let page: Page;

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

  describe("Test the answer fetching function", () => {
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

  describe("Tests with a fake answer", () => {
    beforeEach(async () => {
      // Create a new page for each test
      page = await browser.newPage();

      // Intercept the answer request and return a fixed answer (Madagascar - 159)
      await page.setRequestInterception(true);
      const cryptoKey = process.env.CRYPTO_KEY;
      if (!cryptoKey) {
        throw new Error("CRYPTO_KEY is not defined in environment variables");
      }
      page.on("request", (request) => {
        if (request.url().includes("/answer")) {
          request.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              answer: crypto.AES.encrypt("159", cryptoKey).toString(),
            }),
          });
        } else {
          request.continue();
        }
      });
    });

    test("checks that old guesses get reset when they expire", async () => {
      console.log("🧪 Running expired guesses test");

      // Set up expired stats in localStorage
      const yesterday = dayjs().subtract(1, "day").toDate();
      await page.evaluate((yesterdayStr) => {
        const guesses = {
          day: yesterdayStr,
          guesses: ["Spain", "France", "Germany"],
        };
        localStorage.setItem("guesses", JSON.stringify(guesses));

        // Set up stats
        const stats = {
          gamesWon: 4,
          lastWin: yesterdayStr,
          currentStreak: 2,
          maxStreak: 5,
          usedHints: 0,
          guesses: {},
        };
        localStorage.setItem("statistics", JSON.stringify(stats));
      }, yesterday.toString());

      await page.goto("http://localhost:8788/game", {
        waitUntil: "networkidle2",
      });

      // Verify that old guesses were reset
      const anyCountryText = await page.evaluate(() => {
        return document.body.innerText.includes("any country");
      });

      expect(anyCountryText).toBe(true);

      await page.close();
    });

    test("plays a game with many types of guesses", async () => {
      console.log("🧪 Running multiple guesses test");

      // Set up stats from yesterday
      const yesterday = dayjs().subtract(1, "day").toDate();
      await page.evaluate((yesterdayStr) => {
        const stats = {
          gamesWon: 4,
          lastWin: yesterdayStr,
          currentStreak: 2,
          maxStreak: 5,
          usedHints: 0,
          guesses: {},
        };
        localStorage.setItem("statistics", JSON.stringify(stats));
      }, yesterday.toString());

      await page.goto("http://localhost:8788/game", {
        waitUntil: "networkidle2",
      });

      // Check initial state
      const anyCountryText = await page.evaluate(() => {
        return document.body.innerText.includes("any country");
      });
      expect(anyCountryText).toBe(true);

      // Nonsense guess
      await page.type('[data-cy="guesser"]', "asdfasdfasdf");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes('"asdfasdfasdf" not found in database')
      );

      // Close guess
      await page.type('[data-cy="guesser"]', "swodon");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("Did you mean Sweden?")
      );

      // Correct guess
      await page.type('[data-cy="guesser"]', "Turkey");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("next guess")
      );

      // Close enough guess
      await page.type('[data-cy="guesser"]', "saudi arubia");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("Saudi Arabia is warmer")
      );

      // Already guessed
      await page.type('[data-cy="guesser"]', "saudi arobia");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("Already guessed Saudi Arabia")
      );

      // Correct abbreviation
      await page.type('[data-cy="guesser"]', "uae");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("United Arab Emirates is cooler")
      );

      // Alternate name
      await page.type('[data-cy="guesser"]', "burma");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("Myanmar is cooler")
      );

      // Toggle distance unit
      await page.waitForFunction(
        () =>
          document.body.innerText.includes("3,265") &&
          document.body.innerText.includes("km")
      );
      const hasMiles = await page.evaluate(() =>
        document.body.innerText.includes("miles")
      );
      expect(hasMiles).toBe(false);

      await page.click('[data-cy="toggle-km-miles"]');
      await page.waitForFunction(
        () =>
          document.body.innerText.includes("2,030") &&
          document.body.innerText.includes("miles")
      );

      // Testing the sorted list
      const firstItemText = await page.evaluate(() => {
        const items = document.querySelectorAll("li");
        return items[0].textContent;
      });
      expect(firstItemText).toContain("Saud.");

      await page.click('[data-cy="change-sort"]');
      const newFirstItemText = await page.evaluate(() => {
        const items = document.querySelectorAll("li");
        return items[0].textContent;
      });
      expect(newFirstItemText).toContain("Türkiye");

      // Winning
      await page.click('[data-cy="change-sort"]');
      await page.type('[data-cy="guesser"]', "madagascar");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("The Mystery Country is Madagascar")
      );

      const firstItemAfterWin = await page.evaluate(() => {
        const items = document.querySelectorAll("li");
        return items[0].textContent;
      });
      expect(firstItemAfterWin).toContain("Mad.");

      // Check statistics
      await page.waitForFunction(() =>
        document.body.innerText.includes("Statistics")
      );

      const gamesWon = await page.$eval(
        '[data-cy="games-won"]',
        (el) => el.textContent
      );
      expect(gamesWon).toContain("5");

      const currentStreak = await page.$eval(
        '[data-cy="current-streak"]',
        (el) => el.textContent
      );
      expect(currentStreak).toContain("3");

      const todaysGuesses = await page.$eval(
        '[data-cy="today\'s-guesses"]',
        (el) => el.textContent
      );
      expect(todaysGuesses).toContain("5");

      // Check that the stats remain when you leave and come back
      await page.goto("http://localhost:8788/game", {
        waitUntil: "networkidle2",
      });

      const turkiyeExists = await page.evaluate(() =>
        document.body.innerText.includes("Türkiye")
      );
      expect(turkiyeExists).toBe(true);

      await page.close();
    });

    test("breaks a streak", async () => {
      console.log("🧪 Running break streak test");

      // Set up stats from 10 days ago
      const lastWin = dayjs().subtract(10, "day").toDate();
      await page.evaluate((lastWinStr) => {
        const stats = {
          gamesWon: 4,
          lastWin: lastWinStr,
          currentStreak: 4,
          maxStreak: 5,
          usedHints: 0,
          guesses: {},
        };
        localStorage.setItem("statistics", JSON.stringify(stats));
      }, lastWin.toString());

      await page.goto("http://localhost:8788/game", {
        waitUntil: "networkidle2",
      });

      // Win the game
      await page.type('[data-cy="guesser"]', "madagascar");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.body.innerText.includes("The Mystery Country is Madagascar")
      );

      // Check statistics - streak should be reset to 1
      await page.waitForFunction(() =>
        document.body.innerText.includes("Statistics")
      );

      const gamesWon = await page.$eval(
        '[data-cy="games-won"]',
        (el) => el.textContent
      );
      expect(gamesWon).toContain("5");

      const currentStreak = await page.$eval(
        '[data-cy="current-streak"]',
        (el) => el.textContent
      );
      expect(currentStreak).toContain("1");

      await page.close();
    });
  });
});

export default {};
