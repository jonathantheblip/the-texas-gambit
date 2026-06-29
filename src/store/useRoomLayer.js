import { useEffect, useState } from 'react';
import { getLayer, subscribe, getLayerStatus, toggleChip, addNote, getIdentity } from './roomLayerStore.js';

/**
 * Subscribe a component to the shared human layer (notes + feel-chip selections)
 * for one room. Reads/writes flow through roomLayerStore, so both people see the
 * same thing and offline edits queue.
 */
export function useRoomLayer(roomId) {
  const [layer, setLayer] = useState(getLayer);
  const [status, setStatus] = useState(getLayerStatus);
  useEffect(() => {
    const off = subscribe(setLayer);
    const onStatus = (e) => setStatus(e.detail);
    window.addEventListener('hce.layer.status', onStatus);
    return () => { off(); window.removeEventListener('hce.layer.status', onStatus); };
  }, []);
  const room = layer[roomId] || { chips: [], notes: [] };
  return {
    chips: room.chips || [],
    notes: room.notes || [],
    status,
    toggleChip: (label) => toggleChip(roomId, label, getIdentity()),
    addNote: (text) => addNote(roomId, text, getIdentity()),
  };
}
