import dayjs from "dayjs";
import rawAnswerData from "../../src/data/country_data.json";

describe("Test the answer fetching function", () => {
  it("plays today's game", () => {
    const crypto = require("crypto-js");

    function decrypt(encryptedAnsKey: string) {
      const key = Cypress.env("cryptoKey");
      const bytes = crypto.AES.decrypt(encryptedAnsKey, key);
      const originalText = bytes.toString(crypto.enc.Utf8);
      const answerKey = parseInt(originalText);
      const answer = rawAnswerData["features"][answerKey] as Country;
      return answer.properties.NAME;
    }

    cy.intercept("GET", "/answer**").as("answer");

    cy.visit("/game");

    cy.wait("@answer")
      .its("response.body")
      .then((body) => {
        const data = JSON.parse(body);
        const answer = decrypt(data.answer);
        console.log(answer);
        cy.get('[data-cy="guesser"]').type(`${answer}{enter}`);
      });

    cy.contains("Statistics").should("exist");
  });
});

describe("Tests with a fake answer", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.intercept("GET", "/answer**", (req) => {
      const crypto = require("crypto-js");
      const body = JSON.stringify({
        answer: crypto.AES.encrypt("159", Cypress.env("cryptoKey")).toString(),
      });
      req.reply({
        statusCode: 200,
        body,
      });
    });
  });

  it("checks that old guesses get reset when they expire", () => {
    const yesterday = dayjs().subtract(1, "day").toDate();
    cy.loadStats(yesterday);
    cy.fixture("fake_stats").then((oldStats) => {
      const guesses = oldStats["guesses"];
      guesses["day"] = yesterday;
      window.localStorage.setItem("guesses", JSON.stringify(guesses));
    });

    cy.visit("/game");

    cy.contains("any country").should("exist");
  });

  it("plays a game with many types of guesses", () => {
    const yesterday = dayjs().subtract(1, "day").toDate();
    cy.loadStats(yesterday);

    cy.visit("/game");

    cy.contains("any country").should("exist");

    // Nonsense guess
    cy.get('[data-cy="guesser"]').type("asdfasdfasdf{enter}");
    cy.contains(`"asdfasdfasdf" not found in database`).should("exist");

    // Close guess
    cy.get('[data-cy="guesser"]').type("swodon{enter}");
    cy.contains("Did you mean Sweden?").should("exist");

    // Correct guess
    cy.get('[data-cy="guesser"]').type("Turkey{enter}");
    cy.contains("next guess").should("exist");

    // Close enough guess
    cy.get('[data-cy="guesser"]').type("saudi arubia{enter}");
    cy.contains("Saudi Arabia is warmer").should("exist");

    // Already guessed
    cy.get('[data-cy="guesser"]').type("saudi arobia{enter}");
    cy.contains("Already guessed Saudi Arabia").should("exist");

    // Correct abbreviation
    cy.get('[data-cy="guesser"]').type("uae{enter}");
    cy.contains("United Arab Emirates is cooler").should("exist");

    // Alternate name
    cy.get('[data-cy="guesser"]').type("burma{enter}");
    cy.contains("Myanmar is cooler").should("exist");

    // Toggle distance unit
    cy.contains("3,265").should("exist");
    cy.contains("km").should("exist");
    cy.contains("miles").should("not.exist");
    cy.get('[data-cy="toggle-km-miles"]').click();
    cy.contains("2,030").should("exist");
    cy.contains("miles").should("exist");

    // Testing the sorted list
    cy.get("li").eq(0).should("contain.text", "Saud.");
    cy.get('[data-cy="change-sort"]').click();
    cy.get("li").eq(0).should("contain.text", "Türkiye");

    // Winning
    cy.get('[data-cy="change-sort"]').click();
    cy.get('[data-cy="guesser"]').type("madagascar{enter}");
    cy.contains("The Mystery Country is Madagascar").should("exist");
    cy.get("li").eq(0).should("contain.text", "Mad.");

    cy.contains("Statistics").should("exist");
    cy.get('[data-cy="games-won"]').should("contain", 5);
    cy.get('[data-cy="current-streak"]').should("contain", 3);
    cy.get(`[data-cy="today's-guesses"]`).should("contain", 5);
    // cy.get(`[data-cy="today's-guesses"]`).should("contain", 4);

    // Check that the stats remain when you leave and come back
    cy.visit("/");
    cy.visit("/game");
    cy.contains("Türkiye").should("exist");
  });

  it("breaks a streak", () => {
    const lastWin = dayjs().subtract(10, "day").toDate();
    cy.loadStats(lastWin);

    cy.visit("/game");

    cy.get('[data-cy="guesser"]').type("madagascar{enter}");
    cy.contains("The Mystery Country is Madagascar").should("exist");

    cy.contains("Statistics").should("exist");
    cy.get('[data-cy="games-won"]').should("contain", 5);
    cy.get('[data-cy="current-streak"]').should("contain", 1);
  });
});

export default {};
