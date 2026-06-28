import { useEffect, useState } from 'react';
import { getNav, subscribeNav } from './navStore.js';

/** Subscribe a component to the single current-room/view source. */
export function useNav() {
  const [s, setS] = useState(getNav);
  useEffect(() => subscribeNav(setS), []);
  return s;
}
