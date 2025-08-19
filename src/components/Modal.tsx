import {
  Accessor,
  children,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  ParentProps,
  Setter,
  Show,
} from 'solid-js';

type Props = {
  trigger: Accessor<boolean>;
  setTrigger: Setter<boolean>;
};

export default function Outer(props: ParentProps<Props>) {
  const [innerTrigger, setInnerTrigger] = createSignal(false);
  createEffect(
    on(props.trigger, () => {
      if (props.trigger()) {
        setInnerTrigger(true);
      } else {
        setTimeout(() => {
          setInnerTrigger(false);
        }, 500);
      }
    })
  );

  return (
    <div>
      <Show when={innerTrigger()}>
        <Inner trigger={props.trigger} setTrigger={props.setTrigger}>
          {props.children}
        </Inner>
      </Show>
    </div>
  );
}

function Inner(props: ParentProps<Props>) {
  let innerRef!: HTMLDivElement;
  function triggerClose(e: Event) {
    if (innerRef && !innerRef.contains(e.target as Node)) {
      props.setTrigger(false);
    }
  }
  onMount(() => {
    document.body.addEventListener('click', triggerClose);
    // Has to run immediately after mount.
    setTimeout(() => {
      innerRef.classList.remove('opacity-0');
      innerRef.classList.add('opacity-100');
    }, 0);
  });
  createEffect(() => {
    if (!props.trigger()) {
      innerRef.classList.remove('opacity-100');
      innerRef.classList.add('opacity-0');
    }
  });
  onCleanup(() => {
    document.body.removeEventListener('click', triggerClose);
    props.setTrigger(false);
  });
  const c = children(() => props.children);
  return (
    <div
      class="m absolute inset-x-0 top-20 z-40 mx-auto w-fit space-y-2 rounded-md border-4 border-sky-300 bg-sky-100 px-6 py-6 opacity-0 drop-shadow-xl transition-opacity duration-500 ease-in-out dark:border-slate-700 dark:bg-slate-900"
      ref={innerRef!}
    >
      {c()}
    </div>
  );
}
