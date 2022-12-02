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
import dayjs from "dayjs";
import { unwrap } from "solid-js/store";
import { GuessStore } from "../../util/stores";

type Props = {
  guesses: GuessStore;
  pov: Accessor<Coords | null>;
  ans: Country;
};

export default function (props: Props) {
  const context = getContext();
  const { locale } = getContext().locale();
  const { labelsOn } = getContext().labelsOn();

  // Refs
  let globeRef: HTMLDivElement | undefined;
  const globe = Globe();

  // Signals
  const [isLoaded, setIsLoaded] = createSignal(false);
  const labelBg = context.theme().isDark ? "#F3E2F1" : "#FEFCE8";

  // function generateLabel

  const labels = createMemo(() => {
    if (!labelsOn) return [];
    return props.guesses.list.map((c) => {
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
    const { lat, lng } = coords;
    globe.pointOfView({ lat, lng }, 250);
  }

  // Effects
  onMount(() => {
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
        // .htmlElement(          (c) => <p
        // class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
        // style="background-color: ${labelBg};"
        // >${formatName(c as Country, locale)}</p>)

        .onPolygonClick((p, e, c) => turnGlobe(c))
        .polygonsData(unwrap(props.guesses.list))
        .polygonCapColor((c) => getColour(c as Country, props.ans))
        .polygonAltitude(0.025)
        .polygonSideColor(() => "black")
        .polygonLabel((c) =>
          !labelsOn
            ? `<p
        class="text-black py-1 px-2 text-center font-bold bg-yellow-50"
        style="background-color: ${labelBg};"
        >${formatName(c as Country, locale)}</p>`
            : ""
        )
        .polygonStrokeColor(() => "black")(globeRef);

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
      const newestGuess = props.guesses.list[props.guesses.length - 1];
      const newPoint = findCentre(newestGuess);
      turnGlobe(newPoint);
      // const ps = props.guesses.list.map((p) => createPolygon(p, props.ans));
      globe.polygonsData(unwrap(props.guesses.list)).htmlElementsData(labels());
    }
    const end = dayjs();
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
