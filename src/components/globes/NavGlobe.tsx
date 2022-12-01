import Globe from "globe.gl";
import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import dayImg from "../../images/earth-day-min.webp";
import nightImg from "../../images/earth-night-min.webp";
import UAParser from "ua-parser-js";
import { getContext } from "../../Context";

export default function () {
  const context = getContext();

  let globeRef: HTMLDivElement | undefined;
  const globe = Globe({ animateIn: false });
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";
  const navigate = useNavigate();
  const globeImg = () => (context.theme().isDark ? nightImg : dayImg);

  onMount(() => {
    if (globeRef) {
      globe
        .globeImageUrl(globeImg())
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

  // createEffect(() => {
  //   globe.globeImageUrl(globeImg());
  // });

  onCleanup(() => globe._destructor());

  return (
    <div
      class="w-fit mx-auto cursor-pointer text-center"
      onClick={() => navigate("/game")}
    >
      <div ref={globeRef!} class="w-fit mx-auto my-2" />
      <b>{isMobile ? "Tap" : "Click"} the globe to play!</b>
    </div>
  );
}
