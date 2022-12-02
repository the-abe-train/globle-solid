import Globe from "globe.gl";
import { onCleanup, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

import UAParser from "ua-parser-js";
import { getContext } from "../../Context";
import { globeMinImg } from "../../util/globe";
import { translatePage } from "../../i18n";

export default function () {
  const context = getContext();

  let globeRef: HTMLDivElement | undefined;
  const globe = Globe({ animateIn: false });
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";
  const navigate = useNavigate();

  onMount(() => {
    translatePage();
    if (globeRef) {
      globe
        .globeImageUrl(globeMinImg())
        .backgroundColor("#00000000")
        .enablePointerInteraction(false)
        .showAtmosphere(false)
        .pauseAnimation()
        .width(100)
        .height(100)(globeRef);

      const controls = globe.controls() as any;
      globe.pointOfView({ lat: 0, lng: 0, altitude: 1.5 });
      controls.autoRotate = true;
      setTimeout(() => globe.resumeAnimation(), 1000);
    }
  });

  onCleanup(() => globe._destructor());

  return (
    <div
      class="w-fit mx-auto cursor-pointer text-center"
      onClick={() => navigate("/game")}
    >
      <div ref={globeRef!} class="w-fit mx-auto my-2" />
      <b data-i18n="Aux1">{isMobile ? "Tap" : "Click"} the globe to play!</b>
    </div>
  );
}
