import { createEffect } from 'solid-js';

export function useGoogleFont(fontFamily: string) {
  createEffect(() => {
    if (!fontFamily) return;

    const link = document.createElement('link');
    const encodedFont = fontFamily.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${encodedFont}&display=swap`;
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
