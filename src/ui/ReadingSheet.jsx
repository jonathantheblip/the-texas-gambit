import { useState } from 'react';
import { feelChipsFor } from '../data/feel.js';
import { useRoomLayer } from '../store/useRoomLayer.js';
import { getIdentity, setIdentity } from '../store/geometryStore.js';

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Reading the room — the shared human layer at arrival. The writing (intent),
 * feel-chips ("how does standing here feel"), Helen's & Jon's notes in one view,
 * and the bridge into the 3D massing. Chips + notes sync (roomLayerStore).
 */
export default function ReadingSheet({ room, open, onClose, onStepInto }) {
  const { chips, notes, toggleChip, addNote } = useRoomLayer(room?.id);
  const [draft, setDraft] = useState('');
  const [ident, setIdent] = useState(getIdentity);
  if (!room) return null;

  const prompts = feelChipsFor(room.id);
  const chosen = new Set(chips);
  const submit = (e) => { e.preventDefault(); if (addNote(draft)) setDraft(''); };
  const chooseIdentity = (id) => { setIdentity(id); setIdent(id); };

  return (
    <>
      <div className={`wk-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <div className={`wk-sheet${open ? ' open' : ''}`} role="dialog" aria-label={`Reading the room — ${room.displayName}`} aria-hidden={!open}>
        <div className="wk-grab" />
        <h3>{room.displayName}</h3>
        <div className="sub">{room.building} · {room.floorLabel} · {room.w}×{room.d} ft · {room.area} ft²</div>

        {room.intent && <div className="intent">{room.intent}</div>}

        <div className="ask">How does standing here feel?</div>
        <div className="wk-feelchips">
          {prompts.map((t) => (
            <button key={t} className={`wk-fchip${chosen.has(t) ? ' on' : ''}`} onClick={() => toggleChip(t)}>{t}</button>
          ))}
        </div>

        <div className="ask">{notes.length ? 'Notes in this room' : 'No notes yet'}</div>
        <div className="wk-notes">
          {notes.map((n) => (
            <div className="wk-note" key={n.id}>
              <span className="by" data-by={n.author}>{cap(n.author)}</span>
              <span className="txt">{n.text}</span>
            </div>
          ))}
          <form className="wk-noteadd" onSubmit={submit}>
            <input type="text" value={draft} maxLength={160}
              placeholder="Leave a note in this room…" onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" aria-label="Add note">＋</button>
          </form>
        </div>

        <div className="who">
          <span>Note as</span>
          <button className={ident === 'helen' ? 'on' : ''} onClick={() => chooseIdentity('helen')}>Helen</button>
          <button className={ident === 'jon' ? 'on' : ''} onClick={() => chooseIdentity('jon')}>Jon</button>
        </div>

        <button className="wk-massing-cta" onClick={() => { onClose(); onStepInto(room.id); }}>
          <span className="ic"><span>⊞</span></span>
          <span>Step into the 3D massing
            <small>Read this volume — walls, height, how the space actually sits</small>
          </span>
        </button>
      </div>
    </>
  );
}
