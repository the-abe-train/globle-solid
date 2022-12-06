import Globe from "globe.gl";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { UAParser } from "ua-parser-js";
import { globeImg } from "../../util/globe";
import { getContext } from "../../Context";
import { findCentre } from "../../util/geometry";
import { getColour } from "../../util/colour";
import { formatKm, formatName } from "../../util/text";
import { unwrap } from "solid-js/store";
import { GuessStore } from "../../util/stores";
import { translatePage } from "../../i18n";

type Props = {
  guesses: GuessStore;
  pov: Accessor<Coords | null>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();
  const { locale } = getContext().locale();
  const { labelsOn } = getContext().labelsOn();
  const { isDark } = getContext().theme();
  const { colours } = getContext().colours();

  // Refs
  let globeRef: HTMLDivElement | undefined;
  const globe = Globe();

  // Signals
  const [isLoaded, setIsLoaded] = createSignal(false);
  const labelBg = isDark ? "#F3E2F1" : "#FEFCE8";

  // function generateLabel

  const labels = createMemo(() => {
    if (!labelsOn) return [];
    return props.guesses.countries.map((c) => {
      const { lat, lng } = findCentre(c);
      return {
        lat,
        lng,
        element: (
          <p
            class="text-black py-1 px-2 text-center bg-yellow-50 text-sm"
            style={{ "background-color": labelBg }}
          >
            {formatName(c as Country, locale)} <br />
            {c.proximity
              ? `${formatKm(c.proximity)} ${context.distanceUnit().unit}`
              : ""}
          </p>
        ),
      };
    });
  });

  // Context params
  const parser = new UAParser();
  const device = parser.getDevice();
  const size = device.type === "mobile" ? 320 : 600; // px on one side

  // Turn globe on click
  function turnGlobe(coords: {
    lat?: number;
    lng?: number;
    altitude?: number;
  }) {
    const controls = globe.controls() as any;
    controls.autoRotate = false;
    // const { lat, lng } = coords;
    const currentAlt = globe.pointOfView().altitude;
    coords["altitude"] =
      "altitude" in coords ? coords["altitude"] : Math.max(currentAlt, 0.05);
    globe.pointOfView(coords, 250);
  }

  function overrideZoom() {
    const controls = globe.controls() as any;
    if (controls != null) controls.zoomSpeed = 1;
  }

  // Effects
  onMount(() => {
    translatePage();
    if (globeRef) {
      globe
        .globeImageUrl(globeImg())
        .width(size)
        .height(size)
        .backgroundColor("#00000000")
        .atmosphereColor(
          context.theme().isDark ? "rgba(63, 201, 255)" : "lightskyblue"
        )
        .onGlobeReady(() => setIsLoaded(true))
        .onGlobeClick(turnGlobe)

        .htmlElementsData(labels())
        .htmlElement("element")

        .onPolygonClick((p, e, c) => turnGlobe(c))
        .polygonsData(unwrap(props.guesses.places))
        .polygonCapColor((c) =>
          getColour(c as Country, props.ans, isDark, colours)
        )
        .polygonAltitude(0.015)
        .polygonSideColor(() => "black")
        .polygonLabel((c) =>
          !labelsOn
            ? `<p
        class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
        style="background-color: ${labelBg};"
        >${formatName(c as Country, locale)}</p>`
            : ""
        )
        .polygonStrokeColor(() => "black")

        .onZoom(overrideZoom)(globeRef);

      // Initial settings
      const controls = globe.controls() as any;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1;
      globe.pointOfView({ lat: 0, lng: 0, altitude: 1.5 });
    }
  });

  onCleanup(() => globe._destructor());

  // When there's a new guess, turn globe to that point
  createEffect(() => {
    if (props.guesses.length > 0) {
      const newestGuess = props.guesses.countries[props.guesses.length - 1];
      const newPoint = findCentre(newestGuess);
      turnGlobe(newPoint);
      globe
        .polygonsData(unwrap(props.guesses.places))
        .htmlElementsData(labels());
    }
  });

  // When player clicks on a country name, turn to it
  createEffect(() => {
    const newPov = props.pov();
    if (newPov) turnGlobe(newPov);
  });

  // Clicking the zoom buttons on mobile
  function zoom(z: number) {
    const controls = globe.controls() as any;
    controls.autoRotate = false;
    const coords = globe.pointOfView();
    coords["altitude"] = Math.max(coords.altitude + z, 0.05);
    globe.pointOfView(coords, 250);
  }

  return (
    <div>
      <Show when={!isLoaded()}>
        <p data-i18n="Loading">Loading...</p>
      </Show>
      <div
        ref={globeRef!}
        class="w-min mx-auto 
        select-none decoration-transparent cursor-grab"
        style={{
          "clip-path": `circle(${size / 2}px at ${size / 2}px ${size / 2}px)`,
        }}
      ></div>
      <div class="w-full flex justify-between text-md sm:hidden">
        <button
          class=" px-4 border rounded-md select-none dark:bg-[#582679] 
            bg-[#F3BC63] dark:border-[#350a46] border-[#FF8E57]"
          onTouchStart={() => zoom(0.2)}
        >
          -
        </button>
        <button
          class=" px-4 border rounded-md select-none dark:bg-[#582679] 
            bg-[#F3BC63] dark:border-[#350a46] border-[#FF8E57]"
          onTouchStart={() => zoom(-0.2)}
        >
          +
        </button>
      </div>
    </div>
  );
}
