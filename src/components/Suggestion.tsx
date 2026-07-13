type Props = {
  message: string;
  countryName: string;
  submitGuess: (guess: string) => void;
};

export default function (props: Props) {
  // The message is the already-translated prompt (e.g. "Did you mean France?"
  // or "Vouliez-vous dire France?"). Split it around the country name so the
  // name renders as a clickable span while the surrounding text stays
  // translated. If the name isn't found, fall back to the whole message.
  const parts = () => {
    const name = props.countryName;
    const msg = props.message;
    const idx = name ? msg.indexOf(name) : -1;
    if (idx === -1) return null;
    return { before: msg.slice(0, idx), after: msg.slice(idx + name.length) };
  };

  return (
    <p>
      {parts()?.before ?? props.message}
      {parts() && (
        <>
          <span
            class="cursor-pointer underline"
            tabIndex={0}
            onClick={() => props.submitGuess(props.countryName)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                props.submitGuess(props.countryName);
              }
            }}
          >
            {props.countryName}
          </span>
          {parts()?.after}
        </>
      )}
    </p>
  );
}
