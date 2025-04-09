// import JoinClubBtn from "./JoinClubBtn.tsx";

import { onMount } from "solid-js";
import { getContext } from "../../Context";
import JoinClubBtn from "./JoinClubBtn";

// type Props = {
//   email: () => string;
// };

export default function () {
  const context = getContext();
  const email = context.user().email;

  function logout() {
    context.setUser({ email: "" });
  }

  // Sign up for newsletter
  onMount(async () => {
    if (localStorage.getItem("twlNewsletter") === "true") {
      console.log("Subscribing to newsletter");
      const res = await fetch(`/subscribe`, {
        method: "POST",
        body: email,
      });
      const text = await res.text();
      console.log("Newsletter response:", text);
    }
  });

  return (
    <div>
      <p class="text-center">
        <span data-i18n="TWL5">Account:</span> <span>{email}</span>
      </p>
      <div class="my-4 flex mx-auto space-x-6 w-full justify-center">
        <JoinClubBtn />
        <button
          class="border border-red-800 text-red-800
        px-3 py-2 shadow focus:shadow-none hover:shadow-none rounded
        hover:bg-white transition-colors duration-300"
          onClick={logout}
          data-i18n="TWL8"
        >
          Disconnect
        </button>
      </div>
      <p class="text-center">
        <span data-i18n="TWL9">Go to your </span>{" "}
        <a
          href="https://trainwrecklabs.com/dashboard"
          class="underline"
          target="_blank"
        >
          Trainwreck Labs dashboard
        </a>
      </p>
    </div>
  );
}
