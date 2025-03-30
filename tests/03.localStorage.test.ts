import dayjs from "dayjs";
import puppeteer, { Browser, Page } from "puppeteer";
import { describe, expect, beforeAll } from "vitest";
import dotenv from "dotenv";
import crypto from "crypto-js";

// let browser: Browser;
// let page: Page;

describe("Guesses", async () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
  });

  test("fabricate guesses in localStorage", async () => {
    // Set up NEW guesses in localStorage

    const todaysGuessExpiration = dayjs().endOf("day").toDate();
    // await page.evaluate((yesterdayStr) => {
    const guesses = {
      day: todaysGuessExpiration,
      countries: ["Canada", "Mexico", "Japan"],
    };

    // Set localStorage BEFORE navigating to the page
    console.log("Setting up localStorage with stats data:", guesses);
    await page.evaluateOnNewDocument((guessesData) => {
      localStorage.setItem("guesses", guessesData);
    }, JSON.stringify(guesses));

    // Navigate to the game page
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });

    const childCountMethod3 = await page.$eval(
      'ul[data-cy="countries-list"]',
      (ul) => ul.querySelectorAll("li").length
    );

    console.log(`Number of child elements (Method 3): ${childCountMethod3}`);

    // Verify that guesses are already in game
    const firstItemText = await page.$eval(
      "li",
      (element) => element.textContent
    );
    expect(firstItemText).toContain("Canada");
  });

  test("guesses persist after page reload", async () => {
    // Check that the guesses remain when you leave and come back
    console.log("🔄 Refreshing page to check persistence");
    await page.reload({
      waitUntil: "networkidle2",
    });
    console.log("✅ Page reloaded successfully");
    const childCountMethod3 = await page.$eval(
      'ul[data-cy="countries-list"]',
      (ul) => ul.querySelectorAll("li").length
    );
    expect(childCountMethod3).toBe(3);
    console.log("✅ Test completed successfully");
  });

  test("checks that old guesses get reset when they expire", async () => {
    console.log("🧪 Running expired guesses test");

    // Set up EXPIRED stats in localStorage
    const yesterday = dayjs().subtract(1, "day").endOf("day").toDate();
    const yesterdayStr = yesterday.toString();
    // await page.evaluate((yesterdayStr) => {
    const guesses = {
      day: yesterdayStr,
      countries: ["Spain", "France", "Germany"],
    };

    // Set localStorage BEFORE navigating to the page
    await page.evaluateOnNewDocument((statsData) => {
      localStorage.setItem("guesses", statsData);
    }, JSON.stringify(guesses));

    // Verify that the game has reset
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });
    const message = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(message).toContain("any country");
  });
});

