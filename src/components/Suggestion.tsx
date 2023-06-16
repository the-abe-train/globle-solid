type Props = {
  countryName: string;
  submitGuess: (guess: string) => void;
};

export default function (props: Props) {
  return (
    <p>
      Did you mean{" "}
      <span
        class="underline cursor-pointer"
        tabIndex={0}
        onClick={() => props.submitGuess(props.countryName)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            props.submitGuess(props.countryName);
          }
        }}
      >
        {props.countryName}
      </span>
      ?
    </p>
  );
}
