import Icon from "../Icon";
import { createEffect, createSignal } from "solid-js";
import { getContext } from "../../Context";
import jwtDecode from "jwt-decode";

export default function () {
  const url = new URL(window.location.href);
  const discordRedirectUri = `${url.origin}/discord`;

  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const DISCORD_STATE = import.meta.env.VITE_DISCORD_STATE;

  const isConnected = () => context.user().email !== "";
  const context = getContext();

  let googleBtn: HTMLDivElement;
  async function handleCredentialResponse(
    googleResponse?: google.accounts.id.CredentialResponse
  ) {
    if (!googleResponse) return;
    const googleToken = googleResponse?.credential;

    // Add email to context
    const email = jwtDecode<Token>(googleToken).email;
    context.setUser({ email });
  }

  const [choice, setChoice] = createSignal(true);

  // When "isConnected" changes, sign up for newlsetter if choice is true
  createEffect(() => {
    localStorage.setItem("twlNewsletter", choice().toString());
    console.log("choice", choice());
  }, [choice()]);

  createEffect(() => {
    if (!isConnected() && google) {
      console.log("Rendering google button");
      try {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
        });
        google.accounts.id.renderButton(googleBtn, {
          type: "standard",
        });
      } catch (err) {
        console.log("Failed to render google button");
        console.error(err);
      }
    } else {
      console.log("Google button script not found");
    }
  });

  return (
    <div class="mt-6">
      <p class="text-center text-sm my-5" data-i18n="TWL1">
        Connect a TWL Account to backup your stats.
      </p>
      <div class="w-52 mx-auto flex justify-center">
        <div
          ref={googleBtn!}
          class="w-full my-1 h-10 flex flex-col justify-center"
        />
      </div>
      <form
        action="https://discord.com/api/oauth2/authorize"
        class="w-52 mx-auto mb-3"
      >
        <input hidden type="text" name="client_id" value={DISCORD_CLIENT_ID} />
        <input
          hidden
          type="text"
          name="redirect_uri"
          value={discordRedirectUri}
        />
        <input hidden type="text" name="response_type" value="code" />
        <input hidden type="text" name="scope" value="identify email" />
        <input hidden type="text" name="state" value={DISCORD_STATE} />
        <button
          class="bg-white border rounded shadow p-1 w-full h-10 my-2
          flex items-center justify-center align-middle space-x-3"
        >
          <span class="text-sm p-1" data-i18n="TWL3">
            Sign in with Discord
          </span>
          <div class="mt-1">
            <Icon shape="discord" size={20} />
          </div>
        </button>
      </form>
      <form action="" class="flex justify-center items-center space-x-1 mt-3">
        <input
          type="checkbox"
          name="check"
          style={{ "accent-color": "#4a5568" }}
          checked={choice()}
          onChange={() => {
            // choice.value = !choice.value;
            setChoice((x) => !x);
          }}
        />
        <label for="check" class="text-sm text-center" data-i18n="TWL4">
          Subscribe to Trainwreck Labs newsletter.
        </label>
      </form>
    </div>
  );
}
