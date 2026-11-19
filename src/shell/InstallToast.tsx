// The install offer at the foot of the page: Chrome's install prompt, or in Safari the steps to add the page as
// an app (Safari has no prompt). Closing it keeps it closed for 30 days.
import { useStore } from '#lib/store.ts';
import { SAFARI_HINT, controls, dismissInstall, install } from '#shell/controls.ts';

export function InstallToast() {
  const kind = useStore(controls, (s) => s.installToast);
  return (
    <div class="install-toast-wrap" aria-live="polite">
      {kind && (
        <div class="install-toast" role="status" data-install={kind}>
          <p>{kind === 'prompt' ? 'Install Sky Wheel to use it as an app, offline too.' : SAFARI_HINT}</p>
          <div class="install-toast-actions">
            {kind === 'prompt' && (
              <button type="button" class="primary" onClick={install}>
                Install
              </button>
            )}
            <button type="button" onClick={dismissInstall}>
              {kind === 'prompt' ? 'Not now' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
