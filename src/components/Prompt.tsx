import { Accessor, onMount, Setter, Show } from 'solid-js';
import { translate, translatePage } from '../i18n';
import Modal from './Modal';

type Choice = {
  promptType: 'Choice';
  yes: () => void;
};

type Message = {
  promptType: 'Message';
};

type Props = {
  setShowPrompt: Setter<boolean>;
  showPrompt: Accessor<boolean>;
  text: string;
} & (Choice | Message);

export function Prompt(props: Props) {
  function runYes() {
    if (props.promptType === 'Choice') {
      props.yes();
      setTimeout(() => {
        props.setShowPrompt(false);
      }, 2000);
    } else {
      return console.log('An error occurred.');
    }
  }

  function runNo() {
    props.setShowPrompt(false);
  }

  onMount(() => {
    if (props.promptType === 'Message') {
      setTimeout(() => props.setShowPrompt(false), 2000);
    }
    translatePage();
  });

  return (
    <>
      <p class="max-w-xs text-gray-900 dark:text-gray-200">{props.text}</p>
      <Show when={props.promptType === 'Choice'}>
        <div class="flex justify-center space-x-8 py-4">
          <button
            class="block rounded-md bg-red-700 px-6 py-2 text-base font-medium text-white hover:bg-red-900 focus:ring-2 focus:ring-red-300 focus:outline-none disabled:bg-red-900"
            onClick={runYes}
            data-cy="yes-btn"
            data-i18n="Yes"
          >
            {translate('Practice4', 'Yes')}
          </button>
          <button
            class="block rounded-md bg-blue-700 px-6 py-2 text-base font-medium text-white hover:bg-blue-900 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:bg-blue-900"
            onClick={runNo}
            data-cy="no-btn"
            data-i18n="No"
          >
            {translate('Practice5', 'No')}
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
