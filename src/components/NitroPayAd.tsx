import { onMount } from "solid-js";
import { getContext } from "../Context";

export default function () {
  const context = getContext();
  const isConnected = () => context.token().google !== "";

  onMount(async () => {
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
    if (!isConnected()) return console.log("Not connected to TWL account.");
    // @ts-ignore
    if (!window["nitroSponsor"])
      return console.log("NitroPay Sponsor not loaded.");
    const googleToken = context.token().google;
    const endpoint = "/sponsor" + "?token=" + googleToken;
    const tokenResp = await fetch(endpoint);
    const token = await tokenResp.text();
    // @ts-ignore
    window["nitroSponsor"].init(
      {
        token,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        product: 58,
      },
      function (res: any) {
        // success callback
        console.log("NitroPay Sponsor success");

        console.log(res);
      }
    );
  });
  return <></>;
}
