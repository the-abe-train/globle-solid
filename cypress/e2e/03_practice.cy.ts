import crypto from "crypto-js";
import rawAnswerData from "../../src/data/country_data.json";

describe("Play a practice game", () => {
  it("plays the game in practice mode", () => {
    cy.fixture("madagascar").then((madagascar) => {
      window.localStorage.setItem("practice", JSON.stringify(madagascar));
    });

    cy.visit("/practice");
    cy.contains("practice game").should("exist");

    cy.get('[data-cy="guesser"]').type("canada{enter}");
    cy.contains("next guess").should("exist");

    cy.get('[data-cy="guesser"]').type("united kingdom{enter}");
    cy.contains("United Kingdom is warmer").should("exist");

    cy.get('[data-cy="guesser"]').type("chile{enter}");
    cy.contains("Chile is cooler").should("exist");

    cy.get('[data-cy="guesser"]').type("madagascar{enter}");
    cy.contains("The Mystery Country is Madagascar").should("exist");

    cy.contains("Play again?").should("exist");
    cy.get('[data-cy="yes-btn"]').click();
    cy.contains("any country").should("exist");

    cy.contains("Reveal answer").click();
    cy.contains("The Mystery Country is").should("exist");

    cy.wait(1000);
    cy.contains("Play again?").should("exist");
    cy.get('[data-cy="no-btn"]').click();
    // cy.url().should("not.contain", "practice");
  });
});

export default {};
