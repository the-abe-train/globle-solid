import { Accessor, Setter } from "solid-js";

type Props = {
  toggleProp: Accessor<boolean>;
  setToggle: Setter<boolean>;
  on: string;
  off: string;
};

export default function Toggle(props: Props) {
  function keyPressToggle(e: KeyboardEvent, setToggle: Setter<boolean>) {
    const keys = ["Enter", " ", "Return"];
    if (keys.includes(e.key)) {
      setToggle((prev) => !prev);
    }
  }

  const label = () => (props.toggleProp() ? props.on : props.off);

  return (
    <div
      class="flex items-center justify-between space-x-4 min-w-[8rem]"
      onKeyPress={(e) => keyPressToggle(e, props.setToggle)}
      onClick={() => props.setToggle((prev) => !prev)}
      tabIndex={0}
    >
      <span>{label()}</span>
      <div class="relative cursor-pointer ">
        <div class="block bg-gray-100 w-14 h-8 rounded-full border-2 border-gray-500"></div>
        <div
          data-cy={`toggle-${props.on}-${props.off}`}
          classList={{
            "translate-x-full": props.toggleProp(),
          }}
          class="absolute left-1 top-1 
              bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              w-6 h-6 rounded-full transition"
        />
      </div>
    </div>
  );
}
