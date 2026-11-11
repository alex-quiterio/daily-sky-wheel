// True while the page is being printed, so a component can lay itself out for paper.
import { useEffect, useState } from 'preact/hooks';

export function usePrinting(): boolean {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => setPrinting(true),
      after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  return printing;
}
