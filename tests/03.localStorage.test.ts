import dayjs from "dayjs";
import puppeteer, { Browser, Page } from "puppeteer";
import { describe, expect, beforeAll } from "vitest";

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

describe("Stats tests", async () => {
  test("fabricate statistics", async () => {
    console.log("🧪 Running win game and statistics test");

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

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
    const lastWinText = await page.$eval(
      'td[data-cy="last-win"]',
      (el) => el.textContent
    );
    console.log("Last win text:", lastWinText);
    const lastWinDayjs = dayjs(lastWinText);
    expect(lastWinDayjs.toDate()).toBeInstanceOf(Date);

    // Format dates to only compare year-month-day without time
    const formattedLastWin = lastWinDayjs.format("YYYY-MM-DD");
    const formattedYesterday = dayjs(yesterday).format("YYYY-MM-DD");
    expect(formattedLastWin).toBe(formattedYesterday);
  });
});
