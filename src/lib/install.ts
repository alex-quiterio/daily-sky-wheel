// Safari never offers to install a page, but it can still add one as an app: Add to Home Screen on iPhone and
// iPad, Add to Dock on a Mac (Safari 17 and later). These tell the Safari reader where to find it.

const OTHER_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|Chrome|Chromium|Edg|OPR|Firefox/;

// iPhone, iPod or iPad. iPadOS reports itself as a Mac, so a Mac with touch is an iPad.
function isIos(ua: string, platform: string, maxTouchPoints: number) {
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

// The words to show when the Install button is pressed in Safari, or '' when this is not Safari (or a Safari
// that cannot add pages as apps).
export function safariInstallHint(ua: string, platform = '', maxTouchPoints = 0): string {
  if (OTHER_BROWSERS.test(ua)) return '';
  if (isIos(ua, platform, maxTouchPoints)) {
    return 'To install, tap Share (under ··· on newer iPhones), then Add to Home Screen.';
  }
  if (!/Macintosh/.test(ua)) return '';
  const version = /Version\/(\d+)[\d.]* .*Safari\//.exec(ua);
  if (!version || Number(version[1]) < 17) return '';
  return 'To install, choose File, then Add to Dock.';
}

// A closed install toast stays closed for 30 days
const DISMISS_KEY = 'skywheel.install.dismissed';
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export function installDismissed(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? NaN);
    return Number.isFinite(at) && now - at < DISMISS_MS;
  } catch (e) {
    return false;
  }
}

export function rememberInstallDismissed(now = Date.now()) {
  try {
    localStorage.setItem(DISMISS_KEY, String(now));
  } catch (e) {
    /* storage unavailable: the toast may come back, which is fine */
  }
}
