import { Component, createSignal, onMount } from 'solid-js';
import {
  getVersionInfo,
  getVersionDisplay,
  checkForVersionUpdate,
  storeVersionInfo,
  hasVersionChanged,
} from '../util/version';

interface VersionDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export const VersionDisplay: Component<VersionDisplayProps> = (props) => {
  const [versionInfo, setVersionInfo] = createSignal(getVersionInfo());
  const [updateAvailable, setUpdateAvailable] = createSignal(false);
  const [versionChanged, setVersionChanged] = createSignal(false);

  onMount(() => {
    // Check if version has changed since last visit
    setVersionChanged(hasVersionChanged());

    // Store current version info
    storeVersionInfo();

    // Check for service worker updates
    checkForVersionUpdate().then(setUpdateAvailable);
  });

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div class={`version-display ${props.className || ''}`}>
      {props.showDetails ? (
        <div class="space-y-1 text-xs text-gray-500">
          <div>Version: {versionInfo().version}</div>
          <div>Built: {new Date(versionInfo().buildTime).toLocaleString()}</div>
          {versionChanged() && (
            <div class="font-semibold text-green-600">✨ Updated to new version!</div>
          )}
          {updateAvailable() && (
            <div class="text-blue-600">
              <button onClick={refreshPage} class="underline hover:no-underline">
                🔄 New version available - Click to refresh
              </button>
            </div>
          )}
        </div>
      ) : (
        <span class="text-xs text-gray-400">
          {getVersionDisplay()}
          {updateAvailable() && (
            <span class="ml-2 cursor-pointer text-blue-600" onClick={refreshPage}>
              🔄
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default VersionDisplay;
