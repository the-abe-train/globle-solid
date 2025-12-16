import { createEffect } from 'solid-js';

export function useGoogleFont(fontFamily: string) {
  createEffect(() => {
    if (!fontFamily) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`;
    link.rel = 'stylesheet';

    // Defer appending to avoid blocking the main thread during mount
    const timer = setTimeout(() => {
      document.head.appendChild(link);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (link.parentNode) {
        document.head.removeChild(link);
      }
    };
  }, [fontFamily]);
}
