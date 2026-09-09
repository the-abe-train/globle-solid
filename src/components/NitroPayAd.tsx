import { onMount, onCleanup } from 'solid-js';
import { getContext } from '../Context';
import { MONGO_GATEWAY_BASE } from '../util/api';

export default function () {
  if (import.meta.env.MODE === 'development') {
    return;
  }

  const context = getContext();
  const isConnected = () => context.user().email !== '';

  let anchorAd: any;
  let leftSiderails: any[] = [];
  let isTeacher = false;

  // Don't run in Dev mode
  // If localhost in URL, return

  onMount(async () => {
    try {
      // @ts-ignore
      if (!isConnected()) {
        console.log('Not connected to TWL account.');
      } else {
        const email = context.user().email;
        const endpoint = '/sponsor' + '?email=' + email;
        const tokenResp = await fetch(endpoint);
        const tokenJson = (await tokenResp.json()) as {
          token?: string;
          clubMember?: boolean;
          isTeacher?: boolean;
        };
        if (!tokenJson.clubMember) return console.log('Not a club member.');
        const token = tokenJson?.token;
        isTeacher = Boolean(tokenJson.isTeacher);
        // @ts-ignore
        if (!window['nitroSponsor']) {
          console.log('NitroPay Sponsor not loaded.');
        } else if (!token) {
          console.log('No NitroPay sponsor token found.');
        } else {
          // @ts-ignore
          window['nitroSponsor'].init(
            {
              token,
              successUrl: 'https://example.com/success',
              cancelUrl: 'https://example.com/cancel',
              product: 58,
            },
            function (res: any) {
              // success callback
              console.log('NitroPay Sponsor success');
              console.log(res);
            },
          );
        }
      }
    } catch (e) {
      console.error('Failed to load NitroPay Sponsor');
      console.error(e);
    }

    try {
      if ('nitroAds' in window && !isTeacher) {
        console.log('Loading NitroPay Ads');
        const [createdAnchorAd, ...createdLeftSiderails] = await Promise.all([
          // @ts-ignore
          window['nitroAds'].createAd('anchor', {
            refreshLimit: 0,
            refreshTime: 30,
            format: 'anchor',
            anchor: 'bottom',
            anchorPersistClose: false,
            anchorClose: true,
            mediaQuery: '(min-width: 0px)',
            report: {
              enabled: true,
              icon: true,
              wording: 'Report Ad',
              position: 'top-right',
            },
            anchorBgColor: '#ffffff00',
          }),
          ...[
            {
              id: 'left-siderail-160',
              sizes: [['160', '600']],
              mediaQuery: '(min-width: 1025px) and (max-width: 1219.98px)',
            },
            {
              id: 'left-siderail-300',
              sizes: [
                ['160', '600'],
                ['300', '250'],
                ['300', '600'],
              ],
              mediaQuery: '(min-width: 1220px) and (max-width: 1259.98px)',
            },
            {
              id: 'left-siderail-320',
              sizes: [
                ['160', '600'],
                ['300', '250'],
                ['300', '600'],
                ['320', '50'],
                ['320', '100'],
                ['320', '480'],
              ],
              mediaQuery: '(min-width: 1260px) and (max-width: 1291.98px)',
            },
            {
              id: 'left-siderail-336',
              sizes: [
                ['160', '600'],
                ['300', '250'],
                ['300', '600'],
                ['320', '50'],
                ['320', '100'],
                ['320', '480'],
                ['336', '280'],
              ],
              mediaQuery: '(min-width: 1292px)',
            },
          ].map(({ id, sizes, mediaQuery }) =>
            // @ts-ignore
            window['nitroAds'].createAd(id, {
              refreshLimit: 0,
              refreshTime: 30,
              format: 'rail',
              rail: 'left',
              railOffsetTop: 0,
              railOffsetBottom: 0,
              railSpacing: 10,
              railCollisionWhitelist: ['*'],
              sizes,
              report: {
                enabled: true,
                icon: true,
                wording: 'Report Ad',
                position: 'bottom-right',
              },
              // The globe is at most 600px wide and centered. These breakpoints
              // reserve the ad width plus the configured 10px edge spacing on
              // each side: 600 + 2 * (ad width + 10px).
              mediaQuery,
            }),
          ),
        ]);
        anchorAd = createdAnchorAd;
        leftSiderails = createdLeftSiderails.flatMap((ad: any) =>
          Array.isArray(ad) ? ad : ad ? [ad] : [],
        );
      } else {
        console.log('NitroPay not loaded.');
      }
    } catch (e) {
      console.error('Failed to load NitroPay Ads');
      console.error(e);
    }
  });

  onCleanup(() => {
    try {
      // @ts-ignore
      if ('nitroAds' in window) {
        console.log('Cleaning up NitroPay Ads');
        if (anchorAd) anchorAd.onNavigate();
        leftSiderails.forEach((ad) => ad.onNavigate());

        return console.log('NitroPay ad stopped.');
      }
    } catch (e) {
      console.error('Failed to clean up NitroPay Ads');
      console.error(e);
    }
  });

  return <></>;
}
