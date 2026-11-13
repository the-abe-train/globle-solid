import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    // App readiness is asserted through locators in each test. Waiting for the
    // full load event makes navigation depend on ads, analytics, and fonts.
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = (url, options) => goto(url, { waitUntil: 'domcontentloaded', ...(options ?? {}) });
    page.reload = (options) => reload({ waitUntil: 'domcontentloaded', ...(options ?? {}) });

    await page.addInitScript(() => {
      Object.assign(window, {
        nitroAds: {
          addUserToken: () => undefined,
          createAd: async () => ({ onNavigate: () => undefined }),
          queue: [],
        },
        nitroSponsor: {
          init: () => undefined,
          queue: [],
          status: 'ready',
        },
      });
    });
    await page.route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(baseURL!).origin
        ? route.continue()
        : route.abort('blockedbyclient'),
    );
    await use(page);
    expect(await (await page.request.get('/__test__/violations')).json()).toEqual([]);
  },
});

export { expect };
export type { Page } from '@playwright/test';
