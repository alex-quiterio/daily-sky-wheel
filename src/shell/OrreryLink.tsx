// The small globe at the foot of the page: the way into the hidden Solar System tab.
import { Icon } from '#components/Icon.tsx';
import { toggleSecret } from '#shell/controls.ts';

export function OrreryLink({ view }: { view: string }) {
  if (view === 'solar') return null;
  return (
    <div class="orrery-link">
      <button
        type="button"
        class="iconbtn"
        title="The Solar System"
        aria-label="Open the Solar System"
        onClick={() => {
          toggleSecret();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Icon name="globe" size={16} />
      </button>
    </div>
  );
}
