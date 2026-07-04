import { useEffect, useState } from 'react';
import { DECISIONS } from '../data/decisions.js';
import {
  getDecisionsState, subscribe, getDecisionsStatus,
  chooseOption, flagForConversation, undoDecision, addDecisionNote,
} from './decisionsStore.js';
import { getIdentity } from './geometryStore.js';

/**
 * Subscribe a component to Open Decisions: the static content (data/decisions.js)
 * joined with its live shared state (choice / notes) from decisionsStore. Both
 * people read and write through here, so they always see the same thing.
 */
export function useDecisions() {
  const [state, setState] = useState(getDecisionsState);
  const [status, setStatus] = useState(getDecisionsStatus);
  useEffect(() => {
    const off = subscribe(setState);
    const onStatus = (e) => setStatus(e.detail);
    window.addEventListener('hce.decisions.status', onStatus);
    return () => { off(); window.removeEventListener('hce.decisions.status', onStatus); };
  }, []);

  const decisions = DECISIONS.map((d) => {
    const row = state[d.id] || { status: 'open', optionId: null, t: null, decidedBy: null, notes: [] };
    const decided = row.status === 'decided';
    return {
      ...d,
      status: row.status || 'open',
      decidedOptionId: decided ? row.optionId : null,
      decidedAt: decided ? row.t : null,
      decidedBy: row.decidedBy || null,
      notes: row.notes || [],
    };
  });

  return {
    decisions,
    status,
    chooseOption: (id, optionId) => chooseOption(id, optionId, getIdentity()),
    flagForConversation: (id) => flagForConversation(id, getIdentity()),
    undoDecision: (id) => undoDecision(id, getIdentity()),
    addNote: (id, text, optionId) => addDecisionNote(id, text, getIdentity(), optionId),
  };
}
