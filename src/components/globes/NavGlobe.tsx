import Globe, { GlobeInstance } from 'globe.gl';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import UAParser from 'ua-parser-js';
// import { getContext } from "../../Context";
import { globeMinImg } from '../../util/globe';
import { translatePage } from '../../i18n';

export default function () {
  // const context = getContext();

  let globeRef: HTMLDivElement | undefined;
  let globeInstance: GlobeInstance | null = null;
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === 'mobile';
  const navigate = useNavigate();
  const [webglError, setWebglError] = createSignal(false);

  onMount(() => {
    translatePage();
    if (globeRef) {
      try {
        globeInstance = new Globe(globeRef, { animateIn: true });

        globeInstance
          .globeImageUrl(globeMinImg())
          .backgroundColor('#00000000')
          .enablePointerInteraction(false)
          .showAtmosphere(false)
          .pauseAnimation()
          .width(100)
          .height(100);

        const controls = globeInstance.controls();
        globeInstance.pointOfView({ lat: 0, lng: 0, altitude: 1.5 });
        controls.autoRotate = true;
        setTimeout(() => globeInstance?.resumeAnimation(), 1000);
      } catch (error) {
        console.error('Failed to create Globe:', error);
        setWebglError(true);
      }
    }
  });

  onCleanup(() => {
    if (globeInstance?._destructor) {
      globeInstance._destructor();
    }
  });

  return (
    <div
      class="mx-auto w-fit cursor-pointer py-4 text-center"
      onClick={() => !webglError() && navigate('/game')}
    >
      <Show
        when={webglError()}
        fallback={
          <>
            <div ref={globeRef!} class="mx-auto my-2 w-fit" />
            <b data-i18n="Aux1">{isMobile ? 'Tap' : 'Click'} the globe to play!</b>
          </>
        }
      >
        <div class="mx-auto my-2 max-w-md rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:border-red-600 dark:bg-red-900">
          <h3 class="mb-2 font-bold text-red-700 dark:text-red-200">⚠️ WebGL Error</h3>
          <p class="mb-3 text-sm text-red-600 dark:text-red-300">
            Unable to load the 3D globe. This is usually caused by too many browser tabs using 3D
            graphics.
          </p>
          <div class="text-left text-sm text-red-600 dark:text-red-300">
            <p class="mb-1 font-semibold">To fix this:</p>
            <ol class="list-inside list-decimal space-y-1">
              <li>Close other browser tabs (especially maps or games)</li>
              <li>Restart your browser completely</li>
              <li>Reload this page</li>
            </ol>
          </div>
          <button
            class="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            onClick={() => navigate('/game')}
          >
            Try playing anyway →
          </button>
        </div>
      </Show>
    </div>
  );
}
