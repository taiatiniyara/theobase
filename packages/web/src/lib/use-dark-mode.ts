import { useState, useEffect, useCallback } from 'react';

function getInitialMode(): boolean {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem('theme');
  if (stored === 'dark') return true;
  if (stored === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyMode(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(getInitialMode);

  useEffect(() => {
    applyMode(dark);
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e: MediaQueryListEvent) {
      const stored = localStorage.getItem('theme');
      if (!stored) setDark(e.matches);
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => setDark((prev) => !prev), []);

  return [dark, toggle];
}
