const REMOTE_FLAG_BASE_URL = 'https://flagcdn.com/w20';

export function normalizeFlagCode(flag: string) {
  return flag.toLowerCase();
}

export function getFlagAssetPath(flag: string) {
  return `/flags/${normalizeFlagCode(flag)}.png`;
}

export function handleFlagLoadError(event: Event, flag: string) {
  const image = event.currentTarget as HTMLImageElement;

  // A CDN fallback covers an incomplete/stale deployment. If that request also
  // fails, hide the broken-image icon; the adjacent country name remains visible.
  if (image.dataset.flagFallback !== 'remote') {
    image.dataset.flagFallback = 'remote';
    image.src = `${REMOTE_FLAG_BASE_URL}/${normalizeFlagCode(flag)}.png`;
    return;
  }

  image.hidden = true;
}
