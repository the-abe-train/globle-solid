describe("Explore changing the colorus", () => {
  it("Changes the colours", () => {
    cy.visit("/");
    cy.contains("How to Play").should("exist");
    cy.get("#Nepal").find('path[fill="rgb(251, 148, 97)"]').should("exist");
  });
});

export default {};
