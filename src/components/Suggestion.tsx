type Props = {
  message: string;
  countryName: string;
  onAccept: () => void;
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
    <>
      {parts()?.before ?? props.message}
      {parts() && (
        <>
          <span
            class="cursor-pointer underline"
            tabIndex={0}
            onClick={props.onAccept}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                props.onAccept();
              }
            }}
          >
            {props.countryName}
          </span>
          {parts()?.after}
        </>
      )}
    </>
  );
}
