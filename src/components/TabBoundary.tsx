// What stands in for a tab while its code loads, or when it fails: to load, to work out its model, or to draw.
// One boundary per tab (keyed by the tab's name), so a broken tab leaves the page and the other tabs working.
import { Component } from 'preact';
import type { ComponentChildren } from 'preact';
import { Card } from '#components/Card.tsx';

// the panel every tab draws into, so the tab row's aria-controls still points somewhere
function Panel({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div class="main tab-state" id={`view${label}`} role="tabpanel" aria-labelledby={`tab${label}`}>
      {children}
    </div>
  );
}

export function TabLoading({ label }: { label: string }) {
  return (
    <Panel label={label}>
      <p class="empty" role="status">
        Loading the {label} tab…
      </p>
    </Panel>
  );
}

export function TabFailed({ label, error, retry }: { label: string; error: unknown; retry: () => void }) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return (
    <Panel label={label}>
      <Card title={`The ${label} tab could not be shown`} class="tab-error">
        <p class="note" role="alert">
          {offline
            ? 'You seem to be offline, and this tab has not been saved for offline use yet.'
            : 'Something went wrong in this tab. The other tabs still work.'}
        </p>
        <pre class="tab-error-text">{error instanceof Error ? error.message : String(error)}</pre>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </Card>
    </Panel>
  );
}

interface Props {
  label: string;
  error?: unknown; // a failure from outside the drawing: loading the tab, or building its model
  retry: () => void;
  children: ComponentChildren;
}

export class TabBoundary extends Component<Props, { caught: unknown }> {
  state = { caught: null as unknown };

  static getDerivedStateFromError(caught: unknown) {
    return { caught: caught ?? new Error('unknown error') };
  }

  componentDidCatch(caught: unknown) {
    console.error(`The ${this.props.label} tab failed to draw:`, caught);
  }

  render() {
    const { label, error, retry, children } = this.props;
    const failure = this.state.caught ?? error;
    if (failure == null) return children;
    return (
      <TabFailed
        label={label}
        error={failure}
        retry={() => {
          this.setState({ caught: null });
          retry();
        }}
      />
    );
  }
}
