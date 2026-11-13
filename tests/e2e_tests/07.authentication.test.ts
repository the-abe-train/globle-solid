import { test, expect } from './fixtures';

type ResourceProps = {
  token: string;
  clubMember: boolean;
  isTeacher: boolean;
};

test.describe('Authentication and membership tests', () => {
  const url = (email: string) => `/sponsor?email=${encodeURIComponent(email)}`;

  test('Club member', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('member@example.test')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    console.log(json);
    expect(json.clubMember).toBe(true);
  });

  test('Teacher', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('teacher@example.test')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    expect(json.isTeacher).toBe(true);
  });

  test('Not a club member', async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}${url('nonmember@example.test')}`);
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as ResourceProps;
    expect(json.clubMember).toBe(false);
  });
});