describe("Maintain a streak", async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  beforeEach(async () => {
    dotenv.config();
    console.log("🚀 Starting Game play tests - setting up browser");

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

  test("fabricated stats, last win was yesterday", async () => {
    console.log("🧪 Running win game and statistics test");

    // Set up stats from yesterday
    const yesterday = dayjs().subtract(1, "day").toDate();
    const yesterdayStr = yesterday.toString();
    console.log("📅 Setting up test with yesterday's date:", yesterdayStr);
    const stats = {
      gamesWon: 4,
      lastWin: yesterdayStr,
      currentStreak: 2,
      maxStreak: 5,
      usedGuesses: [1, 2, 3, 4],
    };
    // localStorage.setItem("statistics", JSON.stringify(stats));
    // console.log("📊 Initial stats set:", JSON.stringify(stats));

    // Set localStorage BEFORE navigating to the page
    await page.evaluateOnNewDocument((statsData) => {
      localStorage.setItem("statistics", statsData);
    }, JSON.stringify(stats));

    await page.goto("http://localhost:8788", {
      waitUntil: "networkidle2",
    });
    const pageTitle = await page.title();
    console.log("Loaded page:", pageTitle);

    await page.click('button[aria-label="Statistics"]');
    await page.waitForSelector('h2[data-i18n="StatsTitle"]');
    const lastWinText1 = await page.$eval(
      'td[data-cy="last-win"]',
      (el) => el.textContent
    );
    console.log("Last win text:", lastWinText1);
    const lastWinDayjs1 = dayjs(lastWinText1);
    expect(lastWinDayjs1.toDate()).toBeInstanceOf(Date);

    // Format dates to only compare year-month-day without time
    const formattedLastWin = lastWinDayjs1.format("YYYY-MM-DD");
    const formattedYesterday = dayjs(yesterday).format("YYYY-MM-DD");
    expect(formattedLastWin).toBe(formattedYesterday);
  });

  test("keep the streak going", async () => {
    // Beat the game
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });
    console.log("🎯 Submitting winning guess: madagascar");
    await page.type('[data-cy="guesser"]', "madagascar");
    await page.keyboard.press("Enter");
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const msgText = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    console.log("🏆 Win message:", msgText);
    expect(msgText).toContain("The Mystery Country is Madagascar");

    // Check the statistics
    await page.waitForSelector('h2[data-i18n="StatsTitle"]');
    const lastWinText = await page.$eval(
      'td[data-cy="last-win"]',
      (el) => el.textContent
    );
    console.log("Last win text:", lastWinText);
    const lastWinDayjs = dayjs(lastWinText);
    expect(lastWinDayjs.toDate()).toBeInstanceOf(Date);
    const lastWinDate = lastWinDayjs.format("YYYY-MM-DD");
    const today = dayjs().format("YYYY-MM-DD");
    expect(lastWinDate).toBe(today);
    console.log("📊 Statistics updated with today's date:", lastWinDate);

    // Check that streak has increased
    const currentStreak = await page.$eval(
      '[data-cy="current-streak"]',
      (el) => el.textContent
    );
    console.log("🔥 Current streak:", currentStreak);
    expect(currentStreak).toContain("3");
  });
});

describe("Break a streak", async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  beforeEach(async () => {
    dotenv.config();
    console.log("🚀 Starting Game play tests - setting up browser");

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

  test("fabricate stats, last win 2 days ago", async () => {
    console.log("🧪 Running win game and statistics test");

    // Set up stats from 2 days ago
    const twoDaysAgo = dayjs().subtract(2, "day").toDate();
    const twoDaysAgoStr = twoDaysAgo.toString();
    console.log("📅 Setting up test with yesterday's date:", twoDaysAgoStr);
    const stats = {
      gamesWon: 4,
      lastWin: twoDaysAgoStr,
      currentStreak: 2,
      maxStreak: 5,
      usedGuesses: [1, 2, 3, 4],
    };
    // localStorage.setItem("statistics", JSON.stringify(stats));
    // console.log("📊 Initial stats set:", JSON.stringify(stats));

    // Set localStorage BEFORE navigating to the page
    await page.evaluateOnNewDocument((statsData) => {
      localStorage.setItem("statistics", statsData);
    }, JSON.stringify(stats));

    await page.goto("http://localhost:8788", {
      waitUntil: "networkidle2",
    });
    const pageTitle = await page.title();
    console.log("Loaded page:", pageTitle);
  });

  test("start a new streak", async () => {
    // Beat the game
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });
    console.log("🎯 Submitting winning guess: madagascar");
    await page.type('[data-cy="guesser"]', "madagascar");
    await page.keyboard.press("Enter");
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const msgText = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    console.log("🏆 Win message:", msgText);
    expect(msgText).toContain("The Mystery Country is Madagascar");

    // Check the statistics
    await page.waitForSelector('h2[data-i18n="StatsTitle"]');
    const lastWinText = await page.$eval(
      'td[data-cy="last-win"]',
      (el) => el.textContent
    );
    console.log("Last win text:", lastWinText);
    const lastWinDayjs = dayjs(lastWinText);
    expect(lastWinDayjs.toDate()).toBeInstanceOf(Date);
    const lastWinDate = lastWinDayjs.format("YYYY-MM-DD");
    const today = dayjs().format("YYYY-MM-DD");
    expect(lastWinDate).toBe(today);
    console.log("📊 Statistics updated with today's date:", lastWinDate);

    // Check that streak has increased
    const currentStreak = await page.$eval(
      '[data-cy="current-streak"]',
      (el) => el.textContent
    );
    console.log("🔥 Current streak:", currentStreak);
    expect(currentStreak).toContain("1");
  });
});
