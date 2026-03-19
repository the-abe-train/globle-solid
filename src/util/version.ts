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

// Fetch the latest version from the server and compare with the running version
export async function checkForUpdate(): Promise<{
  available: boolean;
  latestVersion?: string;
  latestBuildTime?: string;
}> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (!response.ok) return { available: false };
    const data = (await response.json()) as { version: string; buildTime: string };
    const current = getVersionInfo();
    const available = data.buildTime !== current.buildTime;
    return {
      available,
      latestVersion: data.version,
      latestBuildTime: data.buildTime,
    };
  } catch {
    return { available: false };
  }
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
