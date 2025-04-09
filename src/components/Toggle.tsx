import { Accessor, Setter } from "solid-js";
import { translate } from "../i18n";

type Props = {
  toggleProp: Accessor<boolean>;
  setToggle: Setter<boolean>;
  values: {
    on: { default: string; i18n: keyof i18nMessages };
    off: { default: string; i18n: keyof i18nMessages };
  };
  gap?: boolean;
};

export default function Toggle(props: Props) {
  function keyPressToggle(e: KeyboardEvent, setToggle: Setter<boolean>) {
    const keys = ["Enter", " ", "Return"];
    if (keys.includes(e.key)) {
      setToggle((prev) => !prev);
    }
  }

  const values = () =>
    props.toggleProp() ? props.values.on : props.values.off;
  const defaultOn = props.values.on.default;
  const defaultOff = props.values.off.default;

  return (
    <div
      class="flex items-center justify-between space-x-2 sm:min-w-[8rem]"
      onKeyPress={(e) => keyPressToggle(e, props.setToggle)}
      onClick={() => props.setToggle((prev) => !prev)}
      tabIndex={0}
    >
      <p>
        {props.gap && <span class="opacity-0">|</span>}
        <span data-i18n={values().i18n} data-testid="toggle-text">
          {translate(values().i18n, values().default)}
        </span>
      </p>
      <div class="relative cursor-pointer">
        <div
          class="block bg-gray-100 w-14 h-8 rounded-full border-2 
        border-gray-500"
        ></div>
        <div
          data-cy={`toggle-${defaultOn}-${defaultOff}`}
          classList={{
            "translate-x-full": props.toggleProp(),
          }}
          class="absolute left-1 top-1 
              bg-blue-700 hover:bg-blue-800 dark:bg-purple-800 
              dark:hover:bg-purple-900 dark:focus:ring-purple-900
              w-6 h-6 rounded-full transition"
        />
      </div>
    </div>
  );
}
