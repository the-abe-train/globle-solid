import Globe, { GlobeInstance } from 'globe.gl';
import { onCleanup, onMount } from 'solid-js';
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

  onMount(() => {
    translatePage();
    if (globeRef) {
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
    }
  });

  onCleanup(() => {
    if (globeInstance?._destructor) {
      globeInstance._destructor();
    }
  });

  return (
    <div class="mx-auto w-fit cursor-pointer py-4 text-center" onClick={() => navigate('/game')}>
      <div ref={globeRef!} class="mx-auto my-2 w-fit" />
      <b data-i18n="Aux1">{isMobile ? 'Tap' : 'Click'} the globe to play!</b>
    </div>
  );
}
