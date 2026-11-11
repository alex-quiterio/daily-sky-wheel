// A small state store: one plain object, replaced (never mutated) on every change, and the components that read it.
import { useEffect, useState } from 'preact/hooks';

export interface Store<S extends object> {
  get(): S;
  // merge `patch` into the state; listeners hear about it only if something actually changed
  set(patch: Partial<S> | ((s: S) => Partial<S>)): void;
  // called with the new and the previous state after every change; returns the unsubscribe
  subscribe(fn: (next: S, prev: S) => void): () => void;
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<(next: S, prev: S) => void>();
  return {
    get: () => state,
    set(patch) {
      const p = typeof patch === 'function' ? patch(state) : patch;
      const changed = (Object.keys(p) as (keyof S)[]).some((k) => !Object.is(p[k], state[k]));
      if (!changed) return;
      const prev = state;
      state = { ...state, ...p };
      listeners.forEach((fn) => fn(state, prev));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// The part of a store a component shows; it re-renders when that part changes.
export function useStore<S extends object, T>(store: Store<S>, pick: (s: S) => T): T {
  const [value, setValue] = useState(() => pick(store.get()));
  useEffect(() => {
    setValue(() => pick(store.get())); // in case it changed between render and effect
    return store.subscribe((s) => setValue(() => pick(s)));
    // `pick` is a selector written inline; following its identity would resubscribe on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);
  return value;
}
