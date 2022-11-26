import { Accessor, createSignal, onMount, Setter, Show } from "solid-js";
import Modal from "./Modal";

type Choice = {
  promptType: "Choice";
  yes: () => void;
  no?: () => void;
};

type Message = {
  promptType: "Message";
};

type Props = {
  setShowPrompt: Setter<boolean>;
  showPrompt: Accessor<boolean>;
  text: string;
} & (Choice | Message);

export function Prompt(props: Props) {
  function runYes() {
    if (props.promptType === "Choice") {
      props.yes();
      setTimeout(() => {
        props.setShowPrompt(false);
      }, 2000);
    } else {
      return console.log("An error occurred.");
    }
  }

  function runNo() {
    if (props.promptType === "Choice" && props.no) {
      props.no();
    } else {
      return console.log("An error occurred.");
    }
    props.setShowPrompt(false);
  }

  onMount(() => {
    if (props.promptType === "Message") {
      setTimeout(() => props.setShowPrompt(false), 2000);
    }
  });

  return (
    <>
      <p class="text-gray-900 dark:text-gray-200 max-w-xs">{props.text}</p>
      <Show when={props.promptType === "Choice"}>
        <div class="py-4 flex justify-center space-x-8">
          <button
            class="bg-red-700 text-white rounded-md px-6 py-2 block 
            text-base font-medium hover:bg-red-900 disabled:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-300"
            onClick={runYes}
            data-cy="yes-btn"
          >
            Yes
          </button>
          <button
            class="bg-blue-700 text-white rounded-md px-6 py-2 block 
            text-base font-medium hover:bg-blue-900 disabled:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={runNo}
            data-cy="no-btn"
          >
            No
          </button>
        </div>
      </Show>
    </>
  );
}

export default function (props: Props) {
  return (
    <Modal setTrigger={props.setShowPrompt} trigger={props.showPrompt}>
      <Prompt {...props} />
    </Modal>
  );
}
