/* Hill Country Estate — store + shared utilities (vanilla JS, no JSX) */
window.HCEStore = (function(){
  const KEY = 'hce.v3';
  const TODAY = () => new Date().toISOString().slice(0,10);
  const NOW = () => Date.now();

  // Store shape:
  // { rooms: { [roomId]: { status, react, mood[], notes:[{id,t,text,kind,pinId}], pins:[{id,x,y,text,t}], specs:{[k]: 'lock'|'ask'} } },
  //   decisions: { [decisionId]: { pick, t } },
  //   journal:[{id,t,roomId,kind,text,extra}]
  // }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){}
    return { rooms:{}, decisions:{}, journal:[] };
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){}
  }

  function room(s, id) {
    if (!s.rooms[id]) s.rooms[id] = { notes:[], pins:[], specs:{}, mood:[] };
    if (!s.rooms[id].notes) s.rooms[id].notes = [];
    if (!s.rooms[id].pins) s.rooms[id].pins = [];
    if (!s.rooms[id].specs) s.rooms[id].specs = {};
    if (!s.rooms[id].mood) s.rooms[id].mood = [];
    return s.rooms[id];
  }

  function pushJournal(s, entry) {
    s.journal.push({ id: 'j_'+NOW()+'_'+Math.random().toString(36).slice(2,6), t: NOW(), ...entry });
  }

  return { load, save, room, pushJournal, TODAY, NOW };
})();
