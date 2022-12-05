describe("Explore changing the colours and theme", () => {
  it("checks the reds", () => {
    cy.visit("/");
    cy.get("#Nepal").find('path[fill="rgb(251, 148, 97)"]').should("exist");
  });
  it("check the blues", () => {
    cy.visit("/settings");
    cy.get('[data-cy="toggle-Night-Day"]').click();
    cy.visit("/");
    cy.get("#Nepal").find('path[fill="rgb(144, 154, 201)"]').should("exist");
    cy.visit("/settings");
    cy.get('[data-cy="toggle-Night-Day"]').click();
    cy.get('[name="Colours"]').select("Blues");
    cy.visit("/");
    cy.get("#Nepal").find('path[fill="rgb(144, 154, 201)"]').should("exist");
  });
  it("checks the other colours", () => {
    cy.visit("/settings");
    cy.get('[name="Colours"]').select("Rainbow");
    cy.visit("/");
    cy.get("#Nepal").find('path[fill="rgb(136, 253, 88)"]').should("exist");
    cy.visit("/settings");
    cy.get('[name="Colours"]').select("Grayscale");
    cy.visit("/");
    cy.get("#Nepal").find('path[fill="rgb(156, 156, 156)"]').should("exist");
  });
});

describe("Explore changing the language", () => {
  it("checks the game translates into French", () => {
    cy.visit("/");
    cy.contains("How to Play").should("exist");
    cy.visit("/settings");
    cy.get('[name="Language"]').select("Français");
    cy.contains("Paramètres").should("exist");
    cy.fixture("madagascar").then((madagascar) => {
      window.localStorage.setItem("practice", JSON.stringify(madagascar));
    });
    cy.visit("/practice");
    cy.get('[data-cy="guesser"]').type("royaume uni{enter}");
    cy.contains("Royaume-Uni").should("exist");
  });
});

export default {};
