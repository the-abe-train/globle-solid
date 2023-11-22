import Connect from "./Connect";
import Profile from "./Profile";

import tracks from "../../images/twl/Tracks.png";
import logo from "../../images/twl/Logo.png";
import { Show } from "solid-js";
import { getContext } from "../../Context";

export default function () {
  const context = getContext();
  const isConnected = () => context.user().email !== "";

  return (
    <div
      class="border border-black px-2 pb-3 pt-1 my-2 w-fit mx-auto rainbow
      dark:text-black"
      style={{ width: "fit-content" }}
    >
      <div class="flex self-center items-center justify-center mt-3 mb-5">
        <h2
          class="text-5xl text-center px-2 ml-2"
          style={{ "font-family": "Monomaniac One, sans-serif" }}
        >
          <p class="flex justify-center">
            {[..."Trainwreck"].map((letter, idx) => {
              return (
                <span class={idx % 2 === 0 ? "mb-1" : "mt-1"}>{letter}</span>
              );
            })}
          </p>
          <div
            class="flex items-center self-center 
           justify-between space-x-2"
          >
            <img
              src={tracks}
              alt="tracks"
              width={70}
              class="mt-5 max-w-[27.5%]"
            />
            <p class="text-center">Labs</p>
            <img
              src={tracks}
              alt="tracks"
              width={70}
              class="mt-5 max-w-[27.5%]"
            />
          </div>
        </h2>
        <img src={logo} alt="Logo" width={90} class="sm:mr-2" />
      </div>
      <Show when={isConnected()} fallback={<Connect />}>
        <Profile />
      </Show>
    </div>
  );
}
