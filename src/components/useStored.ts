import { useState } from 'preact/hooks';

// A choice remembered in localStorage
export function useStored(key: string, initial: string): [string, (value: string) => void] {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) || initial;
    } catch (e) {
      return initial;
    }
  });
  const set = (next: string) => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch (e) {
      /* storage unavailable */
    }
  };
  return [value, set];
}
