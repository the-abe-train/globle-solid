import invariant from "tiny-invariant";
import jwtDecode from "jwt-decode";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { getContext } from "../Context";
import dayjs from "dayjs";
import { combineStats, getAcctStats } from "../util/stats";

export default function () {
  const [showPrompt, setShowPrompt] = createSignal(false);

  const context = getContext();

  const isConnected = () => context.token().google !== "";
  const [msg, setMsg] = createSignal("");

  onMount(async () => {
    // If connected, fetch backup
    if (isConnected()) {
      const googleToken = context.token().google;
      const endpoint = "/account" + "?token=" + googleToken;
      const accountStats = await fetch(endpoint, {
        method: "GET",
      });
      const data = (await accountStats.json()) as any;
      if (data?.stats) {
        const accountStats = data.stats as Stats;
        const localStats = context.storedStats();
        if (accountStats.lastWin === localStats.lastWin) {
          setMsg(`Account is synced!`);
        } else {
          setMsg(
            `Account last synced ${dayjs(accountStats.lastWin).format(
              "MMM D, YYYY"
            )}.`
          );
        }
      }
    }
  });

  let googleBtn: HTMLDivElement;
  async function handleCredentialResponse(
    googleResponse?: google.accounts.id.CredentialResponse
  ) {
    if (!googleResponse) return setMsg("Failed to connect to Google account.");
    const googleToken = googleResponse?.credential;

    // Fetch account stats
    const accountStats = await getAcctStats(context, googleToken);
    if (typeof accountStats === "string") {
      return setMsg(accountStats);
    }
    const localStats = context.storedStats();

    if (localStats.gamesWon === 0) {
      context.storeStats(accountStats);
      setMsg("Loaded stats from account.");
    } else {
      // Combine local and account stats
      const combinedStats = combineStats(localStats, accountStats);
      context.storeStats(combinedStats);

      // Store combined stats in account
      const endpoint = "/account" + "?token=" + googleToken;
      await fetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(combinedStats),
      });
      setMsg("Combined local and account stats.");
    }

    // Add token to context
    context.setToken({ google: googleToken });
  }

  createEffect(() => {
    if (!isConnected() && google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });
      google.accounts.id.renderButton(googleBtn, {
        type: "standard",
      });
    }
  });

  // delete backup
  function deleteAccountPrompt() {
    setShowPrompt(true);
  }

  async function deleteAccount() {
    try {
      const googleToken = context.token().google;
      invariant(googleToken, "No token found in context.");
      const endpoint = "/account" + "?token=" + googleToken;
      const response = await fetch(endpoint, {
        method: "DELETE",
      });
      const data = (await response.json()) as any;
      context.setToken({ google: "" });
      setMsg(data.message);
      setShowPrompt(false);
    } catch (e) {
      console.error(e);
      setMsg("Failed to delete backup. Please contact support.");
    }
  }

  function logout() {
    context.setToken({ google: "" });
    setMsg("Logged out.");
  }

  return (
    <div class="space-y-4 my-4">
      <h2 class="text-center text-2xl my-5 font-extrabold font-header">
        Stats Backup
      </h2>
      <Show
        when={isConnected()}
        fallback={
          <div>
            <p>
              If you want to keep your stats but play on a different device,
              connect to your Google account to backup your data in the cloud:
            </p>
            <div
              ref={googleBtn!}
              class="w-fit my-3 h-10 flex flex-col justify-center"
            />
          </div>
        }
      >
        <p>
          Google account <b>{jwtDecode<Token>(context.token().google).email}</b>{" "}
          connected!
        </p>
      </Show>
      <p>{msg()}</p>
      <Show when={isConnected()}>
        <div class="flex space-x-4">
          <button
            class=" text-red-700 border-red-700 border rounded-md px-4 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 
          disabled:text-red-400 disabled:bg-transparent disabled:border-red-400
          dark:text-red-500 dark:border-red-500 dark:disabled:border-red-400
          dark:hover:bg-red-500 dark:hover:text-black"
            disabled={!isConnected()}
            onClick={deleteAccountPrompt}
          >
            Delete backup
          </button>
          <button
            class=" text-red-700 border-red-700 border rounded-md px-4 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 
          disabled:text-red-400 disabled:bg-transparent disabled:border-red-400
          dark:text-red-500 dark:border-red-500 dark:disabled:border-red-400
          dark:hover:bg-red-500 dark:hover:text-black"
            disabled={!isConnected()}
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </Show>
      <Show when={showPrompt()}>
        <p>Are you sure you want to delete your account?</p>
        <div class="flex space-x-3">
          <button
            class=" text-red-700 border-red-700 border rounded-md px-4 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 
          disabled:text-red-400 disabled:bg-transparent disabled:border-red-400
          dark:text-red-500 dark:border-red-500 dark:disabled:border-red-400
          dark:hover:bg-red-500 dark:hover:text-black"
            onClick={deleteAccount}
          >
            Yes
          </button>
          <button
            class="bg-blue-700 hover:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900
          text-white rounded-md px-4 py-2 block text-base font-medium 
          focus:outline-none focus:ring-2 focus:ring-blue-300 
          disabled:bg-blue-400 dark:disabled:bg-purple-900
          justify-around"
            onClick={() => setShowPrompt(false)}
          >
            No
          </button>
        </div>
      </Show>
    </div>
  );
}
