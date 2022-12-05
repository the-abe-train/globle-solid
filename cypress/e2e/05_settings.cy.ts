describe("Explore changing the colorus", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("How to Play").should("exist");
  });
  it("Check the reds", () => {
    cy.get("#Nepal").find('path[fill="rgb(251, 148, 97)"]').should("exist");
  });
});

export default {};
