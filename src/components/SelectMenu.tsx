import { Accessor, For, Setter } from "solid-js";

type Props = {
  name: string;
  choice: Accessor<string>;
  choose: Setter<string>;
  list: Record<string, any>;
};

export default function (props: Props) {
  console.log("list", props.list);
  const list = Object.keys(props.list).map((name) => {
    let value = props.list[name];
    if (typeof value === "function") value = name;
    return { name, value };
  });
  console.log({ list });
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
        <For each={list}>
          {(item) => <option value={item.value}>{item.name}</option>}
        </For>
      </select>
    </div>
  );
}
