import Connect from './Connect';
import Profile from './Profile';

import tracks from '../../images/twl/Tracks.png';
import logo from '../../images/twl/Logo.png';
import { Show } from 'solid-js';
import { getContext } from '../../Context';

export default function () {
  const context = getContext();
  const isConnected = () => context.user().email !== '';

  return (
    <div
      class="rainbow mx-auto my-2 w-fit border border-black px-2 pt-1 pb-3 dark:text-black"
      style={{ width: 'fit-content' }}
    >
      <div class="mt-3 mb-5 flex items-center justify-center self-center">
        <h2
          class="ml-2 px-2 text-center text-5xl"
          style={{ 'font-family': 'Monomaniac One, sans-serif' }}
        >
          <p class="flex justify-center">
            {[...'Trainwreck'].map((letter, idx) => {
              return <span class={idx % 2 === 0 ? 'mb-1' : 'mt-1'}>{letter}</span>;
            })}
          </p>
          <div class="flex items-center justify-between space-x-2 self-center">
            <img src={tracks} alt="tracks" width={70} class="mt-5 max-w-[27.5%]" />
            <p class="text-center">Labs</p>
            <img src={tracks} alt="tracks" width={70} class="mt-5 max-w-[27.5%]" />
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
