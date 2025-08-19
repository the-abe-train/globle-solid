import Icon from '../Icon';
import { createEffect, createSignal, onMount } from 'solid-js';
import { getContext } from '../../Context';
import jwtDecode from 'jwt-decode';

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
  }

  const [choice, setChoice] = createSignal(true);

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
          google.accounts.id.renderButton(googleBtn, { type: 'standard' });
        }
      }
    } catch (err) {
      console.log('Failed to render google button');
      console.error(err);
    }
  });

  return (
    <div class="mt-6">
      <p class="my-5 text-center text-sm" data-i18n="TWL1">
        Connect a TWL Account to backup your stats.
      </p>
      <div class="mx-auto flex w-52 justify-center">
        <div ref={(el) => (googleBtn = el)} class="my-1 flex h-10 w-full flex-col justify-center" />
      </div>
      <form action="https://discord.com/api/oauth2/authorize" class="mx-auto mb-3 w-52">
        <input hidden type="text" name="client_id" value={DISCORD_CLIENT_ID} />
        <input hidden type="text" name="redirect_uri" value={discordRedirectUri} />
        <input hidden type="text" name="response_type" value="code" />
        <input hidden type="text" name="scope" value="identify email" />
        <input hidden type="text" name="state" value={DISCORD_STATE} />
        <button class="my-2 flex h-10 w-full items-center justify-center space-x-3 rounded border bg-white p-1 align-middle shadow">
          <span class="p-1 text-sm" data-i18n="TWL3">
            Sign in with Discord
          </span>
          <div class="mt-1">
            <Icon shape="discord" size={20} />
          </div>
        </button>
      </form>
      <form action="" class="mt-3 flex items-center justify-center space-x-1">
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
