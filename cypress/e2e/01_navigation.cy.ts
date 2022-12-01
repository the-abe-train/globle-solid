describe("Explore all navigation links", () => {
  it("Visits every nav link", () => {
    cy.visit("/");
    cy.contains("How to Play").should("exist");

    cy.get('[data-cy="settings-link"]').click();
    cy.url().should("contain", "/settings");
    cy.contains("Settings").should("exist");

    cy.get('[data-cy="practice-link"]').click();
    cy.url().should("contain", "/practice");
    cy.contains("playing a practice game").should("exist");

    cy.get('[data-cy="game-link"]').click();
    cy.url().should("contain", "/game");
    cy.contains("first guess").should("exist");

    cy.get('[data-cy="faq-footer-link"]').click();
    cy.url().should("contain", "/faq");
    cy.contains("FAQ").should("exist");

    cy.wait(1000);
    cy.contains("privacy policy").click();
    cy.get('[href="/privacy-policy"]').click();
    cy.url().should("contain", "/privacy-policy");
    cy.contains("Privacy Policy").should("exist");
  });
});

export default {};
