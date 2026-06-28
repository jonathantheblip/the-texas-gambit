// One-shot extractor: eval the legacy IIFE data.js in a sandbox and emit the
// room writing (intent / ancestors / specs / images / phase) as clean JSON, so
// we never hand-retype the prose. Run: node scripts/extract_legacy_content.mjs
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../legacy/data.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const HCE = sandbox.window.HCE;

const rooms = {};
for (const r of HCE.ROOMS) {
  rooms[r.id] = {
    name: r.name,
    tag: r.tag || null,
    phase: r.phase || null,
    building: r.building,
    floor: r.floor,
    ancestors: r.ancestors || [],
    intent: r.intent || '',
    specs: r.specs || null,
    helenNote: r.helenNote || null,
    zones: r.zones || null,
    images: (r.images || []).map((im) => ({ file: im.slug, caption: im.caption || '' })),
  };
}

const out = { ancestors: HCE.ANCESTORS, rooms };
fs.writeFileSync(
  new URL('../src/data/legacy_content.json', import.meta.url),
  JSON.stringify(out, null, 2) + '\n'
);
console.log(`Extracted ${Object.keys(rooms).length} legacy rooms + ${Object.keys(HCE.ANCESTORS).length} ancestors -> src/data/legacy_content.json`);
