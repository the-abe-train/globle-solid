import { onMount } from "solid-js";

export default function () {
  onMount(() => {
    try {
      if ("nitroAds" in window) {
        // @ts-ignore
        window["nitroAds"].createAd("anchor", {
          refreshLimit: 20,
          refreshTime: 30,
          format: "anchor",
          anchor: "bottom",
          anchorPersistClose: false,
          mediaQuery: "(min-width: 0px)",
          report: {
            enabled: true,
            icon: true,
            wording: "Report Ad",
            position: "top-right",
          },
          anchorBgColor: "#ffffff00",
        });
        // @ts-ignore
        window["nitroAds"].createAd("left-siderail", {
          refreshLimit: 20,
          refreshTime: 60,
          format: "rail",
          rail: "left",
          railOffsetTop: 0,
          railOffsetBottom: 0,
          railCollisionWhitelist: ["*"],
          sizes: [["160", "600"]],
          report: {
            enabled: true,
            icon: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          mediaQuery: "(min-width: 1025px)",
        });
      }
    } catch (e) {
      console.error("Failed to load NitroPay Ads");
      console.error(e);
    }
  });
  return <></>;
}
