import { test, expect } from '@playwright/test';

type ResourceProps = {
  token: string;
  clubMember: boolean;
  isTeacher: boolean;
};

test.describe('Authentication and membership tests', () => {
  const url = (email: string) => `/sponsor?email=${encodeURIComponent(email)}`;

  test('Club member', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('abraham.train@gmail.com')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    expect(json.clubMember).toBe(true);
  });

  test('Teacher', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('rgennes@andovercsd.org')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    expect(json.isTeacher).toBe(true);
  });

  test('Not a club member', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('annabellybug08@gmail.com')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    expect(json.clubMember).toBe(false);
  });
});
