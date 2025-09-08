// Version utilities for monitoring app version on client side

export interface VersionInfo {
  version: string;
  buildTime: string;
  userAgent: string;
  timestamp: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: __APP_VERSION__,
    buildTime: __BUILD_TIME__,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

export function logVersionInfo(): void {
  const info = getVersionInfo();
  console.group('🚀 App Version Information');
  console.log(`Version: ${info.version}`);
  console.log(`Build Time: ${info.buildTime}`);
  console.log(`User Agent: ${info.userAgent}`);
  console.log(`Loaded At: ${info.timestamp}`);
  console.groupEnd();
}

export function getVersionDisplay(): string {
  return `v${__APP_VERSION__} (${new Date(__BUILD_TIME__).toLocaleDateString()})`;
}

// Check if service worker has updated and version has changed
export function checkForVersionUpdate(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker has been updated
        console.log('🔄 Service worker updated - new version available');
        resolve(true);
      });

      // Check if there's a waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          console.log('⏳ New version waiting to be activated');
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      resolve(false);
    }
  });
}

// Store version info in localStorage for comparison
export function storeVersionInfo(): void {
  const info = getVersionInfo();
  localStorage.setItem('app_version_info', JSON.stringify(info));
}

export function getPreviousVersionInfo(): VersionInfo | null {
  const stored = localStorage.getItem('app_version_info');
  return stored ? JSON.parse(stored) : null;
}

export function hasVersionChanged(): boolean {
  const current = getVersionInfo();
  const previous = getPreviousVersionInfo();
  return previous ? current.version !== previous.version : false;
}
