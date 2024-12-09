import i18next from "i18next";
import { Accessor, For, Setter, createSignal } from "solid-js";
import { translate } from "../i18n";

type Option = { name: string; value: any };

type Props = {
  name: string;
  choice: Accessor<string>;
  choose: Setter<string>;
  list: Option[];
  i18n: string;
};

export default function (props: Props) {
  console.log("Choice", props.choice());
  // const [label, setLabel] = createSignal(i18next.t(props.i18n))
  const label = () => {
    if (props.choice()) {
      i18next.changeLanguage(props.choice());
    }
    return props.i18n === "Settings7" ? (
      <p class="flex">
        {i18next.t("Settings7")}{" "}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          class="ml-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.9 22L16.45 10H18.55L23.1 22H21L19.925 18.95H15.075L14 22H11.9ZM4 19L2.6 17.6L7.65 12.55C7.06667 11.9667 6.53733 11.3 6.062 10.55C5.58667 9.8 5.14933 8.95 4.75 8H6.85C7.18333 8.65 7.51667 9.21667 7.85 9.7C8.18333 10.1833 8.58333 10.6667 9.05 11.15C9.6 10.6 10.171 9.829 10.763 8.837C11.355 7.845 11.8007 6.89933 12.1 6H1V4H8V2H10V4H17V6H14.1C13.75 7.2 13.225 8.43333 12.525 9.7C11.825 10.9667 11.1333 11.9333 10.45 12.6L12.85 15.05L12.1 17.1L9.05 13.975L4 19ZM15.7 17.2H19.3L17.5 12.1L15.7 17.2Z"
            fill="black"
          />
        </svg>
      </p>
    ) : (
      <p data-i18n="Settings12">{translate("Settings12", "Colours")}</p>
    );
  };
  return (
    <div class="flex items-center justify-between space-x-4 min-w-[8rem]">
      <label for={props.name}>{label()}</label>
      <select
        name={props.name}
        class="bg-blue-700 dark:bg-purple-800 hover:bg-blue-900
         dark:hover:bg-purple-900 disabled:bg-blue-900  text-white 
        px-4 py-2.5 text-center inline-flex items-center min-w-[8rem]
        justify-between rounded-lg text-sm font-medium
        "
        value={props.choice()}
        onChange={(e) => props.choose(e.currentTarget.value)}
      >
        <For each={props.list}>
          {(item) => (
            <option
              class="py-2 px-4 text-sm text-gray-700 text-left
            hover:bg-gray-100 dark:hover:bg-gray-600 
            dark:hover:text-white bg-white"
              value={item.value}
            >
              {item.name}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}
