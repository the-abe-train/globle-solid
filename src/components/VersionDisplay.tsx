import { Component, createSignal, onMount } from 'solid-js';
import {
  getVersionDisplay,
  checkForUpdate,
  storeVersionInfo,
  hasVersionChanged,
} from '../util/version';

interface VersionDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export const VersionDisplay: Component<VersionDisplayProps> = (props) => {
  const [updateAvailable, setUpdateAvailable] = createSignal(false);
  const [checking, setChecking] = createSignal(false);
  const [updateTriggered, setUpdateTriggered] = createSignal(false);

  onMount(() => {
    // Check if version has changed since last visit
    if (hasVersionChanged()) {
      storeVersionInfo();
    } else {
      storeVersionInfo();
    }
  });

  const checkAndUpdate = async () => {
    setChecking(true);
    try {
      const result = await checkForUpdate();
      if (result.available) {
        setUpdateAvailable(true);
        setUpdateTriggered(true);
        // Clear any cached resources and hard reload
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        window.location.reload();
      } else {
        setUpdateAvailable(false);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div class={`version-display ${props.className || ''}`}>
      <span class="text-xs text-gray-400">{getVersionDisplay()}</span>
      {!updateTriggered() && (
        <button
          onClick={checkAndUpdate}
          disabled={checking()}
          class="ml-2 cursor-pointer text-xs text-gray-400 underline transition-opacity hover:opacity-70 disabled:cursor-default disabled:no-underline disabled:opacity-50"
          title="Check for updates"
        >
          {checking() ? 'Checking...' : updateAvailable() ? 'Updating...' : 'Update'}
        </button>
      )}
    </div>
  );
};

export default VersionDisplay;
