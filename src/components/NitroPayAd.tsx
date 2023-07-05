import { onMount } from "solid-js";

export default function () {
  onMount(() => {
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
      });
    }
  });
  return <></>;
}
