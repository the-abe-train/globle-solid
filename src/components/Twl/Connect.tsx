import Icon from '../Icon';
import { createEffect, createSignal, onMount } from 'solid-js';
import { getContext } from '../../Context';
import jwtDecode from 'jwt-decode';
import { subscribeToNewsletter } from '../../util/newsletter';
import { getAcctStats, combineStats } from '../../util/stats';

export default function () {
  const url = new URL(window.location.href);
  const discordRedirectUri = `${url.origin}/discord`;

  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const DISCORD_STATE = import.meta.env.VITE_DISCORD_STATE;

  const isConnected = () => context.user().email !== '';
  const context = getContext();

  let googleBtn: HTMLDivElement | null = null;
  async function handleCredentialResponse(googleResponse?: google.accounts.id.CredentialResponse) {
    if (!googleResponse) return;
    const googleToken = googleResponse?.credential;

    // Add email to context
    const email = jwtDecode<Token>(googleToken).email;
    context.setUser({ email });

    // Subscribe to newsletter if user opted in
    await subscribeToNewsletter(email);

    // Immediately sync stats after sign-in
    console.log('Google sign-in successful - syncing stats');
    try {
      const accountStats = await getAcctStats(context);
      if (typeof accountStats !== 'string') {
        const localStats = context.storedStats();
        if (localStats.gamesWon === 0) {
          console.log('Local stats empty - using account stats from Google sign-in');
          context.storeStats(accountStats);
        } else {
          console.log('Combining local and account stats after Google sign-in');
          const combinedStats = combineStats(localStats, accountStats);
          context.storeStats(combinedStats);
        }
        console.log('Stats synced successfully after Google sign-in');
      } else {
        console.error('Failed to sync stats after Google sign-in:', accountStats);
      }
    } catch (error) {
      console.error('Error syncing stats after Google sign-in:', error);
    }
  }

  const [choice, setChoice] = createSignal(
    localStorage.getItem('twlNewsletter') === 'false' ? false : true, // Default to true if not set or 'true'
  );

  // Persist newsletter choice
  createEffect(() => {
    localStorage.setItem('twlNewsletter', choice().toString());
  });

  // Initialize Google button once mounted (ensure ref is set)
  onMount(() => {
    try {
      if (!isConnected() && typeof google !== 'undefined' && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
        });
        if (googleBtn) {
          google.accounts.id.renderButton(googleBtn, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: '208', // Fixed width to match our container (w-52 = 208px)
          });
        }
      }
    } catch (err) {
      console.log('Failed to render google button');
      console.error(err);
    }
  });

  return (
    <div class="mt-6">
      <style>{`
        /* Force Google button to maintain consistent width */
        [data-credential-picker-iframe] {
          width: 208px !important;
          min-width: 208px !important;
          max-width: 208px !important;
        }
        .g_id_signin {
          width: 208px !important;
          min-width: 208px !important;
          max-width: 208px !important;
        }
        .g_id_signin iframe {
          width: 208px !important;
          min-width: 208px !important;
          max-width: 208px !important;
        }
      `}</style>
      <p class="my-5 text-center text-sm" data-i18n="TWL1">
        Connect a TWL Account to backup your stats.
      </p>
      <div class="mx-auto w-52 space-y-2">
        <div class="flex h-10 w-full justify-center">
          <div
            ref={(el) => (googleBtn = el)}
            class="flex h-full w-full flex-col justify-center"
            style={{
              'min-width': '208px',
              'max-width': '208px',
            }}
          />
        </div>
        <form action="https://discord.com/api/oauth2/authorize">
          <input hidden type="text" name="client_id" value={DISCORD_CLIENT_ID} />
          <input hidden type="text" name="redirect_uri" value={discordRedirectUri} />
          <input hidden type="text" name="response_type" value="code" />
          <input hidden type="text" name="scope" value="identify email" />
          <input hidden type="text" name="state" value={DISCORD_STATE} />
          <button class="flex h-10 w-full max-w-[208px] min-w-[208px] items-center justify-center space-x-3 rounded border border-gray-100 bg-white p-1 align-middle shadow transition-shadow hover:shadow-md">
            <span class="p-1 text-sm" data-i18n="TWL3">
              Sign in with Discord
            </span>
            <div class="mt-1">
              <Icon shape="discord" size={20} />
            </div>
          </button>
        </form>
      </div>
      <form action="" class="mt-4 flex items-center justify-center space-x-1">
        <input
          type="checkbox"
          name="check"
          style={{ 'accent-color': '#4a5568' }}
          checked={choice()}
          onChange={() => {
            // choice.value = !choice.value;
            setChoice((x) => !x);
          }}
        />
        <label for="check" class="text-center text-sm" data-i18n="TWL4">
          Subscribe to Trainwreck Labs newsletter.
        </label>
      </form>
    </div>
  );
}
