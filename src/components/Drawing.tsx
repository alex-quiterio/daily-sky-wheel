import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

// An <svg> filled by a drawing function, redrawn whenever `deps` change
export function Drawing({
  draw,
  deps,
  ...svg
}: { draw: (svg: SVGSVGElement) => void; deps: unknown[] } & JSX.SVGAttributes<SVGSVGElement>) {
  const ref = useRef<SVGSVGElement>(null);
  // the caller names what the drawing depends on; `draw` itself is a new function on every render
  useLayoutEffect(() => {
    if (ref.current) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <svg ref={ref} {...svg}></svg>;
}
