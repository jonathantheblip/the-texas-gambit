// Generate evocative SVG placeholders for lookbook images
// Each room gets a distinct composition based on its ancestors and intent
// These are NOT renderings — they are mood placeholders in the parchment palette
// designed to communicate massing, light, and ancestor balance.

window.placeholderFor = (function(){
  // Palettes by ancestor — used to tint the SVG
  const PALETTES = {
    glebe:  { sky:'#e8e2d2', mid:'#9aa48a', dark:'#3a4a3a', accent:'#7d8b75', wall:'#f1ebd8', stone:'#c4ad88' },
    ptown:  { sky:'#dde6ea', mid:'#7e98a8', dark:'#2c3e54', accent:'#345980', wall:'#f4eee0', stone:'#d8c8a0' },
    texas:  { sky:'#e6d8b8', mid:'#b89860', dark:'#5e3f24', accent:'#a86a30', wall:'#ede0c4', stone:'#bca072' },
    miss:   { sky:'#dce4d2', mid:'#7d9a78', dark:'#3a5040', accent:'#6a8060', wall:'#eee7d2', stone:'#c4b890' },
  };

  // Hash a string -> stable number
  const hash = (s) => {
    let h = 0;
    for (let i=0;i<s.length;i++) h = ((h<<5)-h)+s.charCodeAt(i), h|=0;
    return Math.abs(h);
  };

  function pick(arr, seed) { return arr[seed % arr.length]; }

  // Compositions: a small library of stylized scenes
  function comp_porch(p, w, h, seed){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.66}" width="${w}" height="${h*0.34}" fill="${p.wall}"/>
      <rect x="0" y="${h*0.85}" width="${w}" height="${h*0.15}" fill="${p.stone}" opacity=".55"/>
      ${[0,1,2,3,4].map(i=>{
        const x = w*0.1 + i*w*0.2;
        return `<rect x="${x-6}" y="${h*0.35}" width="12" height="${h*0.5}" fill="${p.wall}"/>
                <rect x="${x-12}" y="${h*0.83}" width="24" height="6" fill="${p.stone}"/>`;
      }).join('')}
      <rect x="0" y="${h*0.32}" width="${w}" height="6" fill="${p.dark}" opacity=".5"/>
      <polygon points="0,${h*0.32} ${w},${h*0.32} ${w*0.5},${h*0.05}" fill="${p.dark}" opacity=".75"/>
    `;
  }
  function comp_facade(p, w, h){
    // Five-bay Georgian
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="${w*0.08}" y="${h*0.32}" width="${w*0.84}" height="${h*0.55}" fill="${p.stone}"/>
      <polygon points="${w*0.08},${h*0.32} ${w*0.92},${h*0.32} ${w*0.5},${h*0.08}" fill="${p.dark}"/>
      ${[0,1,2,3,4].map(i=>{
        const x = w*0.18 + i*w*0.16;
        return `<rect x="${x-w*0.04}" y="${h*0.42}" width="${w*0.08}" height="${h*0.18}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1.5"/>
                <line x1="${x}" y1="${h*0.42}" x2="${x}" y2="${h*0.6}" stroke="${p.dark}" stroke-width="1"/>
                <line x1="${x-w*0.04}" y1="${h*0.51}" x2="${x+w*0.04}" y2="${h*0.51}" stroke="${p.dark}" stroke-width="1"/>`;
      }).join('')}
      <rect x="${w*0.46}" y="${h*0.65}" width="${w*0.08}" height="${h*0.22}" fill="${p.dark}"/>
      <ellipse cx="${w*0.5}" cy="${h*0.65}" rx="${w*0.05}" ry="${h*0.04}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1"/>
      <rect x="${w*0.85}" y="${h*0.87}" width="${w*0.15}" height="${h*0.13}" fill="${p.mid}" opacity=".55"/>
    `;
  }
  function comp_interior(p, w, h, seed){
    return `
      <rect width="${w}" height="${h}" fill="${p.wall}"/>
      <rect x="0" y="${h*0.78}" width="${w}" height="${h*0.22}" fill="${p.stone}" opacity=".4"/>
      <rect x="${w*0.1}" y="${h*0.18}" width="${w*0.22}" height="${h*0.5}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1.5"/>
      <line x1="${w*0.21}" y1="${h*0.18}" x2="${w*0.21}" y2="${h*0.68}" stroke="${p.dark}" stroke-width="1"/>
      <line x1="${w*0.1}" y1="${h*0.43}" x2="${w*0.32}" y2="${h*0.43}" stroke="${p.dark}" stroke-width="1"/>
      <rect x="${w*0.62}" y="${h*0.18}" width="${w*0.22}" height="${h*0.5}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1.5"/>
      <line x1="${w*0.73}" y1="${h*0.18}" x2="${w*0.73}" y2="${h*0.68}" stroke="${p.dark}" stroke-width="1"/>
      <line x1="${w*0.62}" y1="${h*0.43}" x2="${w*0.84}" y2="${h*0.43}" stroke="${p.dark}" stroke-width="1"/>
      <rect x="${w*0.4}" y="${h*0.55}" width="${w*0.2}" height="${h*0.25}" fill="${p.dark}" opacity=".75"/>
      <rect x="${w*0.42}" y="${h*0.6}" width="${w*0.16}" height="${h*0.15}" fill="${p.accent}" opacity=".6"/>
      <rect x="${w*0.05}" y="${h*0.7}" width="${w*0.18}" height="${h*0.12}" fill="${p.accent}" opacity=".5"/>
      <rect x="${w*0.78}" y="${h*0.7}" width="${w*0.17}" height="${h*0.12}" fill="${p.mid}" opacity=".5"/>
    `;
  }
  function comp_pool(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.52}" width="${w}" height="${h*0.48}" fill="${p.mid}" opacity=".75"/>
      <rect x="0" y="${h*0.5}" width="${w}" height="${h*0.04}" fill="${p.stone}"/>
      <rect x="0" y="${h*0.85}" width="${w}" height="${h*0.04}" fill="${p.stone}" opacity=".75"/>
      <line x1="0" y1="${h*0.6}" x2="${w}" y2="${h*0.6}" stroke="${p.sky}" stroke-width="1" opacity=".5"/>
      <line x1="0" y1="${h*0.7}" x2="${w}" y2="${h*0.7}" stroke="${p.sky}" stroke-width="1" opacity=".4"/>
      <ellipse cx="${w*0.2}" cy="${h*0.4}" rx="${w*0.18}" ry="${h*0.22}" fill="${p.dark}" opacity=".7"/>
      <ellipse cx="${w*0.2}" cy="${h*0.4}" rx="${w*0.16}" ry="${h*0.2}" fill="${p.accent}" opacity=".6"/>
      <rect x="${w*0.7}" y="${h*0.32}" width="${w*0.05}" height="${h*0.18}" fill="${p.dark}"/>
      <polygon points="${w*0.7},${h*0.32} ${w*0.85},${h*0.18} ${w*0.85},${h*0.32}" fill="${p.wall}" opacity=".85"/>
    `;
  }
  function comp_landscape(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.62}" width="${w}" height="${h*0.38}" fill="${p.mid}" opacity=".65"/>
      <ellipse cx="${w*0.18}" cy="${h*0.62}" rx="${w*0.16}" ry="${h*0.2}" fill="${p.dark}" opacity=".75"/>
      <ellipse cx="${w*0.32}" cy="${h*0.6}" rx="${w*0.14}" ry="${h*0.18}" fill="${p.dark}" opacity=".65"/>
      <ellipse cx="${w*0.78}" cy="${h*0.62}" rx="${w*0.18}" ry="${h*0.22}" fill="${p.dark}" opacity=".75"/>
      <rect x="${w*0.42}" y="${h*0.54}" width="${w*0.16}" height="${h*0.14}" fill="${p.stone}"/>
      <polygon points="${w*0.42},${h*0.54} ${w*0.58},${h*0.54} ${w*0.5},${h*0.45}" fill="${p.dark}"/>
    `;
  }
  function comp_observatory(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.78}" width="${w}" height="${h*0.22}" fill="${p.mid}" opacity=".5"/>
      <rect x="${w*0.36}" y="${h*0.4}" width="${w*0.28}" height="${h*0.45}" fill="${p.stone}"/>
      <ellipse cx="${w*0.5}" cy="${h*0.4}" rx="${w*0.16}" ry="${h*0.1}" fill="${p.dark}"/>
      <line x1="${w*0.5}" y1="${h*0.32}" x2="${w*0.5}" y2="${h*0.4}" stroke="${p.dark}" stroke-width="2"/>
      ${[0,1,2,3].map(i=>{
        const y = h*0.5 + i*h*0.07;
        return `<rect x="${w*0.42}" y="${y}" width="${w*0.05}" height="${h*0.05}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1"/>
                <rect x="${w*0.53}" y="${y}" width="${w*0.05}" height="${h*0.05}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1"/>`;
      }).join('')}
    `;
  }
  function comp_window(p, w, h){
    // 12-over-12 sash window
    return `
      <rect width="${w}" height="${h}" fill="${p.wall}"/>
      <rect x="${w*0.15}" y="${h*0.1}" width="${w*0.7}" height="${h*0.8}" fill="${p.sky}" stroke="${p.dark}" stroke-width="3"/>
      ${[1,2].map(i=>`<line x1="${w*(0.15+0.7*i/3)}" y1="${h*0.1}" x2="${w*(0.15+0.7*i/3)}" y2="${h*0.9}" stroke="${p.dark}" stroke-width="1.5"/>`).join('')}
      ${[1,2,3,4,5,6,7].map(i=>`<line x1="${w*0.15}" y1="${h*(0.1+0.8*i/8)}" x2="${w*0.85}" y2="${h*(0.1+0.8*i/8)}" stroke="${p.dark}" stroke-width="1.5"/>`).join('')}
    `;
  }
  function comp_bath(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.wall}"/>
      <rect x="0" y="${h*0.5}" width="${w}" height="${h*0.5}" fill="${p.accent}" opacity=".35"/>
      ${[0,1,2,3,4,5].map(i=>[0,1,2,3,4].map(j=>`<rect x="${i*w/6+2}" y="${h*0.55+j*h*0.08+2}" width="${w/6-4}" height="${h*0.08-4}" fill="${p.accent}" opacity=".5"/>`).join('')).join('')}
      <ellipse cx="${w*0.32}" cy="${h*0.78}" rx="${w*0.18}" ry="${h*0.08}" fill="${p.wall}" stroke="${p.dark}" stroke-width="2"/>
      <ellipse cx="${w*0.32}" cy="${h*0.74}" rx="${w*0.18}" ry="${h*0.08}" fill="${p.wall}" stroke="${p.dark}" stroke-width="2"/>
      <rect x="${w*0.62}" y="${h*0.18}" width="${w*0.22}" height="${h*0.32}" fill="${p.sky}" stroke="${p.dark}" stroke-width="2"/>
      <line x1="${w*0.73}" y1="${h*0.18}" x2="${w*0.73}" y2="${h*0.5}" stroke="${p.dark}" stroke-width="1"/>
      <line x1="${w*0.62}" y1="${h*0.34}" x2="${w*0.84}" y2="${h*0.34}" stroke="${p.dark}" stroke-width="1"/>
    `;
  }
  function comp_kitchen(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.wall}"/>
      <rect x="0" y="${h*0.78}" width="${w}" height="${h*0.22}" fill="${p.stone}" opacity=".5"/>
      <rect x="${w*0.05}" y="${h*0.42}" width="${w*0.4}" height="${h*0.38}" fill="${p.dark}" opacity=".82"/>
      <rect x="${w*0.07}" y="${h*0.45}" width="${w*0.36}" height="${h*0.33}" fill="${p.accent}" opacity=".7"/>
      <rect x="${w*0.55}" y="${h*0.5}" width="${w*0.4}" height="${h*0.32}" fill="#1a3a6e" opacity=".7"/>
      <rect x="${w*0.6}" y="${h*0.54}" width="${w*0.3}" height="${h*0.04}" fill="${p.stone}"/>
      <rect x="${w*0.6}" y="${h*0.6}" width="${w*0.3}" height="${h*0.04}" fill="${p.stone}" opacity=".7"/>
      <rect x="${w*0.6}" y="${h*0.66}" width="${w*0.3}" height="${h*0.04}" fill="${p.stone}" opacity=".7"/>
    `;
  }
  function comp_oval(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.accent}" opacity=".15"/>
      <rect width="${w}" height="${h}" fill="${p.wall}" opacity=".7"/>
      <ellipse cx="${w*0.5}" cy="${h*0.45}" rx="${w*0.4}" ry="${h*0.35}" fill="none" stroke="${p.dark}" stroke-width="2"/>
      ${[0,1,2,3,4].map(i=>{
        const a = -1.2 + i*0.6;
        const x = w*0.5 + Math.sin(a)*w*0.36;
        const y = h*0.45 - Math.cos(a)*h*0.31;
        return `<rect x="${x-w*0.04}" y="${y}" width="${w*0.08}" height="${h*0.32}" fill="${p.sky}" stroke="${p.dark}" stroke-width="1.5"/>`;
      }).join('')}
      <ellipse cx="${w*0.5}" cy="${h*0.85}" rx="${w*0.18}" ry="${h*0.04}" fill="${p.dark}" opacity=".4"/>
      <rect x="${w*0.48}" y="${h*0.72}" width="${w*0.04}" height="${h*0.13}" fill="${p.dark}"/>
    `;
  }
  function comp_library(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.wall}"/>
      ${[0,1,2,3,4,5].map(i=>`<rect x="${i*w/6}" y="${h*0.1}" width="${w/6-2}" height="${h*0.7}" fill="none" stroke="${p.dark}" stroke-width="1"/>`).join('')}
      ${[0,1,2,3,4].map(i=>[0,1,2,3,4,5].map(j=>{
        const x = j*w/6 + 4;
        const y = h*0.12 + i*h*0.13;
        const cw = (w/6-8) * (0.7 + Math.sin(i*j*0.7)*0.25);
        const ch = h*0.11;
        const colors = [p.dark, p.accent, p.mid, p.stone];
        return `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${colors[(i+j)%4]}" opacity=".75"/>`;
      }).join('')).join('')}
      <rect x="0" y="${h*0.82}" width="${w}" height="${h*0.18}" fill="${p.stone}" opacity=".4"/>
    `;
  }
  function comp_garden(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.55}" width="${w}" height="${h*0.45}" fill="${p.mid}" opacity=".6"/>
      <rect x="${w*0.05}" y="${h*0.3}" width="${w*0.18}" height="${h*0.3}" fill="${p.stone}"/>
      <polygon points="${w*0.05},${h*0.3} ${w*0.23},${h*0.3} ${w*0.14},${h*0.18}" fill="${p.dark}" opacity=".8"/>
      <ellipse cx="${w*0.55}" cy="${h*0.35}" rx="${w*0.15}" ry="${h*0.1}" fill="${p.stone}"/>
      <rect x="${w*0.4}" y="${h*0.32}" width="${w*0.3}" height="${h*0.28}" fill="${p.stone}" opacity=".95"/>
      <rect x="${w*0.78}" y="${h*0.4}" width="${w*0.18}" height="${h*0.22}" fill="${p.stone}"/>
      <polygon points="${w*0.78},${h*0.4} ${w*0.96},${h*0.4} ${w*0.87},${h*0.3}" fill="${p.dark}" opacity=".7"/>
    `;
  }
  function comp_pergola(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="0" y="${h*0.78}" width="${w}" height="${h*0.22}" fill="${p.mid}" opacity=".5"/>
      ${[0,1,2,3,4].map(i=>{
        const x = w*0.1+i*w*0.2;
        return `<rect x="${x-6}" y="${h*0.3}" width="12" height="${h*0.5}" fill="${p.stone}"/>`;
      }).join('')}
      ${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${w*0.05+i*w*0.13}" y="${h*0.26}" width="${w*0.1}" height="4" fill="${p.dark}"/>`).join('')}
      ${[0,1,2,3,4].map(i=>`<ellipse cx="${w*0.1+i*w*0.2}" cy="${h*0.22}" rx="${w*0.08}" ry="${h*0.08}" fill="${p.dark}" opacity=".55"/>`).join('')}
    `;
  }
  function comp_motorbarn(p, w, h){
    return `
      <rect width="${w}" height="${h}" fill="${p.sky}"/>
      <rect x="${w*0.08}" y="${h*0.4}" width="${w*0.84}" height="${h*0.45}" fill="${p.stone}"/>
      <polygon points="${w*0.08},${h*0.4} ${w*0.92},${h*0.4} ${w*0.78},${h*0.18} ${w*0.22},${h*0.18}" fill="${p.dark}" opacity=".85"/>
      ${[0,1,2].map(i=>{
        const x = w*0.18 + i*w*0.25;
        return `<path d="M${x} ${h*0.85} L${x} ${h*0.55} A${w*0.08} ${h*0.08} 0 0 1 ${x+w*0.18} ${h*0.55} L${x+w*0.18} ${h*0.85} Z" fill="${p.dark}" opacity=".75"/>`;
      }).join('')}
      <rect x="0" y="${h*0.85}" width="${w}" height="${h*0.15}" fill="${p.mid}" opacity=".4"/>
    `;
  }
  function comp_compound_night(p, w, h){
    const dark = '#0e1218';
    return `
      <rect width="${w}" height="${h}" fill="${dark}"/>
      <rect x="0" y="${h*0.7}" width="${w}" height="${h*0.3}" fill="#1a1f25"/>
      ${[0,1,2,3,4].map(i=>`<rect x="${w*0.1+i*w*0.18}" y="${h*0.4}" width="${w*0.1}" height="${h*0.32}" fill="#0f1419"/>`).join('')}
      ${[0,1,2,3,4].map(i=>[0,1,2].map(j=>`<rect x="${w*0.115+i*w*0.18+j*w*0.03}" y="${h*0.46+(i%2)*h*0.06}" width="${w*0.025}" height="${h*0.04}" fill="#e8a04a"/>`).join('')).join('')}
      ${[0,1,2,3,4,5,6,7,8,9,10].map(i=>{
        const x = (hash('star'+i)%100)/100*w;
        const y = (hash('starY'+i)%70)/100*h*0.5;
        return `<circle cx="${x}" cy="${y}" r="0.8" fill="#f4ead0" opacity="${0.4 + (i%3)*0.2}"/>`;
      }).join('')}
    `;
  }

  // Map slug -> composition function
  function chooseComp(slug, room){
    const s = slug.toLowerCase();
    if (s.includes('night')) return comp_compound_night;
    if (s.includes('observatory')) return comp_observatory;
    if (s.includes('frontporch') || s.includes('frontelevation')) return comp_facade;
    if (s.includes('frontporch')) return comp_porch;
    if (s.includes('motorbarn')) return comp_motorbarn;
    if (s.includes('pool')) return comp_pool;
    if (s.includes('reargarden') || s.includes('compoundapproach')) return comp_landscape;
    if (s.includes('pergola') || s.includes('northalley')) return comp_pergola;
    if (s.includes('coveredwalkway') || s.includes('pavilion')) return comp_pergola;
    if (s.includes('greenhouse')) return comp_garden;
    if (s.includes('kitchen')) return comp_kitchen;
    if (s.includes('ovaldining')) return comp_oval;
    if (s.includes('library')) return comp_library;
    if (s.includes('ensuite') || s.includes('powderroom') || s.includes('scullery') || s.includes('mudroom')) return comp_bath;
    if (s.includes('window')) return comp_window;
    if (s.includes('garage')) return comp_motorbarn;
    if (s.includes('wharfwing')) return comp_facade;
    if (s.includes('compound')) return comp_landscape;
    if (s.includes('terrace')) return comp_pool;
    if (s.includes('porch')) return comp_porch;
    return comp_interior;
  }

  return function placeholderFor(image, room, opts){
    opts = opts || {};
    const w = opts.w || 1200, h = opts.h || 800;
    const ancestor = (room && room.ancestors && room.ancestors[0]) || 'glebe';
    const p = PALETTES[ancestor] || PALETTES.glebe;
    const seed = hash(image.slug);
    const comp = chooseComp(image.slug, room);

    // Faint paper grain overlay
    const grainId = 'grain_' + seed;
    const inner = comp(p, w, h, seed);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${image.alt}">
        <defs>
          <filter id="${grainId}">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed%32}"/>
            <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0.18 0"/>
            <feComposite in2="SourceGraphic" operator="in"/>
          </filter>
          <radialGradient id="vig_${seed}" cx="50%" cy="45%" r="75%">
            <stop offset="60%" stop-color="#000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#1a1408" stop-opacity=".42"/>
          </radialGradient>
        </defs>
        ${inner}
        <rect width="${w}" height="${h}" fill="url(#vig_${seed})"/>
        <rect width="${w}" height="${h}" filter="url(#${grainId})" opacity=".55"/>
      </svg>
    `;
  };
})();
