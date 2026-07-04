import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ImageZoom from './ImageZoom.jsx';
import { STATUS_LABEL } from '../data/decisions.js';

const UNDO_MS = 8000;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const fmtDate = (t) => (t ? new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

function OptionCard({ option, isChosen, onChoose, onZoom }) {
  return (
    <div className={`dz-opt${isChosen ? ' chosen' : ''}`}>
      <button type="button" className="dz-opt-img" onClick={() => option.asset && onZoom(option)} disabled={!option.asset}>
        {option.asset
          ? <img src={option.asset} alt={`${option.label} — ${option.caption}`} loading="lazy" />
          : <div className="dz-opt-pending">Study image pending</div>}
      </button>
      <div className="dz-opt-cap">
        <span className="dz-opt-label">{option.label}</span>
        <span className="dz-opt-line">{option.caption}</span>
        {option.ancestorTrace && <span className="dz-opt-anc">{option.ancestorTrace}</span>}
      </div>
      <button type="button" className="dz-choose" onClick={() => onChoose(option.id)}>
        {isChosen ? 'Chosen' : 'Choose this'}
      </button>
    </div>
  );
}

function DecisionCard({ decision, onChoose, onFlag, onUndo, onAddNote, justChosen, onZoom }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [noteOptionId, setNoteOptionId] = useState('');

  const submitNote = (e) => {
    e.preventDefault();
    if (onAddNote(decision.id, draft, noteOptionId || null)) { setDraft(''); setNoteOpen(false); setNoteOptionId(''); }
  };

  return (
    <article className="dz-card">
      <div className="dz-card-head">
        <span className="dz-eyebrow" data-status={decision.status}>{STATUS_LABEL[decision.status] || 'Open decision'}</span>
        <h3>{decision.element}</h3>
      </div>

      <p className="dz-context">{decision.context}</p>
      {decision.contextAsset && (
        <div className="dz-context-img">
          <img src={decision.contextAsset} alt={`Reference — ${decision.element}`} loading="lazy" />
        </div>
      )}

      {justChosen ? (
        <div className="dz-undo-row">
          <span>Chosen: {decision.options.find((o) => o.id === decision.decidedOptionId)?.label}</span>
          <button type="button" onClick={() => onUndo(decision.id)}>Undo</button>
        </div>
      ) : (
        <div className="dz-options">
          {decision.options.map((o) => (
            <OptionCard key={o.id} option={o}
              isChosen={decision.decidedOptionId === o.id}
              onChoose={(optionId) => onChoose(decision.id, optionId)}
              onZoom={onZoom} />
          ))}
        </div>
      )}

      <div className="dz-card-foot">
        <button type="button" className="dz-flag" onClick={() => onFlag(decision.id)}>None of these — let's talk</button>
        <button type="button" className="dz-note-toggle" onClick={() => setNoteOpen((v) => !v)}>Add a note</button>
      </div>

      {noteOpen && (
        <form className="dz-noteform" onSubmit={submitNote}>
          <select value={noteOptionId} onChange={(e) => setNoteOptionId(e.target.value)} aria-label="Note about">
            <option value="">This decision</option>
            {decision.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <input type="text" value={draft} maxLength={280} placeholder="Leave a note…" onChange={(e) => setDraft(e.target.value)} />
          <button type="submit">Add</button>
        </form>
      )}

      {decision.notes.length > 0 && (
        <div className="dz-notes">
          {decision.notes.map((n) => (
            <div className="dz-note" key={n.id}>
              <span className="by">{cap(n.author)}</span>
              {n.optionId && <span className="on">on {decision.options.find((o) => o.id === n.optionId)?.label || n.optionId}</span>}
              <span className="txt">{n.text}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function DecidedRow({ decision }) {
  const chosen = decision.options.find((o) => o.id === decision.decidedOptionId);
  return (
    <div className="dz-decided-row">
      <div className="dz-decided-main">
        <span className="nm">{decision.element}</span>
        <span className="pick">Chose {chosen ? chosen.label : '—'}</span>
      </div>
      <div className="dz-decided-meta">{fmtDate(decision.decidedAt)}{decision.decidedBy ? ` · ${cap(decision.decidedBy)}` : ''}</div>
      {decision.notes.length > 0 && (
        <div className="dz-notes quiet">
          {decision.notes.map((n) => (
            <div className="dz-note" key={n.id}><span className="by">{cap(n.author)}</span><span className="txt">{n.text}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Open Decisions — a gallery, not a task list. Every decision is comparable images
 * at identical scale first, text second. No urgency chrome: no due dates, no
 * counts, no red badges. Three reactions, each one tap: choose an option, flag for
 * a conversation, or leave a note. Decided moves to a quiet archive — never deleted.
 */
export default function OpenDecisions({ decisions, onBack, chooseOption, flagForConversation, undoDecision, addNote, initialDecisionId }) {
  const [zoom, setZoom] = useState(null);   // { src, alt } | null
  const [justChosenId, setJustChosenId] = useState(null);
  const undoT = useRef(null);
  const cardRefs = useRef({});

  // A just-decided card stays in the open list for the undo grace window (below)
  // instead of jumping straight to the archive — otherwise "Chosen: X · Undo"
  // never gets a chance to render before the card it belongs to disappears.
  const open = useMemo(
    () => decisions.filter((d) => d.status !== 'decided' || d.id === justChosenId),
    [decisions, justChosenId]
  );
  const decided = useMemo(
    () => decisions.filter((d) => d.status === 'decided' && d.id !== justChosenId),
    [decisions, justChosenId]
  );
  const initialIsDecided = useMemo(
    () => decisions.find((d) => d.id === initialDecisionId)?.status === 'decided',
    [decisions, initialDecisionId]
  );
  const [archiveOpen, setArchiveOpen] = useState(() => initialIsDecided);

  useEffect(() => {
    if (!initialDecisionId) return;
    const el = cardRefs.current[initialDecisionId];
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [initialDecisionId, archiveOpen]);

  useEffect(() => () => clearTimeout(undoT.current), []);

  const handleChoose = (id, optionId) => {
    chooseOption(id, optionId);
    setJustChosenId(id);
    clearTimeout(undoT.current);
    undoT.current = setTimeout(() => setJustChosenId(null), UNDO_MS);
  };
  const handleUndo = (id) => { undoDecision(id); clearTimeout(undoT.current); setJustChosenId(null); };
  // Stable across re-renders (e.g. a realtime sync tick while zoomed) so
  // ImageZoom's focus-trap effect doesn't tear down and re-run on every parent update.
  const closeZoom = useCallback(() => setZoom(null), []);

  return (
    <div className="decisions">
      <header className="dz-hero">
        <button className="dz-back" onClick={onBack}>← Back</button>
        <div className="dz-hero-txt">
          <div className="dz-eyebrow-top">Open Decisions</div>
          <h1>The things we're deciding between</h1>
          <p>No due dates here — sit with these as long as you need.</p>
        </div>
      </header>

      <div className="dz-list">
        {open.map((d) => (
          <div key={d.id} ref={(el) => (cardRefs.current[d.id] = el)}>
            <DecisionCard decision={d}
              onChoose={handleChoose}
              onFlag={flagForConversation}
              onUndo={handleUndo}
              onAddNote={addNote}
              justChosen={justChosenId === d.id}
              onZoom={(o) => setZoom({ src: o.asset, alt: `${o.label} — ${o.caption}` })} />
          </div>
        ))}
        {!open.length && <p className="dz-empty">Nothing open right now.</p>}
      </div>

      {decided.length > 0 && (
        <section className={`dz-archive${archiveOpen ? ' open' : ''}`}>
          <button type="button" className="dz-archive-head" onClick={() => setArchiveOpen((v) => !v)} aria-expanded={archiveOpen}>
            <span>Decided</span><span className="dz-archive-count">{decided.length}</span>
          </button>
          {archiveOpen && (
            <div className="dz-archive-body">
              {decided.map((d) => (
                <div key={d.id} ref={(el) => (cardRefs.current[d.id] = el)}><DecidedRow decision={d} /></div>
              ))}
            </div>
          )}
        </section>
      )}

      {zoom && <ImageZoom src={zoom.src} alt={zoom.alt} onClose={closeZoom} />}
    </div>
  );
}
