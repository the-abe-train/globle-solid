import dayjs from "dayjs";
import jwtDecode from "jwt-decode";
import {
  createEffect,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";
import Prompt from "../components/Prompt";
import { getContext } from "../Context";

export default function () {
  const context = getContext();
  // Fetch backup
  async function fetchBackup() {
    const googleToken = context.token().google;
    try {
      const endpoint = `/.netlify/functions/backup?token=${googleToken}`;
      const response = await fetch(endpoint);
      if (response.status === 205) {
        context.setToken({ google: "" });
        return null;
      }
      if (response.status === 204) return null;
      const data = await response.json();
      return (data?.document as Stats) ?? null;
    } catch (e) {
      return null;
    }
  }

  const isConnected = () => context.token().google !== "";
  const [msg, setMsg] = createSignal("");
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [promptText, setPromptText] = createSignal("");
  const [promptType, setPromptType] = createSignal<Prompt>("Choice");
  const [promptAction, setPromptAction] = createSignal(restoreBackup);
  // const [backupStats, setBackupStats] = createSignal<Stats | null>(null);
  const [backupStats, { refetch }] = createResource(
    context.token().google,
    fetchBackup
  );
  const alreadyBackedUp = () => {
    const backup = backupStats();
    if (!backup) return false;
    return Object.keys(backup).every((key) => {
      const statKey = key as keyof Stats;
      return backup[statKey] === context.storedStats()[statKey];
    });
  };

  let googleBtn: HTMLDivElement;
  async function handleCredentialResponse(
    googleResponse?: google.accounts.id.CredentialResponse
  ) {
    if (googleResponse) {
      const googleToken = googleResponse?.credential;
      context.setToken({ google: googleToken });
      refetch();
    } else {
      setMsg("Failed to connect to Google account.");
    }
  }

  console.log("client id", import.meta.env.VITE_GOOGLE_CLIENT_ID);
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

  // Saving score
  async function saveBackup() {
    try {
      const body = JSON.stringify({
        stats: context.storedStats(),
        token: context.token().google,
      });
      const netlifyResponse = await fetch("/.netlify/functions/backup", {
        method: "PUT",
        body,
      });
      const data = await netlifyResponse.json();
      const message = data.message;
      setPromptType("Message");
      setPromptText(message);
      setShowPrompt(true);
      refetch();
    } catch (e) {
      console.error(e);
      setMsg("Failed to save score. Please contact support.");
    }
  }

  // Restore backup
  function restoreBackupPrompt() {
    setPromptType("Choice");
    setPromptText(
      "Are you sure you want to restore from backup? This will replace your current score."
    );
    setPromptAction(() => restoreBackup);
    setShowPrompt(true);
  }
  async function restoreBackup() {
    try {
      const data = await fetchBackup();
      // const data = await fetchBackup(context.token().google);
      if (data) context.storeStats(data);
      setPromptType("Message");
      setPromptText("Backup restored.");
    } catch (e) {
      console.error(e);
      setMsg("Failed to restore backup. Please contact support.");
    }
  }

  // Delete backup
  function deleteBackupPrompt() {
    setPromptType("Choice");
    setPromptText("Are you sure you want to delete your backup?");
    setPromptAction(() => deleteBackup);
    setShowPrompt(true);
  }

  async function deleteBackup() {
    try {
      const endpoint = `/.netlify/functions/backup?token=${
        context.token().google
      }`;
      const netlifyResponse = await fetch(endpoint, {
        method: "DELETE",
      });
      const data = await netlifyResponse.json();
      setPromptType("Message");
      setPromptText(data.message);
      refetch();
    } catch (e) {
      console.error(e);
      setMsg("Failed to restore score. Please contact support.");
    }
  }

  function showStats(stats: Stats, source: "Local Stats" | "Cloud Backup") {
    if ((stats.gamesWon < 1 || !stats.lastWin) && source === "Local Stats")
      return <p>No local stats recorded.</p>;
    return (
      <p>
        {source} -- Date saved:
        {dayjs(stats.lastWin).format(" YYYY-MM-DD")}, best streak:{" "}
        {stats.maxStreak}.
      </p>
    );
  }

  return (
    <div class="space-y-4">
      <h3 class="text-2xl font-extrabold font-header">Stats Backup</h3>
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
        <Switch>
          <Match when={backupStats.loading}>
            {" "}
            <p>Loading...</p>{" "}
          </Match>
          <Match when={backupStats.error}>
            {" "}
            <p>Error connecting to cloud</p>{" "}
          </Match>
          <Match when={!backupStats.loading}>
            <Show
              when={backupStats()}
              fallback={<p>No cloud backup saved yet.</p>}
              keyed
            >
              {(stats) => showStats(stats, "Cloud Backup")}
            </Show>
          </Match>
        </Switch>
        <Show
          when={context.storedStats()}
          fallback={<p>No local stats saved yet.</p>}
          keyed
        >
          {(stats) => showStats(stats, "Local Stats")}
        </Show>
      </Show>
      <p>{msg()}</p>
      <div class="flex space-x-3">
        <button
          class="bg-blue-700 hover:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900
          text-white rounded-md px-4 py-2 block text-base font-medium 
          focus:outline-none focus:ring-2 focus:ring-blue-300 
          disabled:bg-blue-400 dark:disabled:bg-purple-900
          justify-around"
          disabled={
            !isConnected() ||
            context.storedStats().gamesWon < 1 ||
            alreadyBackedUp() ||
            backupStats.loading
          }
          onClick={saveBackup}
        >
          Save cloud backup
        </button>
        <button
          class="bg-blue-700 hover:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900
          text-white rounded-md px-4 py-2 block text-base font-medium 
          focus:outline-none focus:ring-2 focus:ring-blue-300 
          disabled:bg-blue-400 dark:disabled:bg-purple-900
          justify-around"
          disabled={!isConnected() || !backupStats()}
          onClick={restoreBackupPrompt}
        >
          Restore from backup
        </button>
        <button
          class=" text-red-700 border-red-700 border rounded-md px-4 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 
          disabled:text-red-400 disabled:bg-transparent disabled:border-red-400
          dark:text-red-500 dark:border-red-500 dark:disabled:border-red-400
          dark:hover:bg-red-500 dark:hover:text-black"
          disabled={!isConnected() || !backupStats()}
          onClick={deleteBackupPrompt}
        >
          Delete backup
        </button>
      </div>
      <Prompt
        setShowPrompt={setShowPrompt}
        showPrompt={showPrompt}
        promptType={promptType()}
        text={promptText()}
        yes={promptAction()}
      />
    </div>
  );
}
