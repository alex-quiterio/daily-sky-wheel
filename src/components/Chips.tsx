// Filter chips: one is pressed
export function Chips(props: {
  id?: string;
  options: [value: string, label: string][];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div class="chips" id={props.id} role="group" aria-label="Show">
      {props.options.map(([value, label]) => (
        <button type="button" data-cat={value} aria-pressed={value === props.value} onClick={() => props.onPick(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
