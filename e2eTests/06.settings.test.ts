import { test, expect, beforeEach, describe } from "vitest";
import puppeteer, { Browser, Page } from "puppeteer";
import rawAnswerData from "../src/data/country_data.json";

describe("Settings tests", () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterEach(async () => {
    await browser.close();
  });

  describe("Explore changing the colours and theme", () => {
    test("checks the reds", async () => {
      await page.goto("http://localhost:8788/");
      const nepalElement = await page.$("#Nepal");
      expect(nepalElement).not.toBeNull();

      const fillColor = await page.evaluate(() => {
        const path = document.querySelector("#Nepal path");
        return path ? window.getComputedStyle(path).fill : null;
      });

      expect(fillColor).toBe("rgb(251, 147, 97)");
    });

    test("check the blues", async () => {
      await page.goto("http://localhost:8788/settings");
      await page.click('[data-cy="toggle-Night-Day"]');
      await page.goto("http://localhost:8788/");

      let fillColor = await page.evaluate(() => {
        const path = document.querySelector("#Nepal path");
        return path ? window.getComputedStyle(path).fill : null;
      });
      expect(fillColor).toBe("rgb(144, 153, 200)");

      await page.goto("http://localhost:8788/settings");
      // await page.click('[data-cy="toggle-Night-Day"]');
      await page.select('[name="Colours"]', "Blues");
      await page.goto("http://localhost:8788/");

      fillColor = await page.evaluate(() => {
        const path = document.querySelector("#Nepal path");
        return path ? window.getComputedStyle(path).fill : null;
      });
      expect(fillColor).toBe("rgb(144, 153, 200)");
    });

    test("checks the other colours", async () => {
      await page.goto("http://localhost:8788/settings");
      await page.select('[name="Colours"]', "Rainbow");
      await page.goto("http://localhost:8788/");

      let fillColor = await page.evaluate(() => {
        const path = document.querySelector("#Nepal path");
        return path ? window.getComputedStyle(path).fill : null;
      });
      expect(fillColor).toBe("rgb(138, 252, 86)");

      await page.goto("http://localhost:8788/settings");
      await page.select('[name="Colours"]', "Grayscale");
      await page.goto("http://localhost:8788/");

      fillColor = await page.evaluate(() => {
        const path = document.querySelector("#Nepal path");
        return path ? window.getComputedStyle(path).fill : null;
      });
      expect(fillColor).toBe("rgb(155, 155, 155)");
    });
  });

  describe("Explore changing the language", () => {
    test("checks the game translates into French", async () => {
      console.log("Starting language test - navigating to home page");
      await page.goto("http://localhost:8788/");

      // Use data-cy to check for "How to Play" text
      const howToPlayText = await page.$eval(
        '[data-i18n="helpTitle"]',
        (el) => el.textContent || ""
      );
      console.log(`Found help title text: "${howToPlayText}"`);
      expect(howToPlayText).toContain("How to Play");

      console.log("Navigating to settings page");
      await page.goto("http://localhost:8788/settings");

      // Debug the select element before attempting to use it
      console.log("Checking if language selector exists");
      const languageSelector = await page.$('[name="Language"]');
      if (!languageSelector) {
        console.log("ERROR: Language selector not found");
        // Take a screenshot to see what's on the page
        await page.screenshot({ path: "language-selector-debug.png" });

        // Dump the page HTML to console for debugging
        const html = await page.content();
        console.log("Page HTML:", html);
      } else {
        console.log("Language selector found");

        // Try a more robust approach for selecting the option
        console.log("Changing language to French");
        // Method 1: Using page.select
        // await page.select('[name="Language"]', "Français");
        await page.select('[name="Language"]', "fr-FR");

        console.log("Waiting for language change to apply...");
        // Wait a bit longer to ensure changes are processed
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        // await page.reload();

        // Use data-cy to check for "Paramètres" text
        const settingsText = await page.$eval(
          '[data-i18n="SettingsTitle"]',
          (el) => el.textContent || ""
        );
        console.log(`Found settings title in French: "${settingsText}"`);
        expect(settingsText).toContain("Paramètres");

        // Set fake answer
        console.log("Setting up Madagascar as target country");
        const answer = rawAnswerData.features.find(
          (feature) => feature.properties.NAME === "Madagascar"
        ) as Country;

        // Set localStorage BEFORE navigating to the page
        await page.evaluateOnNewDocument((answerData) => {
          localStorage.setItem("practice", answerData);
          console.log("Set practice country in localStorage");
        }, JSON.stringify(answer));

        console.log("Navigating to practice page");
        await page.goto("http://localhost:8788/practice");
        console.log("Entering guess: libye");
        await page.type('[data-cy="guesser"]', "libye");
        await page.keyboard.press("Enter");

        // Use data-cy to check for "Libye" text in the guess list
        const libyeText = await page.$eval(
          '[data-cy="countries-list"]',
          (el) => el.textContent || ""
        );
        console.log(`Guess list content after libye: "${libyeText}"`);
        expect(libyeText).toContain("Libye");

        console.log("Entering guess: royaume uni");
        await page.type('[data-cy="guesser"]', "royaume-uni");
        await page.keyboard.press("Enter");

        // Use data-cy to check for "Royaume-Uni" text in the guess list
        const ukText = await page.$eval(
          '[data-cy="countries-list"]',
          (el) => el.textContent || ""
        );
        console.log(`Countries list content: "${ukText}"`);
        expect(ukText).toContain("Royaume-Uni");

        console.log("Language test completed successfully");
      }
    });
  });
});

export default {};
