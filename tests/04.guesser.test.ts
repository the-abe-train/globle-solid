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
import crypto from "crypto-js";
import dotenv from "dotenv";

let browser: Browser;
let page: Page;

describe("Tests with a fake answer", () => {
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

  afterAll(async () => {
    console.log("🧹 Cleaning up browser for fake answer tests");
    localStorage.clear();
    await page.close();
  });

  test("all possible ways guesser will accept names", async () => {
    console.log("🧪 Running basic guess interactions test");

    // Set up stats from yesterday
    const yesterday = dayjs().subtract(1, "day").toDate();
    const yesterdayStr = yesterday.toString();
    const stats = {
      gamesWon: 4,
      lastWin: yesterdayStr,
      currentStreak: 2,
      maxStreak: 5,
      usedHints: 0,
      guesses: {},
    };
    localStorage.setItem("statistics", JSON.stringify(stats));

    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });

    // Check initial state
    const message = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(message).toContain("any country");

    // Nonsense guess
    await page.type('[data-cy="guesser"]', "asdfasdfasdf");
    await page.keyboard.press("Enter");
    const msg2 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg2).toContain('"asdfasdfasdf" not found in database');

    // Close guess
    await page.type('[data-cy="guesser"]', "swodon");
    await page.keyboard.press("Enter");
    const msg3 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg3).toContain("Did you mean Sweden?");

    // Correct guess
    await page.type('[data-cy="guesser"]', "Turkey");
    await page.keyboard.press("Enter");
    const msg4 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg4).toContain("next guess");

    // Close enough guess
    await page.type('[data-cy="guesser"]', "saudi arubia");
    await page.keyboard.press("Enter");
    const msg5 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg5).toContain("Saudi Arabia is warmer");

    // Already guessed
    await page.type('[data-cy="guesser"]', "saudi arobia");
    await page.keyboard.press("Enter");
    const msg6 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    expect(msg6).toContain("Already guessed Saudi Arabia");

    // Make some initial guesses to fill the board
    console.log("🔤 Making first guess: Turkey");
    await page.type('[data-cy="guesser"]', "Turkey");
    await page.keyboard.press("Enter");
    console.log("✅ First guess submitted");

    console.log("🔤 Making second guess: saudi arabia");
    await page.type('[data-cy="guesser"]', "saudi arabia");
    await page.keyboard.press("Enter");
    console.log("✅ Second guess submitted");

    // Correct abbreviation
    console.log("🔤 Testing abbreviation: uae");
    await page.type('[data-cy="guesser"]', "uae");
    await page.keyboard.press("Enter");
    const msg7 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    console.log("📝 Message after UAE guess:", msg7);
    expect(msg7).toContain("United Arab Emirates is cooler");

    // Alternate name
    console.log("🔤 Testing alternate name: burma");
    await page.type('[data-cy="guesser"]', "burma");
    await page.keyboard.press("Enter");
    const msg8 = await page.$eval(
      'p[data-testid="guess-msg"]',
      (el) => el.textContent
    );
    console.log("📝 Message after Burma guess:", msg8);
    expect(msg8).toContain("Myanmar is cooler");
  });

  test("distance unit toggle", async () => {
    console.log("🧪 Running distance unit toggle test");

    // Toggle distance unit
    console.log("🔍 Checking distance in kilometers");
    const closestBorderText = await page.$eval(
      '[data-testid="closest-border"]',
      (el) => el.textContent
    );
    console.log("📏 Closest border text (km):", closestBorderText);
    expect(closestBorderText).toContain("3,265");

    const closestBorderUnit = await page.$eval(
      '[data-testid="toggle-text"]',
      (el) => el.textContent
    );
    console.log("📏 Current unit:", closestBorderUnit);
    expect(closestBorderUnit).toContain("km");

    console.log("🔄 Toggling distance unit to miles");
    await page.click('[data-cy="toggle-km-miles"]');

    const closestBorderTextMiles = await page.$eval(
      '[data-testid="closest-border"]',
      (el) => el.textContent
    );
    console.log("📏 Closest border text (miles):", closestBorderTextMiles);
    expect(closestBorderTextMiles).toContain("2,030");

    const closestBorderUnitMiles = await page.$eval(
      '[data-testid="toggle-text"]',
      (el) => el.textContent
    );
    console.log("📏 Updated unit:", closestBorderUnitMiles);
    expect(closestBorderUnitMiles).toContain("miles");
  });

  test("plays a game through to winning and checks statistics", async () => {
    // console.log("🧪 Running win game and statistics test");

    // // Set up stats from yesterday
    // const yesterday = dayjs().subtract(1, "day").toDate();
    // const yesterdayStr = yesterday.toString();
    // console.log("📅 Setting up test with yesterday's date:", yesterdayStr);
    // const stats = {
    //   gamesWon: 4,
    //   lastWin: yesterdayStr,
    //   currentStreak: 2,
    //   maxStreak: 5,
    //   usedHints: 0,
    //   guesses: {},
    // };
    // localStorage.setItem("statistics", JSON.stringify(stats));
    // console.log("📊 Initial stats set:", JSON.stringify(stats));

    // console.log("🌐 Navigating to game page");
    // await page.goto("http://localhost:8788/game", {
    //   waitUntil: "networkidle2",
    // });
    // console.log("✅ Page loaded successfully");

    // Testing the sorted list
    console.log("🔍 Checking current sort order");
    const firstItemText = await page.$eval(
      "li",
      (element) => element.textContent
    );
    console.log("📋 First item in current sort:", firstItemText);
    expect(firstItemText).toContain("Saud.");

    console.log("🔄 Changing sort order");
    await page.click('[data-cy="change-sort"]');
    const newFirstItemText = await page.$eval(
      "li",
      (element) => element.textContent
    );
    console.log("📋 First item after sort change:", newFirstItemText);
    expect(newFirstItemText).toContain("Türkiye");

    // Winning
    console.log("🔄 Changing sort order again");
    await page.click('[data-cy="change-sort"]');

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

    const firstItemAfterWin = await page.$eval(
      "li",
      (element) => element.textContent
    );
    console.log("📋 First item after win:", firstItemAfterWin);
    expect(firstItemAfterWin).toContain("Mad.");

    // Check statistics
    console.log("📊 Waiting for statistics to appear");
    await page.waitForFunction(() =>
      document.body.innerText.includes("Statistics")
    );
    console.log("✅ Statistics section found");

    const gamesWon = await page.$eval(
      '[data-cy="games-won"]',
      (el) => el.textContent
    );
    console.log("🎮 Games won:", gamesWon);
    expect(gamesWon).toContain("5");

    const currentStreak = await page.$eval(
      '[data-cy="current-streak"]',
      (el) => el.textContent
    );
    console.log("🔥 Current streak:", currentStreak);
    expect(currentStreak).toContain("3");

    const todaysGuesses = await page.$eval(
      '[data-cy="today\'s-guesses"]',
      (el) => el.textContent
    );
    console.log("🔢 Today's guesses:", todaysGuesses);
    expect(todaysGuesses).toContain("5");

    // Check that the stats remain when you leave and come back
    console.log("🔄 Refreshing page to check persistence");
    await page.goto("http://localhost:8788/game", {
      waitUntil: "networkidle2",
    });
    console.log("✅ Page reloaded successfully");

    const turkiyeExists = await page.evaluate(() =>
      document.body.innerText.includes("Türkiye")
    );
    console.log(
      "🔍 Checking if previous guesses persisted:",
      turkiyeExists ? "yes" : "no"
    );
    expect(turkiyeExists).toBe(true);

    console.log("✅ Test completed successfully");
    await page.close();
  });

  test("breaks a streak", async () => {
    console.log("🧪 Running break streak test");

    // Set up stats from 10 days ago
    const lastWin = dayjs().subtract(10, "day").toDate();
    const lastWinStr = lastWin.toString();
    const stats = {
      gamesWon: 4,
      lastWin: lastWinStr,
      currentStreak: 4,
      maxStreak: 5,
      usedHints: 0,
      guesses: {},
    };
    localStorage.setItem("statistics", JSON.stringify(stats));

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
