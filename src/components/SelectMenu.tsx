import { Accessor, For, Setter } from "solid-js";

type Option = { name: string; value: any };

type Props = {
  name: string;
  choice: Accessor<string>;
  choose: Setter<string>;
  list: Option[];
  i18n: string;
};

export default function (props: Props) {
  return (
    <div class="flex items-center justify-between space-x-4 min-w-[8rem]">
      <label for="location" data-i18n={props.i18n}>
        {props.name}
      </label>
      <select
        id="location"
        name="location"
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
