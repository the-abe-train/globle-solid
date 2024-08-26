import { createEffect, createResource } from "solid-js";
import { getContext } from "../../Context";
import i18next from "i18next";

type ResourceProps = {
  token: string;
  clubMember: boolean;
};

export default function () {
  const context = getContext();

  const [nitropay] = createResource<ResourceProps>(async () => {
    const url = new URL(window.location.href);
    url.pathname = "/sponsor";
    url.searchParams.set("email", context.user().email);
    const res = await fetch(url);
    const json = await res.json();
    return json as ResourceProps;
  });

  const nitropayToken = () => nitropay()?.token;
  const clubMember = () => nitropay()?.clubMember;

  return (
    <form
      action="https://sponsor.nitrocnct.com/subscribe"
      target="_blank"
      method="get"
    >
      <input type="text" value={nitropayToken()} readOnly hidden name="token" />
      <button
        class="rounded p-2  
    border border-black text-black cursor-pointer"
        classList={{ gold: !clubMember(), "gold-flat": clubMember() }}
      >
        {clubMember()
          ? i18next.t("TWL7", "Club member")
          : i18next.t("TWL6", "Remove ads")}
      </button>
    </form>
  );
}
