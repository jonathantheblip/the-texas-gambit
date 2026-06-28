import { useEffect, useState } from 'react';
import { getOverrides, subscribe, getStatus } from './geometryStore.js';

/** Subscribe a component to the shared geometry overrides + sync status. */
export function useGeometry() {
  const [overrides, setOverrides] = useState(getOverrides);
  const [status, setStatus] = useState(getStatus);
  useEffect(() => {
    const off = subscribe(setOverrides);
    const onStatus = (e) => setStatus(e.detail);
    window.addEventListener('hce.sync.status', onStatus);
    return () => { off(); window.removeEventListener('hce.sync.status', onStatus); };
  }, []);
  return { overrides, status };
}
