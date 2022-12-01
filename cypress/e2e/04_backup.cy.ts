import dayjs from "dayjs";

describe("Fail backup process", () => {
  it("cannot backup score because not signed in", () => {
    cy.visit("/settings");
    cy.contains("connect to your Google account").should("exist");
  });
});

describe("Test backup process", () => {
  beforeEach(function () {
    cy.loginByGoogleApi();
  });

  it("backs up my score", () => {
    cy.visit("/");
    const yesterday = dayjs().subtract(1, "day");
    cy.loadStats(yesterday.toDate());

    cy.visit("/settings");
    cy.contains(Cypress.env("myEmail"));

    cy.reload();
    cy.contains(
      `Local Stats -- Date saved: ${yesterday.format("YYYY-MM-DD")}`
    ).should("exist");

    cy.contains("Save cloud backup").click();
    cy.contains(
      `Cloud Backup -- Date saved: ${yesterday.format("YYYY-MM-DD")}`
    ).should("exist");
  });

  it("restores up my score", () => {
    cy.visit("/");
    window.localStorage.setItem("statistics", "{}");

    cy.visit("/settings");
    cy.contains(Cypress.env("myEmail"));

    cy.contains("Restore from backup").click();
    cy.get('[data-cy="yes-btn"]').click();

    const yesterday = dayjs().subtract(1, "day");
    cy.contains(
      `Local Stats -- Date saved: ${yesterday.format("YYYY-MM-DD")}`
    ).should("exist");
  });

  after(() => {
    cy.contains("Delete backup").click();
    cy.get('[data-cy="yes-btn"]').click();
    cy.contains("No cloud backup saved").should("exist");
  });
});

export default {};
