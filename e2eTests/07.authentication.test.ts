import { test, expect, describe } from "vitest";

type ResourceProps = {
  token: string;
  clubMember: boolean;
  isTeacher: boolean;
};

describe("Authentication and membership tests", () => {
  const url = (email: string) =>
    `http://localhost:8788/sponsor?email=${encodeURIComponent(email)}`;

  test("Club memeber", async () => {
    const response = await fetch(url("abraham.train@gmail.com"));
    const json = (await response.json()) as ResourceProps;
    console.log(json);
    expect(json.clubMember).toBe(true);
  });

  test("Teacher", async () => {
    const response = await fetch(url("rgennes@andovercsd.org"));
    const json = (await response.json()) as ResourceProps;
    expect(json.isTeacher).toBe(true);
  });

  test("Not a club member", async () => {
    const response = await fetch(url("annabellybug08@gmail.com"));
    const json = (await response.json()) as ResourceProps;
    expect(json.clubMember).toBe(false);
  });
});

export default {};
