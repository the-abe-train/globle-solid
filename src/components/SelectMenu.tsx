import { Accessor, For, Setter } from "solid-js";

type Props = {
  name: string;
  choice: Accessor<string>;
  choose: Setter<string>;
  list: string[];
};

export default function (props: Props) {
  return (
    <div class="flex items-center justify-between space-x-4 min-w-[8rem]">
      <label for="location">{props.name}</label>
      <select
        id="location"
        name="location"
        class="mt-1 block w-1/2 rounded-md border-gray-300 py-2 pl-3 pr-10 
        text-base focus:border-indigo-500 focus:outline-none 
        focus:ring-indigo-500 sm:text-sm text-black"
        value={props.choice()}
        onChange={(e) => props.choose(e.currentTarget.value)}
      >
        <For each={props.list}>
          {(item) => <option value={item}>{item}</option>}
        </For>
      </select>
    </div>
  );
}
