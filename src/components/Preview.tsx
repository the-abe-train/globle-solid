import i18next from "i18next";
import { createSignal, For, onCleanup } from "solid-js";
import UAParser from "ua-parser-js";
import { getContext } from "../Context";
import outlines from "../data/country_outlines.json";
import { getColour } from "../util/colour";
import { getCountry } from "../util/data";

export default function () {
  const { isDark } = getContext().theme();
  const { colours } = getContext().colours();
  const [count, setCount] = createSignal(1);
  const parser = new UAParser();
  const isMobile = parser.getDevice().type === "mobile";
  const countrySize = isMobile ? 125 : 150;

  const timer = setInterval(() => {
    if (count() < 5) setCount(count() + 1);
  }, 1000);
  onCleanup(() => clearInterval(timer));

  const japan = getCountry("Japan");
  const colouredOutlines = () =>
    outlines.map((outline) => {
      const country = getCountry(outline.name);
      const colour = getColour(country, japan, isDark, colours);
      return { ...outline, colour };
    });

  return (
    <div class="block mx-4">
      <div
        class="flex flex-col md:flex-row justify-start items-center space-x-3"
        style={{
          "min-height": `${isMobile ? countrySize * 3 : countrySize}px`,
        }}
      >
        <For each={colouredOutlines()}>
          {(outline, idx) => {
            return (
              <figure
                class="flex space-x-6 md:flex-col md:justify-left 
              md:space-x-0 bg-transparent
              transition-opacity opacity-0 duration-500"
                classList={{ "opacity-100": count() >= idx() + 2 }}
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  viewBox="0 0 800 600"
                  width={countrySize}
                  height={countrySize * 0.75}
                >
                  <g id={outline.name}>
                    <path
                      fill={outline.colour}
                      d={outline.path}
                      stroke="black"
                      stroke-width={5}
                    />
                  </g>
                </svg>
                <figcaption class="text-left sm:text-center font-bold my-auto">
                  {i18next.t(outline.name)}
                </figcaption>
              </figure>
            );
          }}
        </For>
      </div>
    </div>
  );
}
