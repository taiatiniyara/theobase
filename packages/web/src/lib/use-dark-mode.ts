import { useState, useEffect, useCallback } from 'react';

function ensureLightMode(): void {
  document.documentElement.classList.remove('dark');
}

export function useDarkMode(): [boolean, () => void] {
  const [dark] = useState(false);

  useEffect(() => {
    ensureLightMode();
  }, []);

  const toggle = useCallback(() => {
    ensureLightMode();
  }, []);

  return [dark, toggle];
}
