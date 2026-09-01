import { expect, test as base } from '@playwright/test';

const thirdPartyResource =
  /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|www\.googletagmanager\.com|s\.nitropay\.com)(?:\/|$)/;

export const test = base.extend({
  page: async ({ page }, use) => {
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
    await page.route(thirdPartyResource, (route) => route.abort('blockedbyclient'));
    await use(page);
  },
});

export { expect };
export type { Page } from '@playwright/test';
