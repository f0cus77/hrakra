(() => {
'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
/* ================= CONFIG ================= */
const ICON = {
  trees: '<path d="M12 21v-6"/><path d="M12 15c-4 0-6.5-2.8-6.5-6.2A6.5 6.5 0 0 1 12 2.5a6.5 6.5 0 0 1 6.5 6.3c0 3.4-2.5 6.2-6.5 6.2z"/><path d="M12 11l-2.5-2.5M12 13l3-3"/>',
  pickers: '<path d="M3.5 10h17l-2 10h-13z"/><path d="M8 10l4-6 4 6"/>',
  racks: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  grinders: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2"/><path d="M12 4v5.8M12 14.2V20M4 12h5.8M14.2 12H20"/>',
  packers: '<path d="M6 7h12l-1 13H7z"/><path d="M6 7l1.5-3h9L18 7M10 11h4"/>',
  dealers: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M4 13l3-5h6l2 4h4l1 3"/>',
  couriers: '<path d="M2 7h11v9H2zM13 10h5l3 3v3h-8"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>'
};
// max = slots, base = unlock/level base cost, k = level cost growth, sm = slot unlock multiplier, r0 = rate per power
const UNITS = [
  { id: 'trees',    tab: 'farm', title: 'Kratomový sad',    unit: 'Strom',   max: 4, base: 15,   k: 1.20, sm: 25, r0: .15, ru: 'kg/s', tap: 'Zalít' },
  { id: 'pickers',  tab: 'farm', title: 'Sběrači',          unit: 'Sběrač',  max: 4, base: 50,   k: 1.21, sm: 25, r0: .25, ru: 'kg/s', tap: 'Sklidit' },
  { id: 'racks',    tab: 'farm', title: 'Sušárna',          unit: 'Lísa',    max: 3, base: 120,  k: 1.22, sm: 35, r0: .20, ru: 'kg/s', tap: 'Usušit' },
  { id: 'grinders', tab: 'proc', title: 'Drcení',           unit: 'Drtička', max: 2, base: 300,  k: 1.23, sm: 120, r0: .15, ru: 'kg/s', tap: 'Podrtit' },
  { id: 'packers',  tab: 'proc', title: 'Balicí linka',     unit: 'Balič',   max: 3, base: 400,  k: 1.23, sm: 45, r0: 1,   ru: 'ks/s', tap: 'Zabalit' },
  { id: 'dealers',  tab: 'dist', title: 'Pouliční dealeři', unit: 'Dealer',  max: 5, base: 600,  k: 1.24, sm: 18, r0: .6,  ru: 'ks/s', tap: 'Prodat' },
  { id: 'couriers', tab: 'dist', title: 'Kurýrní síť',      unit: 'Kurýr',   max: 2, base: 4e4,  k: 1.25, sm: 80, r0: 4,   ru: 'ks/s', tap: null }
];
const UBY = Object.fromEntries(UNITS.map(u => [u.id, u]));
const MS = 10; // every 10 levels a slot gets ×1.75 speed
const BAG = { 25: { prem: 1.6, scale: .72 }, 50: { prem: 1.25, scale: .86 }, 100: { prem: 1, scale: 1.04 } };
const PRICE_KG = 120;

const LOCS = [
  { n: 'Kedah',        d: 'Vesnice mezi rýžovými poli. Tady to celé začíná.', cost: 0,    mult: 1,  price: 1,   heat: 1 },
  { n: 'Perak',        d: 'Džungle kolem Ipohu, plantáže na vápencových kopcích.', cost: 25e3, mult: 2,  price: 1.4, heat: 1.15 },
  { n: 'Kelantan',     d: 'Hranice s Thajskem, ketum tu roste u každé cesty.', cost: 2e6,  mult: 4,  price: 2,   heat: 1.35 },
  { n: 'Penang',       d: 'Přístav George Town, lodě do celé Asie.',          cost: 2e8,  mult: 8,  price: 3,   heat: 1.6 },
  { n: 'Kuala Lumpur', d: 'Hlavní město. Velké peníze, velká policie.',       cost: 3e10, mult: 16, price: 4.5, heat: 2 },
  { n: 'Johor Bahru',  d: 'Brána do Singapuru. Vrchol impéria.',              cost: 1.5e12, mult: 32, price: 7,   heat: 2.6 }
];

const UPG = [];
const UNAMES = {
  trees: ['Hnojivo z palmových zbytků', 'Zavlažovací kanálky', 'Odrůda Maeng Da', 'Skleníky v džungli', 'Vlastní genetika', 'Terasové plantáže'],
  pickers: ['Pořádné košíky', 'Motorky na plantáž', 'Sezónní brigádníci', 'Noční směny', 'Sběrací vozíky', 'Drony na mapování'],
  racks: ['Bambusové lísy', 'Plachty proti dešti', 'Solární sušárna', 'Průmyslové dehydrátory', 'Klimatizovaný sklad', 'Sušicí tunel'],
  grinders: ['Ruční mlýnek', 'Elektrický mlýnek', 'Kladivový mlýn', 'Průmyslová linka', 'Jemné síto', 'Druhá výrobní hala'],
  packers: ['Svářečka sáčků', 'Digitální váhy', 'Potisk etiket', 'Pásový dopravník', 'Automat na dávkování', 'Robotické rameno'],
  dealers: ['Předplacené mobily', 'Skútry na rozvoz', 'Síť karaoke barů', 'Telegram kanál', 'Noční trhy', 'Celoasijská síť'],
  couriers: ['Dodávky bez loga', 'GPS trasy', 'Sklady u dálnice', 'Přístavní kontakty', 'Nákladní lodě', 'Letecké zásilky']
};
const TIER = [12, 180, 3e3, 6e4, 1.5e6, 4e7];
UNITS.forEach(u => UNAMES[u.id].forEach((nm, i) => UPG.push({ id: u.id + i, name: nm, desc: `${u.title}: rychlost ×2`, cost: u.base * TIER[i] * (i + 1), kind: 'unit', t: u.id })));
[['Zip-lock sáčky', 400], ['Vlastní značka', 12e3], ['Kapsle', 4e5], ['Export do Thajska', 1.5e7], ['Prémiový Red Vein mix', 6e8], ['Dárková balení', 3e10]]
  .forEach(([n, c], i) => UPG.push({ id: 'price' + i, name: n, desc: 'Prodejní cena +50 %', cost: c, kind: 'price' }));
[['Úplatek místnímu policistovi', 2500], ['Krycí čajovna', 7e4], ['Právník v Ipohu', 2.5e6], ['Kontakt u policie', 1.2e8], ['Kamarád na ministerstvu', 7e9]]
  .forEach(([n, c], i) => UPG.push({ id: 'heat' + i, name: n, desc: 'Heat −30 %, rychlejší vychladnutí', cost: c, kind: 'heat' }));
[['Pracovní rukavice', 60], ['Ostrá mačeta', 2500], ['Silná kopi', 1.2e5], ['Nářadí z Japonska', 6e6]]
  .forEach(([n, c], i) => UPG.push({ id: 'hand' + i, name: n, desc: 'Ruční práce ×3', cost: c, kind: 'hand' }));
[['Prořezávání', 300], ['Starší stromy', 3e4], ['Opory větví', 3e6], ['Šlechtění', 3e8]]
  .forEach(([n, c], i) => UPG.push({ id: 'cap' + i, name: n, desc: 'Kapacita listí na stromě ×2', cost: c, kind: 'cap' }));
UPG.sort((a, b) => a.cost - b.cost);

const EVENTS = [
  { id: 'monsoon', txt: 'Monzun — sušení −50 %', dur: 60, cls: 'bad' },
  { id: 'buyer',   txt: 'Odběratel z Thajska — cena ×2', dur: 45, cls: 'good' },
  { id: 'bloom',   txt: 'Ideální počasí — růst ×3', dur: 40, cls: 'good' },
  { id: 'patrol',  txt: 'Policejní hlídky — heat ×2', dur: 40, cls: 'bad' },
  { id: 'rush',    txt: 'Noční trh — prodej ×2', dur: 45, cls: 'good' }
];

/* ================= STATE ================= */
const fresh = () => ({
  cash: 15, onTree: 3, fresh: 0, dry: 0, powder: 0, b25: 0, b50: 0, b100: 0, bag: 50,
  lv: { trees: [1, 0, 0, 0], pickers: [0, 0, 0, 0], racks: [0, 0, 0], grinders: [0, 0], packers: [0, 0, 0], dealers: [0, 0, 0, 0, 0], couriers: [0, 0] },
  upg: {}, loc: 0, heat: 0, layUntil: 0, layCd: 0, ev: null, nextEv: Date.now() + 120e3,
  total: 0, taps: 0, raids: 0, sold: 0, bagsSold: 0, start: Date.now(), t: Date.now()
});
let S = fresh();
let buyAmt = 1, ipsEma = 0, tab = 'farm';

/* ================= MATH ================= */
const cnt = kind => UPG.reduce((a, u) => a + (S.upg[u.id] && u.kind === kind ? 1 : 0), 0);
const evOn = id => S.ev && S.ev.id === id && Date.now() < S.ev.until;
const MS_MULT = 1.75;
const lvPow = L => L > 0 ? L * Math.pow(MS_MULT, Math.floor(L / MS)) : 0;
const own = id => S.lv[id].filter(l => l > 0).length;
const power = id => S.lv[id].reduce((a, L) => a + lvPow(L), 0);
const lvSum = id => S.lv[id].reduce((a, L) => a + L, 0);
function umult(id) {
  let m = 1;
  for (const u of UPG) if (u.t === id && S.upg[u.id]) m *= 2;
  return m * LOCS[S.loc].mult;
}
const handMult = () => Math.pow(3, cnt('hand')) * LOCS[S.loc].mult;
const priceKg = () => PRICE_KG * LOCS[S.loc].price * Math.pow(1.5, cnt('price')) * (evOn('buyer') ? 2 : 1);
const bagPrice = sz => sz / 1000 * priceKg() * BAG[sz].prem;
const cap = () => Math.max(4, power('trees') * 6 * Math.pow(2, cnt('cap')) * LOCS[S.loc].mult);
const heatMult = () => Math.pow(.7, cnt('heat')) * LOCS[S.loc].heat * (evOn('patrol') ? 2 : 1);
const heatDecay = () => 1 + cnt('heat') * .2;
const layLow = () => Date.now() < S.layUntil;
const bagsTotal = () => S.b25 + S.b50 + S.b100;
function caps() {
  return {
    grow: unitRate('trees') * (evOn('bloom') ? 3 : 1),
    pick: unitRate('pickers'),
    dry: unitRate('racks') * (evOn('monsoon') ? .5 : 1),
    grind: unitRate('grinders'),
    pack: unitRate('packers'),
    sell: layLow() ? 0 : (unitRate('dealers') + unitRate('couriers')) * (evOn('rush') ? 2 : 1)
  };
}
function unitRate(id) { return power(id) * UBY[id].r0 * umult(id); }
function slotRate(id, L) { return lvPow(L) * UBY[id].r0 * umult(id); }
function lvCost(u, L, n) { const c0 = u.base * Math.pow(u.k, L - 1); return c0 * (Math.pow(u.k, n) - 1) / (u.k - 1); }
function lvMax(u, L) { const c0 = u.base * Math.pow(u.k, L - 1); return Math.max(0, Math.floor(Math.log(S.cash * (u.k - 1) / c0 + 1) / Math.log(u.k))); }
function unlockCost(u, i) { return u.base * (i === 0 ? 1 : Math.pow(u.sm, i)); }
// all displayed numbers are whole: full integers up to 999 999, then integer + suffix (1 250K, 3 400M …)
const grp = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (Math.round(n) < 1e6) return grp(Math.max(0, n));
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Oc', 'No']; let i = 0, m = n / 1000;
  while (Math.round(m) >= 1e6 && i < u.length - 1) { m /= 1000; i++; }
  return grp(m) + u[i];
}
// under 1 kg switch to grams so small amounts stay whole numbers
const kg = n => n > 0 && Math.round(n * 1000) < 1000 ? grp(n * 1000) + ' g' : fmt(n) + ' kg';
const rm = n => '$' + fmt(n);
const pct = m => m === 1 ? 'základ' : '+' + Math.round((m - 1) * 100) + '\u00a0%';
const fint = n => fmt(Math.floor(n));

/* ================= SIMULATION ================= */
let flows = { grow: 0, pick: 0, dry: 0, grind: 0, pack: 0, sell: 0 };
function sellBags(n) {
  let earn = 0, kgs = 0, left = n;
  const order = [S.bag, ...[25, 50, 100].filter(x => x !== S.bag)];
  for (const sz of order) {
    const take = Math.min(left, S['b' + sz]); if (take <= 0) continue;
    S['b' + sz] -= take; left -= take; earn += take * bagPrice(sz); kgs += take * sz / 1000;
  }
  const sold = n - left;
  S.cash += earn; S.total += earn; S.sold += kgs; S.bagsSold += sold;
  return { earn, sold };
}
function tick(dt, offline) {
  const c = caps(), C = cap();
  const g = Math.min(c.grow * dt, Math.max(0, C - S.onTree)); S.onTree += g;
  const p = Math.min(c.pick * dt, S.onTree); S.onTree -= p; S.fresh += p;
  const d = Math.min(c.dry * dt, S.fresh); S.fresh -= d; S.dry += d / 2;
  const gr = Math.min(c.grind * dt, S.dry); S.dry -= gr; S.powder += gr;
  const szKg = S.bag / 1000;
  const pk = Math.min(c.pack * dt, S.powder / szKg); S.powder -= pk * szKg; S['b' + S.bag] += pk;
  const r = sellBags(c.sell * dt);
  if (r.sold > 0) {
    const dR = unitRate('dealers'), cR = unitRate('couriers');
    const share = (dR + cR * .3) / Math.max(1e-9, dR + cR);           // couriers make 70 % less noise
    S.heat += (2 + Math.log10(1 + r.sold / dt) * 1.5) * .45 * share * heatMult() * dt;
  }
  S.heat = Math.max(0, S.heat - heatDecay() * (layLow() ? 6 : 1) * dt);
  if (offline) S.heat = Math.min(S.heat, 90);
  else if (S.heat >= 100) raid();
  if (dt > 0) flows = { grow: g / dt, pick: p / dt, dry: d / dt, grind: gr / dt, pack: pk / dt, sell: r.sold / dt };
  return r.earn;
}
function raid() {
  if (!S.warned) {
    S.warned = 1; S.heat = 45;
    vib([40, 30, 40]);
    modal(`<h2>Varování</h2><p>Místní policista si tě všiml a nechal tě jít — tentokrát.</p>
      <p>Prodej zvyšuje <b style="color:var(--cream)">heat</b>. Až dojde na 100 %, přijde razie: zabaví zboží, část peněz a zatkne dealery.</p>
      <p style="font-size:12px">Použij „Zalehnout“ nebo kup úplatek v Impériu.</p><button class="cta ok" data-close>Rozumím</button>`);
    save(); return;
  }
  const lostCash = S.cash * .2, lostBags = bagsTotal() * .6;
  const before = lvSum('dealers');
  S.cash -= lostCash; S.b25 *= .4; S.b50 *= .4; S.b100 *= .4; S.powder *= .5;
  S.lv.dealers = S.lv.dealers.map(l => l > 1 ? Math.max(1, Math.floor(l * .85)) : l);
  const arrested = before - lvSum('dealers');
  S.heat = 25; S.raids++;
  vib([60, 40, 60]);
  $('app').classList.remove('shake'); void $('app').offsetWidth; $('app').classList.add('shake');
  modal(`<h2>Razie</h2><p>Policie vtrhla do skladu v ${LOCS[S.loc].n}.</p>
    <div class="big" style="color:var(--clay)">−${rm(lostCash)}</div>
    <p>Zabaveno ${fint(lostBags)} sáčků a půlka prášku${arrested ? `, dealeři přišli o ${arrested} levelů` : ''}.</p>
    <p style="font-size:12px">Hlídej heat: zalehni nebo kup úplatky.</p>
    <button class="cta ok" data-close>Pokračovat</button>`);
  save();
}

/* ================= DRAW HELPERS ================= */
const R = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lc = (a, b, t) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const eBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function glow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
function person(g, x, y, s, o) {
  // o: {walk, dir, hat, shirt, carry, carryFill, arm}
  const sw = o.walk ? Math.sin(o.walk) : 0;
  g.lineCap = 'round'; g.strokeStyle = '#2a2622'; g.lineWidth = 2.4 * s;
  g.beginPath(); g.moveTo(x, y - 10 * s); g.lineTo(x - 3 * s * sw, y); g.moveTo(x, y - 10 * s); g.lineTo(x + 3 * s * sw, y); g.stroke();
  g.fillStyle = o.shirt; rrect(g, x - 4 * s, y - 20 * s, 8 * s, 11 * s, 2.5 * s); g.fill();
  g.fillStyle = '#a5826a'; g.beginPath(); g.arc(x, y - 23.5 * s, 3.2 * s, 0, 6.283); g.fill();
  if (o.hat) { g.fillStyle = '#c8b58c'; g.beginPath(); g.moveTo(x - 8 * s, y - 24 * s); g.lineTo(x, y - 30 * s); g.lineTo(x + 8 * s, y - 24 * s); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - 8 * s, y - 24.4 * s, 16 * s, 1 * s); }
  if (o.carry) {
    const bx = x + o.dir * 5 * s, by = y - 14 * s;
    g.strokeStyle = '#6b5a45'; g.lineWidth = 1.2 * s; g.beginPath(); g.arc(bx, by - 2 * s, 4 * s, Math.PI, 0); g.stroke();
    g.fillStyle = '#7a6448'; rrect(g, bx - 5 * s, by - 2 * s, 10 * s, 7 * s, 1.5 * s); g.fill();
    if (o.carryFill) { g.fillStyle = '#7fa66a'; g.beginPath(); g.ellipse(bx, by - 2 * s, 4.6 * s, 2.2 * s, 0, 0, 6.283); g.fill(); }
  }
  if (o.arm != null) { g.strokeStyle = o.shirt; g.lineWidth = 2.6 * s; g.beginPath(); g.moveTo(x + 3 * s, y - 17 * s); g.lineTo(x + 9 * s, y - 17 * s - o.arm * 5 * s); g.stroke(); }
}
function hills(g, W, H, base, amp, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 6; x += 5) {
    const y = base - Math.sin(x / W * 7.5 + seed) * amp - Math.sin(x / W * 19 + seed * 3) * amp * .3 - Math.abs(Math.sin(x * .11 + seed * 5)) * amp * .28;
    g.lineTo(x, y);
  }
  g.lineTo(W, H); g.closePath(); g.fill();
}
function tree(g, x, y, s, born, i, t, day, leafFrac) {
  const age = (performance.now() - born) / 1000;
  const gr = clamp(age / 2.2);
  if (gr < 1) s *= .2 + .8 * eBack(gr);
  const sway = Math.sin(t * 1.2 + i * 1.7) * .05 + (vis.water && performance.now() - vis.water < 600 ? Math.sin((performance.now() - vis.water) / 40) * .04 : 0);
  const tx = x + sway * 30 * s, ty = y - 30 * s;
  g.strokeStyle = lc('#2b241e', '#4b3f34', day); g.lineWidth = 4 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway * 10 * s, y - 15 * s, tx, ty); g.stroke();
  g.lineWidth = 2 * s; g.beginPath(); g.moveTo(lerp(x, tx, .6), y - 20 * s); g.lineTo(tx - 9 * s, ty - 4 * s); g.moveTo(lerp(x, tx, .7), y - 22 * s); g.lineTo(tx + 9 * s, ty - 6 * s); g.stroke();
  const blobs = [[0, -8, 15], [-12, -2, 11], [12, -3, 12], [-6, -18, 11], [7, -17, 11], [0, 3, 9]];
  const dark = lc('#163024', '#2c6b3c', day), mid = lc('#1d3f2c', '#3f9150', day), lite = lc('#2a5a3a', '#6cc265', day);
  g.fillStyle = dark; blobs.forEach(([bx, by, r]) => { g.beginPath(); g.arc(tx + bx * s, ty + by * s, r * s, 0, 6.283); g.fill(); });
  g.fillStyle = mid; blobs.forEach(([bx, by, r]) => { g.beginPath(); g.arc(tx + bx * s - 1.5 * s, ty + by * s - 2 * s, r * s * .78, 0, 6.283); g.fill(); });
  g.fillStyle = lite; blobs.slice(0, 5).forEach(([bx, by, r]) => { g.beginPath(); g.arc(tx + bx * s - 3 * s, ty + by * s - 4 * s, r * s * .42, 0, 6.283); g.fill(); });
  // ripe leaves = harvestable stock
  const n = Math.round(leafFrac * 9);
  g.fillStyle = lc('#7fc25a', '#c6f58c', day);
  for (let k = 0; k < n; k++) {
    const a = R(i * 31 + k) * 6.283, d = (3 + R(i * 17 + k) * 8) * s;
    const lx = tx + Math.cos(a) * d * 1.25, ly = ty - 7 * s + Math.sin(a) * d * .9;
    g.beginPath(); g.ellipse(lx, ly, 2.6 * s, 1.3 * s, a + Math.sin(t * 2 + k) * .3, 0, 6.283); g.fill();
  }
}
function bagShape(g, x, y, sz, a) {
  const k = BAG[sz].scale, w = 16 * k * a, h = 21 * k * a;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 1, w * .55, 2, 0, 0, 6.283); g.fill();
  g.fillStyle = grad(g, x - w / 2, 0, x + w / 2, 0, [[0, '#cfcdc8'], [.5, '#ecebe7'], [1, '#bdbbb6']]);
  g.beginPath(); g.moveTo(x - w / 2, y - h + 3); g.lineTo(x + w / 2, y - h + 3); g.lineTo(x + w / 2 + 1, y - 2); g.quadraticCurveTo(x, y + 1, x - w / 2 - 1, y - 2); g.closePath(); g.fill();
  g.fillStyle = '#9fa08a'; rrect(g, x - w / 2 + 2.5, y - h * .55, w - 5, h * .42, 2); g.fill();
  g.fillStyle = sz === 25 ? '#ff7aa8' : sz === 50 ? '#7fd35c' : '#4aa8ff'; g.fillRect(x - w / 2, y - h + 3, w, 3);
  g.fillStyle = '#2b2b2e'; g.font = `700 ${Math.max(5, 6 * k * a)}px Inter,sans-serif`; g.textAlign = 'center'; g.fillText(sz, x, y - h * .62);
}
function scooter(g, x, y, s, dir, t, lit, col = '#4a4e55') {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  if (lit) { g.fillStyle = grad(g, 12, -8, 60, -8, [[0, 'rgba(255,235,190,.22)'], [1, 'rgba(255,235,190,0)']]); g.beginPath(); g.moveTo(12, -10); g.lineTo(60, -18); g.lineTo(60, 2); g.closePath(); g.fill(); }
  g.fillStyle = '#111'; [-10, 10].forEach(wx => { g.beginPath(); g.arc(wx, -4, 4, 0, 6.283); g.fill(); });
  g.strokeStyle = '#555'; g.lineWidth = 1; [-10, 10].forEach(wx => { g.beginPath(); g.arc(wx, -4, 2, t * 20, t * 20 + 3); g.stroke(); });
  g.fillStyle = col; g.beginPath(); g.moveTo(-13, -6); g.quadraticCurveTo(-12, -14, -2, -13); g.lineTo(6, -13); g.lineTo(11, -18); g.lineTo(13, -16); g.lineTo(12, -6); g.closePath(); g.fill();
  g.fillStyle = '#7f9a71'; rrect(g, -18, -22, 10, 9, 1.5); g.fill();
  g.fillStyle = '#2f3540'; rrect(g, -6, -24, 6, 11, 3); g.fill();
  g.fillStyle = '#ddd'; g.beginPath(); g.arc(-3, -27, 3.6, 0, 6.283); g.fill();
  g.fillStyle = '#222'; g.fillRect(-1, -28, 3, 2);
  g.fillStyle = '#fff1cc'; g.beginPath(); g.arc(12.5, -15, 1.4, 0, 6.283); g.fill();
  g.fillStyle = '#c2463c'; g.fillRect(-14, -9, 2, 2);
  g.restore();
}
function van(g, x, y, s, dir, t) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  g.fillStyle = grad(g, 26, -10, 80, -10, [[0, 'rgba(255,235,190,.2)'], [1, 'rgba(255,235,190,0)']]); g.beginPath(); g.moveTo(26, -12); g.lineTo(80, -22); g.lineTo(80, 2); g.closePath(); g.fill();
  g.fillStyle = '#d3d2cd'; rrect(g, -26, -28, 38, 22, 3); g.fill();
  g.fillStyle = '#c6c5c0'; g.beginPath(); g.moveTo(12, -24); g.lineTo(20, -24); g.lineTo(27, -14); g.lineTo(27, -6); g.lineTo(12, -6); g.closePath(); g.fill();
  g.fillStyle = '#1d2430'; g.beginPath(); g.moveTo(14, -22); g.lineTo(19.5, -22); g.lineTo(24, -15); g.lineTo(14, -15); g.closePath(); g.fill();
  g.fillStyle = '#7f9a71'; g.fillRect(-24, -17, 34, 2);
  g.fillStyle = '#111'; [-16, 16].forEach(wx => { g.beginPath(); g.arc(wx, -5, 5, 0, 6.283); g.fill(); g.fillStyle = '#444'; g.beginPath(); g.arc(wx, -5, 2, 0, 6.283); g.fill(); g.fillStyle = '#111'; });
  g.fillStyle = '#fff1cc'; g.fillRect(25, -12, 2, 3); g.fillStyle = '#c2463c'; g.fillRect(-27, -14, 2, 4);
  g.restore();
}
/* ================= SCENES ================= */
const vis = { treeBorn: [0], lvPop: {}, leaves: [], parts: [], bags: [], coins: [], fx: [], grAngle: 0, belt: 0, bagAcc: 0, spawnBag: 0, coinBurst: 0, water: 0, grindKick: 0, treeHit: null };
const popScale = key => { const t = vis.lvPop[key]; if (!t) return 1; const q = (performance.now() - t) / 1000; if (q > .7) { delete vis.lvPop[key]; return 1; } return 1 + .14 * Math.exp(-6 * q) * Math.sin(q * 20); };
function dayCycle(t) { const p = ((t + 14) / 120) % 1, isDay = p < .74, q = isDay ? p / .74 : (p - .74) / .26; return { isDay, q, day: isDay ? Math.min(1, Math.sin(q * Math.PI) * 2.4) : 0 }; }
function fxStep(g, dt) {
  for (let j = vis.fx.length - 1; j >= 0; j--) {
    const q = vis.fx[j]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.life <= 0) { vis.fx.splice(j, 1); continue; }
    g.globalAlpha = clamp(q.life * 2); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 6.283); g.fill(); g.globalAlpha = 1;
  }
  if (vis.fx.length > 300) vis.fx.splice(0, vis.fx.length - 300);
}
function ghostOutline(g, x, y, w, h, u) {
  g.save(); g.setLineDash([5 * u, 4 * u]); g.strokeStyle = 'rgba(246,240,222,.35)'; g.lineWidth = 2;
  rrect(g, x - w / 2, y - h, w, h, 8 * u); g.stroke(); g.restore();
}

/* ---------- FARM ---------- */
function shed(g, x, y, u, day) {
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y + 2, 40 * u, 6 * u, 0, 0, 6.283); g.fill();
  g.fillStyle = lc('#3a2a1c', '#a8743f', day); g.fillRect(x - 30 * u, y - 34 * u, 60 * u, 34 * u);
  g.fillStyle = lc('#3a2c20', '#8a6845', day); for (let k = 0; k < 5; k++) g.fillRect(x - 30 * u + k * 12 * u, y - 34 * u, 1.2 * u, 34 * u);
  g.fillStyle = lc('#4a2220', '#d0503c', day); g.beginPath(); g.moveTo(x - 38 * u, y - 32 * u); g.lineTo(x, y - 54 * u); g.lineTo(x + 38 * u, y - 32 * u); g.closePath(); g.fill();
  g.strokeStyle = lc('#3a1a18', '#9c382a', day); g.lineWidth = 1; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - 38 * u + k * 6 * u, y - 32 * u - k * 3.6 * u); g.lineTo(x + 38 * u - k * 6 * u, y - 32 * u - k * 3.6 * u); g.stroke(); }
  g.fillStyle = '#16110c'; rrect(g, x - 8 * u, y - 22 * u, 16 * u, 22 * u, 2 * u); g.fill();
  glow(g, x, y - 12 * u, 22 * u, '255,200,120', .18 * (1 - day) + .04);
  // baskets
  [[-22, 0], [18, 0], [22, -6]].forEach(([dx, dy], k) => { g.fillStyle = '#7a6448'; rrect(g, x + dx * u - 5 * u, y + dy * u - 7 * u, 10 * u, 7 * u, 1.5 * u); g.fill(); g.fillStyle = '#7fa66a'; g.beginPath(); g.ellipse(x + dx * u, y + dy * u - 7 * u, 4.5 * u, 2 * u, 0, 0, 6.283); g.fill(); });
}
function rack(g, x, y, w, u, day, owned, i, t) {
  const top = y - 30 * u;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y + 1, w * .55, 5 * u, 0, 0, 6.283); g.fill();
  g.strokeStyle = lc('#33261a', '#8a5a32', day); g.lineWidth = 3 * u; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - w / 2 + 6 * u, y); g.lineTo(x - w / 2 + 6 * u, top); g.moveTo(x + w / 2 - 6 * u, y); g.lineTo(x + w / 2 - 6 * u, top); g.stroke();
  const ps = popScale('racks' + i);
  g.save(); g.translate(x, top); g.scale(ps, ps);
  g.fillStyle = lc('#3a2a1c', '#b07a45', day); rrect(g, -w / 2, -3 * u, w, 6 * u, 3 * u); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(-w / 2 + k * w / 8, -3 * u); g.lineTo(-w / 2 + k * w / 8, 3 * u); g.stroke(); }
  const dryRatio = (S.dry + 1e-9) / (S.fresh + S.dry + 1e-9);
  const n = Math.min(14, Math.ceil(Math.log10(1 + (S.fresh + S.dry) * 10) * 4));
  for (let m = 0; m < n; m++) {
    g.fillStyle = lc('#6f9a5c', '#8b7353', clamp(dryRatio + R(m + i * 7) * .3 - .15));
    g.globalAlpha = .65 + day * .35; g.beginPath(); g.ellipse(-w / 2 + 8 * u + R(i * 40 + m) * (w - 16 * u), -4 * u, 5 * u, 2.2 * u, R(m * 3) - .5, 0, 6.283); g.fill(); g.globalAlpha = 1;
  }
  g.restore();
  if (flows.dry > 0 && day > .2) {
    g.strokeStyle = `rgba(255,240,210,${.14 * day})`; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const bx = x - w * .25 + k * w * .25; g.beginPath(); for (let j = 0; j < 8; j++) { const yy = top - 8 - j * 3.5, xx = bx + Math.sin(t * 4 + j * .8 + k + i) * 2; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  }
}
function sign(g, x, y, u, text) {
  g.font = `800 ${11 * u}px "Baloo 2",sans-serif`; const w = g.measureText(text).width + 14 * u;
  g.strokeStyle = '#6b4a2b'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 16 * u); g.stroke();
  g.fillStyle = '#f6e7c4'; rrect(g, x - w / 2, y - 32 * u, w, 18 * u, 5 * u); g.fill();
  g.strokeStyle = '#a8743f'; g.lineWidth = 1.5 * u; g.stroke();
  g.fillStyle = '#4a2f18'; g.textAlign = 'center'; g.fillText(text, x, y - 19 * u);
}
function tarp(g, o, u, day, t) {
  const kick = performance.now() - (vis.tarpKick || 0) < 300 ? Math.sin((performance.now() - vis.tarpKick) / 30) * 2 * u : 0;
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(o.x, o.y + 4 * u, o.w * .56, 9 * u, 0, 0, 6.283); g.fill();
  g.save(); g.translate(o.x, o.y + kick * .3);
  g.fillStyle = lc('#6b5634', '#e2bf72', day); g.beginPath(); g.moveTo(-o.w / 2, 0); g.lineTo(-o.w / 2 + 12 * u, -20 * u); g.lineTo(o.w / 2 - 12 * u, -20 * u); g.lineTo(o.w / 2, 0); g.closePath(); g.fill();
  g.strokeStyle = lc('#5a4529', '#c49a52', day); g.lineWidth = 1.4;
  for (let k = 1; k < 7; k++) { const f = k / 7; g.beginPath(); g.moveTo(-o.w / 2 + f * o.w, 0); g.lineTo(-o.w / 2 + 12 * u + f * (o.w - 24 * u), -20 * u); g.stroke(); }
  const dryRatio = (S.dry + 1e-9) / (S.fresh + S.dry + 1e-9), n = Math.min(12, Math.ceil(Math.log10(1 + (S.fresh + S.dry) * 10) * 4));
  for (let m = 0; m < n; m++) { g.fillStyle = lc('#6f9a5c', '#8b7353', clamp(dryRatio + R(m + 90) * .3 - .15)); g.beginPath(); g.ellipse(-o.w / 2 + 16 * u + R(m + 70) * (o.w - 32 * u), -4 * u - R(m + 80) * 13 * u, 5 * u, 2.2 * u, R(m) - .5, 0, 6.283); g.fill(); }
  g.restore();
  sign(g, o.x - o.w / 2 - 8 * u, o.y + 2 * u, u, 'Sušení');
}
function mortar(g, o, t) {
  const u = o.s, k = performance.now() - (vis.mortarKick || 0) < 260 ? Math.sin((performance.now() - vis.mortarKick) / 26) : 0;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(o.x, o.y + 1, 24 * u, 4 * u, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#8a5a32'; g.lineWidth = 5 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x + 6 * u, o.y - 22 * u - k * 6 * u); g.lineTo(o.x + 18 * u, o.y - 40 * u - k * 6 * u); g.stroke();
  g.fillStyle = grad(g, o.x - 20 * u, 0, o.x + 20 * u, 0, [[0, '#7d8790'], [.5, '#aeb7bf'], [1, '#6f7880']]);
  g.beginPath(); g.moveTo(o.x - 21 * u, o.y - 24 * u); g.quadraticCurveTo(o.x - 20 * u, o.y, o.x, o.y); g.quadraticCurveTo(o.x + 20 * u, o.y, o.x + 21 * u, o.y - 24 * u); g.closePath(); g.fill();
  g.fillStyle = '#5c646b'; g.beginPath(); g.ellipse(o.x, o.y - 24 * u, 21 * u, 5 * u, 0, 0, 6.283); g.fill();
  if (S.dry > 0) { g.fillStyle = '#8b7353'; g.beginPath(); g.ellipse(o.x, o.y - 24 * u, 15 * u, 3 * u, 0, 0, 6.283); g.fill(); }
  sign(g, o.x, o.y + 30 * u, u, 'Drcení');
}
function drawFarm(g, t, dt) {
  const L = LAY, u = L.u, { isDay, q, day } = dayCycle(t);
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, lc('#141634', '#3fa7d6', day)], [.4, lc('#22284a', '#9bdcd2', day)], [1, lc('#10241c', '#3b8a3f', day)]]); g.fillRect(0, 0, W, H);
  if (day < .95) for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(246,240,222,${(1 - day) * (.2 + .45 * Math.abs(Math.sin(t * 1.3 + i * 2.1)))})`; g.fillRect(R(i) * W, R(i + 50) * F(.1), 1.3, 1.3); }
  const cx = W * (.06 + .88 * q), cy = F(.12) - Math.sin(q * Math.PI) * (F(.12) - 40);
  if (isDay) { glow(g, cx, cy, 80, '255,214,140', .3 * day + .06); g.fillStyle = '#ffe2a6'; g.beginPath(); g.arc(cx, cy, 12, 0, 6.283); g.fill(); }
  else { glow(g, cx, cy, 40, '220,225,235', .12); g.fillStyle = '#d6d8dc'; g.beginPath(); g.arc(cx, cy, 9, 0, 6.283); g.fill(); g.fillStyle = '#0d1517'; g.beginPath(); g.arc(cx + 4, cy - 3, 8, 0, 6.283); g.fill(); }
  hills(g, W, H, F(.02), 22, lc('#16263a', '#4f9e7a', day), 1);
  hills(g, W, H, F(.10), 14, lc('#132a2a', '#3c8a5a', day), 2.6);
  const gy = F(.15);
  g.fillStyle = grad(g, 0, gy, 0, H, [[0, lc('#163222', '#5cae48', day)], [1, lc('#0f2418', '#3d8a37', day)]]); g.fillRect(0, gy, W, H - gy);
  // soil rows + footpath
  g.strokeStyle = lc('#1b3a27', '#6cbf54', day); g.lineWidth = 1.5;
  for (let k = 0; k < 9; k++) { const y = gy + 18 + k * (H - gy) / 9; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(W / 2, y - 6, W, y); g.stroke(); }
  g.strokeStyle = lc('#3a2c1e', '#b9895a', day); g.lineWidth = 14 * u; g.lineCap = 'round';
  g.beginPath(); g.moveTo(L.shed.x, L.shed.y); g.bezierCurveTo(W * .5, F(.3), W * .5, F(.7), W * .5, F(.915)); g.stroke();
  g.lineWidth = 10 * u; g.beginPath(); g.moveTo(W * .5, F(.915)); g.lineTo(L.racks[0].x, F(.915)); g.moveTo(W * .5, F(.915)); g.lineTo(L.racks[2].x, F(.915)); g.stroke();
  const FL = ['#ff7aa8', '#ffd25e', '#ffffff', '#c58bff', '#ff8a5c'];
  for (let k = 0; k < 34; k++) { const fx = R(k + 300) * W, fy = F(.18 + R(k + 330) * .8), sway = Math.sin(t * 2 + k) * 1.2; g.fillStyle = lc('#22402c', FL[k % 5], .35 + day * .65); g.beginPath(); g.arc(fx + sway, fy, 2.4 * u, 0, 6.283); g.fill(); g.fillStyle = lc('#22402c', '#fff3b0', .3 + day * .7); g.beginPath(); g.arc(fx + sway, fy, .9 * u, 0, 6.283); g.fill(); }
  shed(g, L.shed.x, L.shed.y, u * 1.05, day);
  const leafFrac = clamp(S.onTree / cap());
  while (vis.treeBorn.length < 4) vis.treeBorn.push(performance.now());
  const draws = [];
  L.trees.forEach((o, i) => {
    if (S.lv.trees[i]) draws.push({ y: o.y, f: () => { let s = o.s * popScale('trees' + i); if (vis.treeHit && vis.treeHit.i === i) { const qq = (performance.now() - vis.treeHit.t) / 1000; if (qq < .4) s *= 1 - .05 * Math.sin(qq * 30) * (1 - qq / .4); } tree(g, o.x, o.y, s, vis.treeBorn[i], i, t, day, leafFrac); } });
    else if (i === own('trees')) draws.push({ y: o.y, f: () => {
      g.fillStyle = lc('#2a2117', '#5d4a33', day); g.beginPath(); g.ellipse(o.x, o.y, 26 * u, 8 * u, 0, Math.PI, 0); g.fill();
      g.strokeStyle = lc('#3d5c35', '#7fb069', day); g.lineWidth = 2.5 * u; g.beginPath(); g.moveTo(o.x, o.y - 4 * u); g.lineTo(o.x, o.y - 18 * u); g.stroke();
      g.fillStyle = lc('#3d5c35', '#8fc275', day); g.beginPath(); g.ellipse(o.x - 5 * u, o.y - 16 * u, 5 * u, 2.4 * u, -.6, 0, 6.283); g.ellipse(o.x + 5 * u, o.y - 19 * u, 5 * u, 2.4 * u, .6, 0, 6.283); g.fill();
    } });
  });
  // workers
  const nw = own('pickers'), ownT = Math.max(1, own('trees')), ownR = own('racks');
  for (let i = 0; i < nw; i++) {
    const T = L.trees[i % ownT], Rk = ownR ? L.racks[i % ownR] : { x: W * .5, y: F(.97) };
    const from = { x: T.x + (i % 2 ? 16 : -16) * u, y: T.y + 6 * u }, to = { x: Rk.x + (i % 2 ? 12 : -12) * u, y: Rk.y - 4 * u };
    const spd = 1 + Math.log10(S.lv.pickers[i] || 1) * .6;
    let x, y, dir = 1, full = false, walk = 0;
    if (flows.pick > 0) {
      const ph = (t * .08 * spd * (1 + i * .07) + i * .31) % 1, uu = ph < .5 ? ph * 2 : 2 - ph * 2, e = uu * uu * (3 - 2 * uu);
      x = lerp(from.x, to.x, e); y = lerp(from.y, to.y, e); dir = (to.x - from.x) * (ph < .5 ? 1 : -1) > 0 ? 1 : -1; full = ph < .5; walk = t * 10 + i;
      y -= Math.abs(Math.sin(walk)) * 1.5 * u;
    } else { x = from.x; y = from.y; }
    draws.push({ y, f: () => person(g, x, y, u * 1.15, { walk, dir, hat: true, shirt: ['#e0533f', '#2f86c9', '#e8a92c', '#2aa58a'][i], carry: true, carryFill: full }) });
  }
  draws.sort((a, b) => a.y - b.y).forEach(d => d.f());
  tarp(g, L.tarp, u, day, t);
  L.racks.forEach((o, i) => { if (S.lv.racks[i]) rack(g, o.x, o.y, o.w, u, day, true, i, t); else if (i === own('racks')) ghostOutline(g, o.x, o.y, o.w, 30 * u, u); });
  // leaves
  if (flows.pick > 0 && Math.random() < .06 + Math.min(.25, flows.pick * .04)) {
    const o = L.trees[(Math.random() * ownT) | 0];
    vis.leaves.push({ x: o.x + (Math.random() - .5) * 50 * o.s, y: o.y - 60 * o.s, vy: 14 + Math.random() * 10, vx: 0, ph: Math.random() * 6, life: 3 });
  }
  g.fillStyle = lc('#4e7a42', '#8dbb72', day);
  for (let j = vis.leaves.length - 1; j >= 0; j--) {
    const l = vis.leaves[j]; l.life -= dt;
    if (l.burst) { l.vy += 260 * dt; l.vx *= .96; } l.y += l.vy * dt; l.x += (l.vx || 0) * dt + Math.sin(t * 3 + l.ph) * 14 * dt;
    if (l.life <= 0 || l.y > H) { vis.leaves.splice(j, 1); continue; }
    g.globalAlpha = clamp(l.life * 2); g.beginPath(); g.ellipse(l.x, l.y, 3.4 * u, 1.6 * u, Math.sin(t * 4 + l.ph), 0, 6.283); g.fill(); g.globalAlpha = 1;
  }
  if (vis.leaves.length > 200) vis.leaves.splice(0, vis.leaves.length - 200);
  if (day < .3) for (let i = 0; i < 10; i++) { const fx = (R(i + 9) * W + Math.sin(t * .4 + i) * 30) % W, fy = F(.2 + R(i + 3) * .6) + Math.cos(t * .7 + i) * 8; glow(g, fx, fy, 7, '214,230,160', (.3 + .3 * Math.sin(t * 3 + i * 2)) * (1 - day / .3)); }
  fxStep(g, dt);
  if (evOn('monsoon')) {
    g.strokeStyle = 'rgba(180,200,215,.3)'; g.lineWidth = 1;
    g.beginPath(); for (let i = 0; i < 80; i++) { const x = (R(i) * W + t * 60) % W, y = (R(i + 7) * H + t * 480 * (.8 + R(i) * .4)) % H; g.moveTo(x, y); g.lineTo(x - 3, y + 11); } g.stroke();
    g.fillStyle = 'rgba(15,25,30,.25)'; g.fillRect(0, 0, W, H);
  }
}

/* ---------- WORKSHOP ---------- */
function grinder(g, gx, gy, s, i, t, spin, owned) {
  const ps = popScale('grinders' + i);
  g.save(); g.translate(gx, gy); g.scale(s * ps, s * ps);
  const jit = owned && spin ? Math.sin(t * 60 + i) * .6 : 0;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 54, 6, 0, 0, 6.283); g.fill();
  // hopper
  g.fillStyle = '#c7552f'; g.beginPath(); g.moveTo(-34, -104 + jit); g.lineTo(34, -104 + jit); g.lineTo(15, -78 + jit); g.lineTo(-15, -78 + jit); g.closePath(); g.fill();
  const fill = clamp(Math.log10(1 + S.dry * 5) / 3);
  if (fill > .05 && owned) { g.fillStyle = '#8a7a55'; g.beginPath(); g.ellipse(0, -102 + jit, 30, 4 + fill * 5, 0, Math.PI, 0); g.fill(); }
  g.fillStyle = grad(g, -40, 0, 40, 0, [[0, '#e0663a'], [.5, '#f58a4e'], [1, '#c9542c']]);
  rrect(g, -40, -80 + jit, 80, 64, 10); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g, -36, -76 + jit, 72, 8, 4); g.fill(); g.fillStyle = '#20160c'; rrect(g, -12, -46 + jit, 24, 14, 3); g.fill(); g.fillStyle = '#ffc857'; g.font = '800 9px "Baloo 2",sans-serif'; g.textAlign = 'center'; g.fillText('K-01', 0, -36 + jit);
  g.fillStyle = '#26272c'; rrect(g, -18, -16, 36, 10, 3); g.fill();
  // wheel
  const wx = 44, wy = -52 + jit, wr = 20;
  g.strokeStyle = '#3b3f46'; g.lineWidth = 4; g.beginPath(); g.arc(wx, wy, wr, 0, 6.283); g.stroke();
  g.lineWidth = 2.5; for (let k = 0; k < 5; k++) { const a = vis.grAngle * (1 + i * .1) + k * 1.2566; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); g.stroke(); }
  g.fillStyle = '#8a8a92'; g.beginPath(); g.arc(wx, wy, 4, 0, 6.283); g.fill();
  const led = owned && spin ? '154,214,114' : '239,122,85';
  glow(g, -26, -66 + jit, 9, led, .9); g.fillStyle = `rgb(${led})`; g.beginPath(); g.arc(-26, -66 + jit, 2.6, 0, 6.283); g.fill();
  // powder pile
  const pile = clamp(Math.log10(1 + S.powder * 8) / 3.2);
  g.fillStyle = '#b5b56e'; g.beginPath(); g.ellipse(0, 0, 8 + pile * 34, 2 + pile * 10, 0, Math.PI, 0); g.fill();
  g.restore();
  if (owned && spin) for (let k = 0; k < 2; k++) vis.parts.push({ x: gx + (Math.random() - .5) * 6 * s, y: gy - 10 * s, vy: 30 + Math.random() * 40, vx: (Math.random() - .5) * 8, life: .3, c: '#b6ae86' });
}
function drawProc(g, t, dt) {
  const L = LAY, u = L.u;
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#163b3e'], [.6, '#1f5150'], [.61, '#6b4527'], [1, '#4a2f1b']]); g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(246,240,222,.06)'; g.lineWidth = 1; for (let x = 0; x < W; x += 26 * u) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, F(.6)); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,.25)'; for (let y = F(.62); y < H; y += 22 * u) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // window
  const wx = W * .60, wy = F(.02), ww = W * .3, wh = F(.2) - F(.02);
  g.fillStyle = '#0b1114'; rrect(g, wx, wy, ww, wh, 6); g.fill();
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(246,240,222,${.25 + .35 * Math.sin(t + i)})`; g.fillRect(wx + R(i) * ww, wy + R(i + 4) * wh * .6, 1.3, 1.3); }
  g.fillStyle = '#121a1a'; g.beginPath(); g.moveTo(wx, wy + wh); for (let x = 0; x <= ww; x += 6) g.lineTo(wx + x, wy + wh * .7 - Math.abs(Math.sin(x * .2)) * 7); g.lineTo(wx + ww, wy + wh); g.fill();
  g.strokeStyle = '#3a2c20'; g.lineWidth = 4; rrect(g, wx, wy, ww, wh, 6); g.stroke(); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
  // lamp
  const lx = W * .44, ly = F(.08), flick = .9 + .1 * Math.sin(t * 13) * Math.sin(t * 7.3);
  g.strokeStyle = '#333'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, ly - 8 * u); g.stroke();
  g.fillStyle = '#2d2f33'; g.beginPath(); g.moveTo(lx - 16 * u, ly); g.lineTo(lx - 7 * u, ly - 8 * u); g.lineTo(lx + 7 * u, ly - 8 * u); g.lineTo(lx + 16 * u, ly); g.closePath(); g.fill();
  g.fillStyle = grad(g, 0, ly, 0, F(.85), [[0, `rgba(255,220,160,${.16 * flick})`], [1, 'rgba(255,220,160,0)']]);
  g.beginPath(); g.moveTo(lx - 14 * u, ly); g.lineTo(lx + 14 * u, ly); g.lineTo(lx + W * .42, F(.85)); g.lineTo(lx - W * .42, F(.85)); g.closePath(); g.fill();
  glow(g, lx, ly, 16 * u, '255,220,160', .55 * flick);
  for (let i = 0; i < 16; i++) { const mx = lx + (R(i) - .5) * W * .5 + Math.sin(t * .3 + i) * 10, my = F(.1 + ((R(i + 3) + t * .02 * (1 + R(i))) % 1) * .6); g.fillStyle = `rgba(255,235,200,${.12 + .14 * Math.sin(t + i)})`; g.fillRect(mx, my, 1.4, 1.4); }
  // bench
  const by = L.bench;
  g.fillStyle = '#4a3a2b'; g.fillRect(W * .04, by, W * .92, 10 * u); g.fillStyle = '#33281e'; g.fillRect(W * .04, by + 10 * u, W * .92, 5 * u);
  g.fillStyle = '#2a2018'; [W * .08, W * .9].forEach(x => g.fillRect(x, by + 15 * u, 8 * u, F(.62) - by - 15 * u));
  // grinders
  const spin = flows.grind > 0 ? 3 + Math.min(10, Math.log10(1 + flows.grind * 50) * 4) : 0;
  const kick = performance.now() - vis.grindKick < 400 ? 8 : 0;
  vis.grAngle += (spin + kick) * dt;
  mortar(g, L.mortar, t);
  L.grind.forEach((o, i) => { if (S.lv.grinders[i]) grinder(g, o.x, o.y, o.s, i, t, spin || kick, true); else if (i === own('grinders')) ghostOutline(g, o.x, o.y, 90 * o.s, 100 * o.s, u); });
  // conveyor
  const B = L.belt, cy = B.y;
  const beltSpd = flows.pack > 0 ? 40 + Math.min(80, Math.log10(1 + flows.pack) * 40) : (vis.spawnBag > 0 ? 70 : 0);
  vis.belt = (vis.belt + beltSpd * dt) % 16;
  g.strokeStyle = '#2b2b30'; g.lineWidth = 4 * u; g.beginPath(); [B.x0 + 14, (B.x0 + B.x1) / 2, B.x1 - 14].forEach(x => { g.moveTo(x, cy + 8); g.lineTo(x, cy + 40 * u); }); g.stroke();
  g.fillStyle = '#1f2024'; rrect(g, B.x0, cy, B.x1 - B.x0, 12 * u, 6 * u); g.fill();
  g.strokeStyle = 'rgba(246,240,222,.09)'; g.lineWidth = 1.4; for (let x = B.x0 + 8 + vis.belt; x < B.x1 - 6; x += 16) { g.beginPath(); g.moveTo(x, cy + 2); g.lineTo(x - 4, cy + 10 * u); g.stroke(); }
  [B.x0 + 6 * u, B.x1 - 6 * u].forEach(rx => { g.fillStyle = '#3a3a40'; g.beginPath(); g.arc(rx, cy + 6 * u, 6 * u, 0, 6.283); g.fill(); const a = vis.belt / 16 * 6.283; g.strokeStyle = '#70707a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(rx, cy + 6 * u); g.lineTo(rx + Math.cos(a) * 5 * u, cy + 6 * u + Math.sin(a) * 5 * u); g.stroke(); });
  // packers behind the belt
  const np = own('packers');
  for (let i = 0; i < np; i++) person(g, B.x0 + (B.x1 - B.x0) * (.25 + i * .25), cy + 2, u * 1.2, { shirt: ['#2aa58a', '#e0533f', '#7a5cd6'][i], arm: flows.pack > 0 ? Math.abs(Math.sin(t * 7 + i * 1.3)) : 0 });
  // bags
  if (flows.pack > 0) vis.bagAcc += dt * Math.min(2.2, .6 + Math.log10(1 + flows.pack));
  while (vis.bagAcc >= 1) { vis.bagAcc--; vis.bags.push({ x: B.x0 + 12, sz: S.bag, drop: 0 }); }
  while (vis.spawnBag > 0) { vis.spawnBag--; vis.bags.push({ x: B.x0 + 12 - vis.bags.filter(b => b.x < B.x0 + 40).length * 22, sz: S.bag, drop: 0 }); }
  const C = L.crate, cw = 74 * u, ch = 46 * u;
  const inCrate = Math.min(9, Math.ceil(Math.log10(1 + bagsTotal()) * 3));
  for (let k = 0; k < inCrate; k++) bagShape(g, C.x - cw * .3 + (k % 3) * cw * .3, C.y - ch + 6 - Math.floor(k / 3) * 8 * u, [25, 50, 100][(R(k) * 3) | 0], .9 * u);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(C.x, C.y + 2, cw * .6, 5 * u, 0, 0, 6.283); g.fill();
  g.fillStyle = '#6b5440'; rrect(g, C.x - cw / 2, C.y - ch, cw, ch, 4); g.fill();
  g.strokeStyle = '#4a3a2b'; g.lineWidth = 2.5; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(C.x - cw / 2, C.y - ch + k * ch / 3); g.lineTo(C.x + cw / 2, C.y - ch + k * ch / 3); g.stroke(); }
  for (let j = vis.bags.length - 1; j >= 0; j--) {
    const b = vis.bags[j];
    if (b.x < B.x1 - 8) { b.x += Math.max(beltSpd, 40) * dt; bagShape(g, b.x, cy, b.sz, u * 1.15); }
    else { b.drop += dt * 3; const e = clamp(b.drop); bagShape(g, lerp(B.x1 - 8, C.x, e), lerp(cy, C.y - ch, e) - Math.sin(e * Math.PI) * 18 * u, b.sz, u * 1.15); if (e >= 1) vis.bags.splice(j, 1); }
  }
  if (vis.bags.length > 30) vis.bags.splice(0, vis.bags.length - 30);
  for (let j = vis.parts.length - 1; j >= 0; j--) {
    const q = vis.parts[j]; q.life -= dt; q.vy += 200 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.life <= 0) { vis.parts.splice(j, 1); continue; }
    g.fillStyle = q.c; g.globalAlpha = clamp(q.life * 3); g.fillRect(q.x, q.y, 1.8, 1.8); g.globalAlpha = 1;
  }
  if (vis.parts.length > 300) vis.parts.splice(0, vis.parts.length - 300);
}

/* ---------- STREET ---------- */
function stall(g, x, y, u, t) {
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 2, 56 * u, 6 * u, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#3a2c20'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(x - 44 * u, y); g.lineTo(x - 44 * u, y - 86 * u); g.moveTo(x + 44 * u, y); g.lineTo(x + 44 * u, y - 86 * u); g.stroke();
  for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#f6f0de' : '#5f9a45'; g.beginPath(); const x0 = x - 52 * u + k * 104 * u / 6; g.moveTo(x0, y - 86 * u); g.lineTo(x0 + 104 * u / 6, y - 86 * u); g.lineTo(x0 + 104 * u / 6, y - 74 * u); g.quadraticCurveTo(x0 + 52 * u / 6, y - 66 * u, x0, y - 74 * u); g.closePath(); g.fill(); }
  g.fillStyle = '#5a4330'; rrect(g, x - 48 * u, y - 34 * u, 96 * u, 34 * u, 4 * u); g.fill();
  g.fillStyle = '#6e5540'; g.fillRect(x - 48 * u, y - 34 * u, 96 * u, 5 * u);
  const n = Math.min(6, Math.ceil(Math.log10(1 + bagsTotal()) * 2));
  for (let k = 0; k < n; k++) bagShape(g, x - 34 * u + k * 13 * u, y - 34 * u, [25, 50, 100][k % 3], u * .95);
  glow(g, x, y - 60 * u, 40 * u, '255,210,140', .12);
  g.fillStyle = '#ffc857'; rrect(g, x - 30 * u, y - 112 * u, 60 * u, 20 * u, 10 * u); g.fill();
  g.fillStyle = '#20160c'; g.font = `800 ${12 * u}px "Baloo 2",sans-serif`; g.textAlign = 'center'; g.fillText('PRODEJ', x, y - 98 * u);
}
function garage(g, x, y, u, open) {
  g.fillStyle = '#16181c'; rrect(g, x - 46 * u, y - 52 * u, 92 * u, 52 * u, 3); g.fill();
  g.fillStyle = '#2a2d33'; rrect(g, x - 40 * u, y - 46 * u + (open ? 30 * u : 0), 80 * u, 46 * u - (open ? 30 * u : 0), 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { const yy = y - 46 * u + k * 8 * u; if (yy < y) { g.beginPath(); g.moveTo(x - 40 * u, yy); g.lineTo(x + 40 * u, yy); g.stroke(); } }
}
function drawDist(g, t, dt) {
  const L = LAY, u = L.u;
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#120c33'], [.5, '#34205a'], [1, '#1a1426']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(246,240,222,${.18 + .35 * Math.abs(Math.sin(t * 1.1 + i * 1.7))})`; g.fillRect(R(i) * W, R(i + 20) * F(.2), 1.2, 1.2); }
  glow(g, W * .82, F(.02), 46, '220,225,235', .1); g.fillStyle = '#cfd2d8'; g.beginPath(); g.arc(W * .82, F(.02), 9, 0, 6.283); g.fill();
  const Lc = S.loc;
  g.fillStyle = '#21183f';
  for (let i = 0; i < 10 + Lc * 3; i++) { const bw = 16 + R(i) * 28, bh = (L.yB - F(.05)) * (.25 + R(i + 5) * (.25 + Lc * .08)); g.fillRect(R(i + 11) * W - bw / 2, L.yB - bh, bw, bh); }
  if (Lc >= 4) { const tx = W * .6; [-10, 10].forEach(dx => { g.fillStyle = '#151820'; g.beginPath(); g.moveTo(tx + dx - 7, L.yB); g.lineTo(tx + dx - 6, F(.02)); g.lineTo(tx + dx, F(-.06)); g.lineTo(tx + dx + 6, F(.02)); g.lineTo(tx + dx + 7, L.yB); g.closePath(); g.fill(); glow(g, tx + dx, F(-.06), 6, '239,122,85', .6 + .4 * Math.sin(t * 3 + dx)); }); g.fillRect(tx - 5, F(.12), 10, 3); }
  if (Lc === 3 || Lc === 5) { g.strokeStyle = '#1a1d24'; g.lineWidth = 3; for (let k = 0; k < 2; k++) { const cx = W * (.12 + k * .16); g.beginPath(); g.moveTo(cx, L.yB); g.lineTo(cx, F(.04)); g.lineTo(cx + 40, F(.04)); g.moveTo(cx - 10, F(.04)); g.lineTo(cx, F(.04)); g.stroke(); glow(g, cx + 40, F(.04), 5, '255,200,87', .6 + .4 * Math.sin(t * 2 + k)); } }
  // shophouses
  let x = -10, i = 0;
  while (x < W + 10) {
    const bw = 62 * u + R(i + 100) * 34 * u, fl = 2 + (R(i + 200) > .55 ? 1 : 0), bh = fl * 30 * u + 18 * u;
    g.fillStyle = ['#3e8f80', '#c4704f', '#c9a443', '#b65e78', '#6f68b5'][i % 5]; g.fillRect(x, L.yB - bh, bw - 2, bh); g.fillStyle = 'rgba(10,8,30,.38)'; g.fillRect(x, L.yB - bh, bw - 2, bh);
    g.fillStyle = 'rgba(246,240,222,.05)'; g.fillRect(x, L.yB - bh, bw - 2, 3);
    for (let f = 0; f < fl; f++) for (let w = 0; w < 3; w++) {
      const wx = x + 8 * u + w * (bw - 18 * u) / 3, wy = L.yB - bh + 10 * u + f * 30 * u, ww = (bw - 24 * u) / 3 - 2, wh = 15 * u;
      const on = R(i * 13 + f * 5 + w + Math.floor(t / (6 + R(i + w) * 9))) > .45;
      g.fillStyle = on ? `rgba(255,214,150,${.55 + .1 * Math.sin(t * 2 + w)})` : '#13151a'; rrect(g, wx, wy, ww, wh, 2); g.fill();
      if (on) glow(g, wx + ww / 2, wy + wh / 2, 16, '255,214,150', .06);
    }
    g.fillStyle = '#111317'; g.fillRect(x + 4, L.yB - 16 * u, bw - 10, 16 * u);
    if (R(i + 300) > .45) { g.fillStyle = ['#5f9a45', '#a8735d', '#7d8794'][i % 3]; g.globalAlpha = .6; g.fillRect(x + 4, L.yB - 21 * u, bw - 10, 5 * u); g.globalAlpha = 1; }
    x += bw; i++;
  }
  // lanterns
  const ly0 = F(.12);
  g.strokeStyle = 'rgba(246,240,222,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly0); for (let k = 0; k <= 20; k++) g.lineTo(k / 20 * W, ly0 + Math.sin(k / 20 * Math.PI * 3) * 6 + 6); g.stroke();
  for (let k = 1; k < 9; k++) { const lx = k / 9 * W, ly = ly0 + Math.sin(k / 9 * Math.PI * 3) * 6 + 13 + Math.sin(t * 1.5 + k) * 1.5; glow(g, lx, ly, 16, '239,122,85', .2); g.fillStyle = '#c4553f'; g.beginPath(); g.ellipse(lx, ly, 4.5, 5.5, 0, 0, 6.283); g.fill(); g.fillStyle = '#ffc857'; g.fillRect(lx - 2, ly - 7, 4, 1.6); }
  // sidewalk + road
  g.fillStyle = '#4a4058'; g.fillRect(0, L.yB, W, L.walk - L.yB + 8 * u);
  g.strokeStyle = 'rgba(0,0,0,.3)'; for (let xx = 0; xx < W; xx += 24 * u) { g.beginPath(); g.moveTo(xx, L.yB); g.lineTo(xx, L.walk + 8 * u); g.stroke(); }
  g.fillStyle = '#3a3c42'; g.fillRect(0, L.walk + 8 * u, W, 4 * u);
  g.fillStyle = '#211c2e'; g.fillRect(0, L.walk + 12 * u, W, H - L.walk);
  g.fillStyle = 'rgba(246,240,222,.16)'; for (let xx = 0; xx < W; xx += 34 * u) g.fillRect(xx, (L.lane1 + L.lane2) / 2 - 4 * u, 16 * u, 2.5 * u);
  [W * .38, W * .7].forEach(lx => {
    g.strokeStyle = '#2a2c31'; g.lineWidth = 3; g.beginPath(); g.moveTo(lx, L.walk + 8 * u); g.lineTo(lx, F(.22)); g.lineTo(lx + 12, F(.22)); g.stroke();
    g.fillStyle = grad(g, 0, F(.22), 0, H, [[0, 'rgba(255,220,160,.12)'], [1, 'rgba(255,220,160,0)']]);
    g.beginPath(); g.moveTo(lx + 7, F(.23)); g.lineTo(lx + 17, F(.23)); g.lineTo(lx + 64, H); g.lineTo(lx - 40, H); g.closePath(); g.fill(); glow(g, lx + 12, F(.23), 12, '255,220,160', .5);
  });
  garage(g, W * .86, L.walk - 2 * u, u, own('couriers') > 0 && flows.sell > 0);
  stall(g, L.stall.x, L.stall.y, u, t);
  // vehicles
  const selling = flows.sell > 0;
  const nd = own('dealers'), nc = own('couriers');
  for (let k = 0; k < nc; k++) {
    const dir = k % 2 ? -1 : 1;
    if (!selling) { van(g, W * .86 + (k ? -30 : 0) * u, L.walk - 2 * u, u * 1.05, -1, t); continue; }
    const ph = (t * (.05 + k * .012) + k * .5) % 1, vx = dir > 0 ? lerp(-70, W + 70, ph) : lerp(W + 70, -70, ph);
    van(g, vx, dir > 0 ? L.lane2 : L.lane1, u * 1.15, dir, t);
  }
  for (let k = 0; k < nd; k++) {
    const dir = k % 2 ? -1 : 1;
    const SC_COL = ['#e0533f', '#2f86c9', '#e8a92c', '#2aa58a', '#9a6be0'][k];
    if (!selling) { scooter(g, W * .46 + k * 24 * u, L.walk + 2 * u, u * 1.05, 1, t, false, SC_COL); continue; }
    const sp = (.09 + R(k) * .05) * (1 + Math.log10(S.lv.dealers[k] || 1) * .35);
    const ph = (t * sp + k * .27) % 1, vx = dir > 0 ? lerp(-50, W + 50, ph) : lerp(W + 50, -50, ph);
    const vy = (dir > 0 ? L.lane2 : L.lane1) - Math.abs(Math.sin(t * 9 + k)) * .6;
    scooter(g, vx, vy, u * 1.15, dir, t, true, SC_COL);
    if (Math.random() < dt * Math.min(3, .5 + flows.sell * .2)) vis.coins.push({ x: vx, y: vy - 34 * u, vy: -50, life: 1 });
  }
  while (vis.coinBurst > 0) { vis.coinBurst--; vis.coins.push({ x: L.stall.x + (Math.random() - .5) * 60 * u, y: L.stall.y - 50 * u, vy: -70 - Math.random() * 40, life: 1 }); }
  for (let j = vis.coins.length - 1; j >= 0; j--) {
    const c = vis.coins[j]; c.life -= dt; c.y += c.vy * dt; c.vy *= .97;
    if (c.life <= 0) { vis.coins.splice(j, 1); continue; }
    g.globalAlpha = clamp(c.life * 1.5); glow(g, c.x, c.y, 9, '255,200,87', .35);
    g.fillStyle = '#ffc857'; g.beginPath(); g.ellipse(c.x, c.y, 4 * Math.abs(Math.cos(t * 6 + j)) + .7, 4, 0, 0, 6.283); g.fill(); g.globalAlpha = 1;
  }
  if (S.heat > 60) { const a = clamp((S.heat - 60) / 40) * .35, on = Math.sin(t * 12) > 0; glow(g, 0, F(.7), W * .55, on ? '214,72,60' : '60,110,214', a); }
  if (layLow()) { g.fillStyle = 'rgba(5,8,10,.5)'; g.fillRect(0, 0, W, H); g.fillStyle = '#f6f0de'; g.font = `800 ${18 * u}px "Baloo 2",sans-serif`; g.textAlign = 'center'; g.fillText('Zalehnuto, ulice stojí', W / 2, F(.4)); }
}
const DRAW = { farm: drawFarm, proc: drawProc, dist: drawDist };
/* ================= PROFILES & SAVES ================= */
const PK = 'ketum_profiles', LK = 'ketum_last';
let profiles = store.get(PK, []);
let me = null;
const saveKey = id => 'ketum_save_' + id;
function normalize(st) {
  const o = Object.assign(fresh(), st || {});
  o.lv = Object.assign(fresh().lv, (st && st.lv) || {});
  UNITS.forEach(u => { const a = o.lv[u.id]; while (a.length < u.max) a.push(0); a.length = u.max; });
  if (!o.lv.trees[0]) o.lv.trees[0] = 1;
  return o;
}
function legacySave() {
  if (store.get('ketum_legacy_claimed', 0)) return null;
  const v3 = store.get('ketum_v3', null); if (v3) return v3;
  const v2 = store.get('ketum_v2', null);
  if (v2) {
    const st = Object.assign(fresh(), v2); st.lv = fresh().lv;
    UNITS.forEach(u => { const n = v2[u.id] | 0; if (n > 0) { const sl = Math.min(u.max, n); for (let i = 0; i < sl; i++) st.lv[u.id][i] = Math.ceil(n / sl); } delete st[u.id]; });
    return st;
  }
  return null;
}
async function pinHash(pin) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ketum:' + pin));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch (e) { let h = 7; for (const c of 'ketum:' + pin) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h; }
}
function save() {
  if (!me) return;
  S.t = Date.now(); store.set(saveKey(me.id), S);
  const p = profiles.find(x => x.id === me.id);
  if (p) { p.last = Date.now(); p.cash = S.cash; p.loc = S.loc; store.set(PK, profiles); }
}
const initial = n => (n || '?').trim().charAt(0).toUpperCase();

/* ================= LOGIN ================= */
let loginMode = 'list', pinTarget = null, loginOn = false;
function showLogin() {
  loginOn = true; me = null; closeSheet();
  $('app').classList.add('hidden'); $('login').classList.remove('hidden');
  loginMode = profiles.length ? 'list' : 'new'; renderLogin(); sizeLogin();
}
function renderLogin() {
  const list = loginMode === 'list';
  $('lpList').classList.toggle('hidden', !list);
  $('lform').classList.toggle('hidden', list && profiles.length > 0 && loginMode !== 'new' && loginMode !== 'pin');
  $('lerr').textContent = '';
  if (list) {
    $('plist').innerHTML = profiles.slice().sort((a, b) => (b.last || 0) - (a.last || 0)).map(p => `
      <button class="prow" data-p="${p.id}" type="button">
        <span class="avatar" aria-hidden="true">${esc(initial(p.name))}</span>
        <span><b>${esc(p.name)}</b><span>${p.cash != null ? rm(p.cash) + ' · ' : ''}${LOCS[p.loc || 0].n}</span></span>
        ${p.pin ? '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="#f6f0de" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : ''}
      </button>`).join('') + `<button class="ghostbtn" type="button" id="lnew" style="width:100%">Nový šéf</button>`;
    $('lform').classList.add('hidden');
    $('plist').querySelectorAll('[data-p]').forEach(b => b.onclick = () => pickProfile(b.dataset.p));
    $('lnew').onclick = () => { loginMode = 'new'; renderLogin(); $('inName').focus(); };
    return;
  }
  $('lform').classList.remove('hidden');
  const isPin = loginMode === 'pin';
  $('fName').classList.toggle('hidden', isPin);
  $('lformH').textContent = isPin ? `PIN pro ${pinTarget.name}` : 'Nový šéf';
  $('pinHelp').textContent = isPin ? 'Zadej 4 číslice, které sis nastavil.' : '4 číslice. Hodí se, když telefon půjčuješ.';
  document.querySelector('label[for=inPin]').textContent = isPin ? 'PIN' : 'PIN (nepovinný)';
  $('lgo').textContent = isPin ? 'Odemknout' : 'Začít hrát';
  $('lback').classList.toggle('hidden', !profiles.length);
  $('importRow').classList.toggle('hidden', isPin || !legacySave());
  $('inPin').value = ''; if (!isPin) $('inName').value = '';
}
function pickProfile(id) {
  const p = profiles.find(x => x.id === id); if (!p) return;
  if (p.pin) { pinTarget = p; loginMode = 'pin'; renderLogin(); setTimeout(() => $('inPin').focus(), 50); }
  else enter(p);
}
$('lback').onclick = () => { loginMode = 'list'; renderLogin(); };
$('lform').addEventListener('submit', async e => {
  e.preventDefault();
  const pin = $('inPin').value.trim();
  if (loginMode === 'pin') {
    if ((await pinHash(pin)) === pinTarget.pin) enter(pinTarget);
    else { $('lerr').textContent = 'Špatný PIN. Zkus to znovu.'; $('inPin').value = ''; $('inPin').focus(); vib([30, 40, 30]); }
    return;
  }
  const name = $('inName').value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { $('lerr').textContent = 'Jméno musí mít aspoň 2 znaky.'; $('inName').focus(); return; }
  if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) { $('lerr').textContent = 'Tohle jméno už na zařízení existuje. Vyber ho v seznamu.'; return; }
  if (pin && !/^\d{4}$/.test(pin)) { $('lerr').textContent = 'PIN musí mít přesně 4 číslice, nebo ho nech prázdný.'; $('inPin').focus(); return; }
  const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, pin: pin ? await pinHash(pin) : null, created: Date.now(), last: Date.now(), cash: 15, loc: 0 };
  let st = null;
  if (!$('importRow').classList.contains('hidden') && $('inImport').checked) { st = legacySave(); store.set('ketum_legacy_claimed', 1); }
  profiles.push(p); store.set(PK, profiles);
  store.set(saveKey(p.id), normalize(st));
  enter(p);
});
function enter(p) {
  me = p; store.set(LK, p.id);
  S = normalize(store.get(saveKey(p.id), null));
  Object.assign(vis, { treeBorn: Array(own('trees')).fill(0), lvPop: {}, leaves: [], parts: [], bags: [], coins: [], fx: [] });
  loginOn = false;
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  $('avatarBtn').textContent = initial(p.name);
  setTab('farm');
  requestAnimationFrame(() => { resize(); offline(); render(true); });
}
function logout() { save(); store.del(LK); showLogin(); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* login background: a dusk orchard */
const lcv = $('lcv'), lg = lcv.getContext('2d'); let LW = 0, LH = 0;
function sizeLogin() { LW = innerWidth; LH = innerHeight; const d = Math.min(devicePixelRatio || 1, 2); lcv.width = LW * d; lcv.height = LH * d; lg.setTransform(d, 0, 0, d, 0, 0); }
function drawLogin(t) {
  const g = lg, W = LW, H = LH;
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#1b1440'], [.32, '#7a3a6a'], [.5, '#e0784e'], [.62, '#2a3a2e'], [1, '#0f1a1c']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(246,240,222,${.15 + .35 * Math.abs(Math.sin(t * 1.2 + i * 2.3))})`; g.fillRect(R(i) * W, R(i + 40) * H * .4, 1.3, 1.3); }
  glow(g, W * .7, H * .38, 120, '255,190,110', .45); g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(W * .7, H * .38, 30, 0, 6.283); g.fill();
  hills(g, W, H, H * .40, 24, '#2c4a3a', 1); hills(g, W, H, H * .46, 16, '#1b3328', 2.6);
  const u = Math.min(W / 390, H / 800) * 1.9;
  [[.18, .52, .9], [.5, .5, 1.1], [.84, .53, .85]].forEach(([x, y, s], i) => tree(g, W * x, H * y, u * s, 0, i + 5, t, .75, .7));
  for (let i = 0; i < 10; i++) { const fx = (R(i + 9) * W + Math.sin(t * .4 + i) * 40) % W, fy = H * (.3 + R(i + 3) * .3) + Math.cos(t * .7 + i) * 10; glow(g, fx, fy, 7, '214,230,160', .3 + .3 * Math.sin(t * 3 + i * 2)); }
  g.fillStyle = grad(g, 0, H * .45, 0, H, [[0, 'rgba(15,26,28,0)'], [.35, 'rgba(15,26,28,.85)'], [1, '#0f1a1c']]); g.fillRect(0, H * .45, W, H * .55);
}

/* ================= STAGE / LAYOUT ================= */
const cv = $('cv'), g0 = cv.getContext('2d');
let W = 0, H = 0, dpr = 1, TOP = 120, layKey = '', LAY = null;
function resize() {
  const r = $('stage').getBoundingClientRect(); if (!r.width) return;
  W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const inv = $('inv').getBoundingClientRect();
  TOP = Math.max(140, inv.bottom - r.top + 44); // leaves a row for the event ribbon
  layKey = '';
}
const F = fy => TOP + fy * (H - TOP - 12);
function computeLayout() {
  const u = Math.min(W / 390, (H - TOP) / 600);
  const L = { u, objs: [], pills: [] };
  if (tab === 'farm') {
    const tp = [[.27, .43], [.73, .41], [.25, .70], [.71, .68]];
    L.trees = tp.map(([x, y], i) => {
      const Lv = S.lv.trees[i] || 1;
      return { x: W * x, y: F(y), s: u * 1.85 * (.9 + Math.min(.45, Math.log10(Lv) * .25)) };
    });
    L.racks = [.19, .5, .81].map(x => ({ x: W * x, y: F(.915), w: Math.min(W * .27, 130 * u) }));
    L.shed = { x: W * .86, y: F(.12) };
    L.trees.forEach((o, i) => {
      if (S.lv.trees[i]) { L.objs.push({ k: 'tree', i, x: o.x - 44 * o.s, y: o.y - 80 * o.s, w: 88 * o.s, h: 82 * o.s }); L.pills.push({ key: 'trees' + i, kind: 'slot', id: 'trees', i, x: o.x, y: o.y + 8, a: 'top' }); }
      else if (i === own('trees')) L.pills.push({ key: 'trees' + i, kind: 'ghost', id: 'trees', i, x: o.x, y: o.y - 18, a: 'bottom' });
    });
    L.racks.forEach((o, i) => {
      if (S.lv.racks[i]) { L.objs.push({ k: 'rack', i, x: o.x - o.w / 2, y: o.y - 40 * u, w: o.w, h: 44 * u }); L.pills.push({ key: 'racks' + i, kind: 'slot', id: 'racks', i, x: o.x, y: o.y - 40 * u, a: 'bottom', sm: true }); }
      else if (i === own('racks')) L.pills.push({ key: 'racks' + i, kind: 'ghost', id: 'racks', i, x: o.x, y: o.y - 38 * u, a: 'bottom', sm: true, nolbl: i === 2 });
    });
    L.tarp = { x: W * .44, y: F(.25), w: 88 * u };
    L.objs.push({ k: 'tarp', x: L.tarp.x - 50 * u, y: L.tarp.y - 30 * u, w: 100 * u, h: 44 * u });
    L.objs.push({ k: 'shed', x: L.shed.x - 34 * u, y: L.shed.y - 46 * u, w: 68 * u, h: 50 * u });
    L.pills.push({ key: 'pickers', kind: 'hub', id: 'pickers', x: L.shed.x, y: L.shed.y + 8, a: 'top' });
  } else if (tab === 'proc') {
    L.bench = F(.50);
    L.grind = [.27, .71].map(x => ({ x: W * x, y: L.bench, s: u * 1.15 }));
    L.belt = { x0: W * .06, x1: W * .78, y: F(.80) };
    L.crate = { x: W * .89, y: F(.90) };
    L.grind.forEach((o, i) => {
      if (S.lv.grinders[i]) { L.objs.push({ k: 'grind', i, x: o.x - 60 * o.s, y: o.y - 110 * o.s, w: 120 * o.s, h: 112 * o.s }); L.pills.push({ key: 'grinders' + i, kind: 'slot', id: 'grinders', i, x: o.x, y: o.y + 10, a: 'top' }); }
      else if (i === own('grinders')) L.pills.push({ key: 'grinders' + i, kind: 'ghost', id: 'grinders', i, x: o.x, y: o.y - 40 * o.s, a: 'bottom' });
    });
    L.mortar = { x: W * .49, y: L.bench, s: u };
    L.objs.push({ k: 'mortar', x: L.mortar.x - 26 * u, y: L.bench - 44 * u, w: 52 * u, h: 46 * u });
    L.objs.push({ k: 'belt', x: L.belt.x0, y: L.belt.y - 50 * u, w: L.belt.x1 - L.belt.x0, h: 70 * u });
    L.objs.push({ k: 'belt', x: L.crate.x - 40 * u, y: L.crate.y - 60 * u, w: 80 * u, h: 64 * u });
    L.pills.push({ key: 'packers', kind: 'hub', id: 'packers', x: (L.belt.x0 + L.belt.x1) / 2, y: L.belt.y + 26 * u, a: 'top' });
  } else if (tab === 'dist') {
    L.yB = F(.50); L.walk = F(.58); L.lane1 = F(.75); L.lane2 = F(.93);
    L.stall = { x: W * .19, y: L.walk };
    L.objs.push({ k: 'stall', x: L.stall.x - 52 * u, y: L.stall.y - 100 * u, w: 104 * u, h: 104 * u });
    L.pills.push({ key: 'dealers', kind: 'hub', id: 'dealers', x: W * .28, y: L.walk + 20 * u, a: 'top' });
    L.pills.push({ key: 'couriers', kind: 'hub', id: 'couriers', x: W * .76, y: L.walk + 20 * u, a: 'top' });
  }
  return L;
}
function hubLabel(id) { return { pickers: 'Sběrači', packers: 'Baliči', dealers: 'Dealeři', couriers: 'Kurýři' }[id]; }
function ghostLabel(id) { return { trees: 'Strom', racks: 'Lísa', grinders: 'Drtička' }[id]; }
const COIN = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.6" fill="#ffc857" stroke="#7a5208" stroke-width="1.4"/><path d="M8 4.8v6.4" stroke="#7a5208" stroke-width="1.4" stroke-linecap="round"/></svg>';
const PLUS = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M7 2v10M2 7h10"/></svg>';
function buildPills() {
  const hot = $('hot'); hot.innerHTML = '';
  for (const p of LAY.pills) {
    const b = document.createElement('button');
    b.className = 'pill ' + p.kind + (p.sm ? ' sm' : '') + (p.nolbl ? ' nolbl' : ''); b.dataset.key = p.key;
    if (p.kind === 'hub') b.innerHTML = `<span class="ico"><svg viewBox="0 0 24 24">${ICON[p.id]}</svg></span><span>${hubLabel(p.id)} <small></small></span><i class="dot"></i>`;
    else if (p.kind === 'ghost') b.innerHTML = `<span class="plus">${PLUS}</span><span>${ghostLabel(p.id)}</span><span class="cost">${COIN}<b></b></span>`;
    else b.innerHTML = `<span class="lv"></span><span class="cost">${COIN}<b></b></span>`;
    b.setAttribute('aria-label', p.kind === 'hub' ? hubLabel(p.id) : p.kind === 'ghost' ? 'Odemknout: ' + ghostLabel(p.id) : `${UBY[p.id].unit} ${p.i + 1}: vylepšit`);
    b.addEventListener('click', () => pillTap(p, b));
    hot.appendChild(b); p.el = b;
  }
  if (tab === 'proc') {
    const bg = document.createElement('div'); bg.id = 'bags';
    bg.innerHTML = [25, 50, 100].map(sz => `<button data-b="${sz}" aria-label="Balit po ${sz} g"><svg viewBox="0 0 20 24" width="${14 + sz / 12}" height="${17 + sz / 10}"><path d="M3 4h14l1 18H2z" fill="#ecebe7"/><rect x="5" y="10" width="10" height="7" rx="1.5" fill="#a5a07c"/><rect x="3" y="4" width="14" height="2" fill="#5f9a45"/></svg>${sz} g<small></small></button>`).join('');
    bg.style.left = '12px'; bg.style.top = (TOP + 2) + 'px';
    bg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.bag = +b.dataset.b; vib(6); render(true); });
    hot.appendChild(bg);
  }
  placePills(true);
  requestAnimationFrame(() => LAY && LAY.pills.forEach(p => p.el && (p.el.style.transition = '')));
}
function placePills(initial) {
  for (const p of LAY.pills) {
    const el = p.el, w = el.offsetWidth, h = el.offsetHeight;
    if (initial) el.style.transition = 'none';
    const x = clamp(p.x - w / 2, 6, W - w - 6), y = p.a === 'bottom' ? p.y - h : p.y;
    el.style.setProperty('--pos', `translate(${Math.round(x)}px,${Math.round(y)}px)`);
    el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  }
}
function pillTap(p, el) {
  if (p.kind === 'hub') { openSheet(p.id); return; }
  const ok = slotAction(UBY[p.id], p.i);
  if (ok) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
function updatePills(neck) {
  if (!LAY) return;
  let relayout = false;
  for (const p of LAY.pills) {
    const el = p.el, u = UBY[p.id];
    if (p.kind === 'hub') {
      const o = own(p.id);
      el.querySelector('small').textContent = `${o}/${u.max}`;
      el.classList.toggle('can', hubAffordable(p.id));
      el.classList.toggle('neck', neck === p.id);
    } else if (p.kind === 'ghost') {
      const c = unlockCost(u, p.i), t = '$' + fmt(c);
      const bt = el.querySelector('b'); if (bt.textContent !== t) { bt.textContent = t; relayout = true; }
      el.classList.toggle('ok', c <= S.cash);
    } else {
      const L = S.lv[p.id][p.i], n = buyAmt === 'max' ? Math.max(1, lvMax(u, L)) : buyAmt, c = lvCost(u, L, n);
      const lv = el.querySelector('.lv'), bt = el.querySelector('b');
      const lt = 'Lv' + L, ct = (n > 1 ? '+' + n + ' · ' : '') + fmt(c);
      if (lv.textContent !== lt) { lv.textContent = lt; relayout = true; }
      if (bt.textContent !== ct) { bt.textContent = ct; relayout = true; }
      el.classList.toggle('ok', c <= S.cash);
      el.classList.toggle('neck', neck === p.id && p.i === 0);
    }
  }
  if (relayout) placePills();
  const bg = $('bags');
  if (bg) bg.querySelectorAll('button').forEach(b => { const sz = +b.dataset.b; b.classList.toggle('on', sz === S.bag); b.querySelector('small').textContent = '$' + fmt(bagPrice(sz)); });
}
const HINTS = {
  harvest: { tab: 'farm', text: 'Ťukni na strom: sklizeň', at: () => { const o = LAY.objs.find(x => x.k === 'tree'); return o && [o.x + o.w / 2, o.y + 6]; } },
  dry: { tab: 'farm', text: 'Ťukni na plachtu: sušení', at: () => { const o = LAY.objs.find(x => x.k === 'tarp'); return o && [o.x + o.w / 2, o.y - 4]; } },
  grind: { tab: 'proc', text: 'Ťukni na hmoždíř: drcení', at: () => { const o = LAY.objs.find(x => x.k === 'mortar'); return o && [o.x + o.w / 2, o.y - 4]; } },
  pack: { tab: 'proc', text: 'Ťukni na pás: balení', at: () => { const o = LAY.objs.find(x => x.k === 'belt'); return o && [o.x + o.w / 2, o.y + 6]; } },
  sell: { tab: 'dist', text: 'Ťukni na stánek: prodej', at: () => { const o = LAY.objs.find(x => x.k === 'stall'); return o && [o.x + o.w / 2, o.y - 22]; } }
};
const TAB_NAME = { farm: 'Sad', proc: 'Dílna', dist: 'Ulice' };
function nextNeed() {
  if (bagsTotal() >= 1) return 'sell';
  if (S.powder >= S.bag / 1000) return 'pack';
  if (S.dry > .005) return 'grind';
  if (S.fresh > .005) return 'dry';
  return 'harvest';
}
function updateHint() {
  const el = $('hint');
  if (!S.tutDone && (S.total >= 250 || own('dealers') > 0)) { S.tutDone = 1; save(); }
  if (S.tutDone || tab === 'emp' || !LAY) { el.className = ''; return; }
  const H0 = HINTS[nextNeed()];
  if (H0.tab !== tab) {
    const b = document.querySelector(`#nav button[data-v="${H0.tab}"]`).getBoundingClientRect(), st = $('stage').getBoundingClientRect();
    el.textContent = `Pokračuj: ${TAB_NAME[H0.tab]}`; el.className = 'on down';
    el.style.transform = `translate(${Math.round(clamp(b.left + b.width / 2 - st.left, 70, W - 70))}px,${Math.round(H - 10)}px) translate(-50%,-100%)`;
    return;
  }
  const p = H0.at(); if (!p) { el.className = ''; return; }
  el.textContent = H0.text; el.className = 'on';
  el.style.transform = `translate(${Math.round(clamp(p[0], 90, W - 90))}px,${Math.round(p[1])}px) translate(-50%,-100%)`;
}
function hubAffordable(id) {
  const u = UBY[id], o = own(id);
  if (o < u.max && unlockCost(u, o) <= S.cash) return true;
  return S.lv[id].some(L => L > 0 && lvCost(u, L, 1) <= S.cash);
}

/* ================= ACTIONS ================= */
function slotAction(u, i) {
  const L = S.lv[u.id][i];
  if (!L) {
    if (i !== own(u.id)) return false;
    const c = unlockCost(u, i);
    if (c > S.cash) { toast(`Chybí ${rm(c - S.cash)}`); vib(4); return false; }
    S.cash -= c; S.lv[u.id][i] = 1;
    if (u.id === 'trees') vis.treeBorn[i] = performance.now();
    vis.lvPop[u.id + i] = performance.now();
    toast(`${u.unit} ${i + 1} je tvůj`); vib([10, 20, 10]); layKey = ''; render(true); save(); return true;
  }
  const n = buyAmt === 'max' ? lvMax(u, L) : buyAmt;
  const c = lvCost(u, L, Math.max(1, n));
  if (n < 1 || c > S.cash) { toast(`Chybí ${rm(c - S.cash)}`); vib(4); return false; }
  S.cash -= c; S.lv[u.id][i] = L + n;
  if (Math.floor((L + n) / MS) > Math.floor(L / MS)) toast(`${u.unit} ${i + 1}: Lv ${Math.floor((L + n) / MS) * MS}, rychlost +75 %`);
  vis.lvPop[u.id + i] = performance.now();
  if (u.id === 'trees') layKey = '';
  vib(8); render(true); save(); return true;
}
function manual(o, ev) {
  const h = handMult(); let txt = '', cls = 'l';
  const fail = m => { floater(ev.clientX, ev.clientY, m, 'b'); vib(3); };
  if (o.k === 'tree') {
    const T = LAY.trees[o.i];
    if (S.onTree >= .01) {
      const a = Math.min(h, S.onTree); S.onTree -= a; S.fresh += a; txt = '+' + kg(a) + ' listí';
      for (let k = 0; k < 8; k++) vis.leaves.push({ x: T.x + (Math.random() - .5) * 60 * T.s, y: T.y - 50 * T.s, vy: -60 - Math.random() * 60, vx: (Math.random() - .5) * 120, ph: Math.random() * 6, life: 1.2, burst: 1 });
      vis.treeHit = { i: o.i, t: performance.now() };
    } else {
      const gr = Math.min(Math.max(1, caps().grow * 4) * Math.sqrt(h), cap() - S.onTree);
      if (gr <= 0) return fail('Stromy jsou plné');
      S.onTree += gr; txt = 'Zalito +' + kg(gr); vis.water = performance.now();
      for (let k = 0; k < 10; k++) vis.fx.push({ x: T.x + (Math.random() - .5) * 40, y: T.y - 90 * T.s, vx: (Math.random() - .5) * 30, vy: 40 + Math.random() * 60, life: .7, c: '#8ec8e8', s: 2.4 });
    }
  } else if (o.k === 'shed') { openSheet('pickers'); return; }
  else if (o.k === 'rack' || o.k === 'tarp') {
    const a = Math.min(h, S.fresh); if (a <= 0) return fail('Chybí čerstvé listí, sklízej stromy');
    S.fresh -= a; S.dry += a / 2; txt = '+' + kg(a / 2) + ' suché'; vis.tarpKick = performance.now();
  } else if (o.k === 'grind' || o.k === 'mortar') {
    const a = Math.min(.5 * h, S.dry); if (a <= 0) return fail('Chybí suché listí');
    S.dry -= a; S.powder += a; txt = '+' + kg(a) + ' prášku'; vis.grindKick = performance.now(); if (o.k === 'mortar') vis.mortarKick = performance.now();
  } else if (o.k === 'belt') {
    const n = Math.floor(Math.min(4 * h, S.powder / (S.bag / 1000)));
    if (n < 1) return fail(`Málo prášku na ${S.bag} g`);
    S.powder -= n * S.bag / 1000; S['b' + S.bag] += n; txt = `+${fint(n)}× ${S.bag} g`; vis.spawnBag += Math.min(3, n);
  } else if (o.k === 'stall') {
    if (layLow()) return fail('Zalehnuto, teď neprodávej');
    const r = sellBags(Math.min(4 * h, bagsTotal()));
    if (!r.sold) return fail('Nemáš zabalené sáčky');
    txt = '+' + rm(r.earn); cls = 'g'; S.heat += .5 * heatMult(); bumpCash(); vis.coinBurst += 6;
    if (S.heat >= 100) raid();
  }
  S.taps++; floater(ev.clientX, ev.clientY, txt, cls); vib(5); render(true);
}
function buyUpg(id) {
  const up = UPG.find(x => x.id === id);
  if (!up || S.upg[id]) return;
  if (S.cash < up.cost) { toast(`Chybí ${rm(up.cost - S.cash)}`); return; }
  S.cash -= up.cost; S.upg[id] = 1; vib(12); toast(up.name + ' koupeno'); buildEmp(); render(true); save();
}
function buyLoc(i) {
  const L = LOCS[i];
  if (i !== S.loc + 1) return;
  if (S.cash < L.cost) { toast(`Chybí ${rm(L.cost - S.cash)}`); return; }
  S.cash -= L.cost; S.loc = i; S.heat = 0; vib([20, 30, 20]);
  modal(`<h2>${L.n}</h2><p>${L.d}</p><div class="big" style="color:var(--leaf)">×${L.mult}</div><p>Produkce ×${L.mult}, cena ${pct(L.price)}. Policie je tu ostřejší (${pct(L.heat)}).</p><button class="cta ok" data-close>Jdeme na to</button>`);
  buildEmp(); render(true); save();
}
function layLowNow() {
  const now = Date.now();
  if (layLow()) { toast(`Zalehnuto ještě ${Math.ceil((S.layUntil - now) / 1000)} s`); return; }
  if (now < S.layCd) { toast(`Znovu za ${Math.ceil((S.layCd - now) / 1000)} s`); return; }
  S.layUntil = now + 30e3; S.layCd = now + 90e3; vib(10); toast('Zalehnuto na 30 s, heat rychle klesá'); render(true);
}

/* ================= SHEET ================= */
let sheetId = null;
function openSheet(id) {
  sheetId = id; const u = UBY[id];
  const desc = { pickers: 'Chodí ke stromům a nosí listí na lísy.', packers: 'Plní sáčky na pásu.', dealers: 'Rozváží sáčky po městě na skútrech.', couriers: 'Velké zásilky dodávkou, o 70 % méně heatu.' }[id];
  $('sheetBody').innerHTML = `
    <div class="sh-h"><div class="ui"><svg viewBox="0 0 24 24">${ICON[id]}</svg></div><div><h3>${hubLabel(id)}</h3><p>${desc}</p></div><div class="rate" id="shRate"></div></div>
    ${Array.from({ length: u.max }, (_, i) => `<div class="slotrow" id="sr${i}"><div class="lvb"></div><div class="st"><b>${u.unit} ${i + 1}</b><span></span><div class="bar"><i></i></div></div><button class="cta" data-i="${i}"></button></div>`).join('')}
    <p class="sh-note">Každých ${MS} levelů +75 % rychlosti. Množství přepneš tlačítkem ×1 ve scéně.</p>`;
  $('sheetBody').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (slotAction(u, +b.dataset.i)) updateSheet(); });
  $('scrim').classList.add('on'); $('sheet').classList.add('on'); updateSheet();
}
function updateSheet() {
  if (!sheetId) return;
  const id = sheetId, u = UBY[id], o = own(id);
  $('shRate').textContent = fmt(unitRate(id)) + ' ' + u.ru;
  for (let i = 0; i < u.max; i++) {
    const row = $('sr' + i), L = S.lv[id][i], btn = row.querySelector('button'), sp = row.querySelector('span'), lvb = row.querySelector('.lvb'), bar = row.querySelector('.bar');
    if (L) {
      const n = buyAmt === 'max' ? Math.max(1, lvMax(u, L)) : buyAmt, c = lvCost(u, L, n);
      row.className = 'slotrow'; lvb.innerHTML = `${L}<small>Lv</small>`;
      sp.textContent = `${fmt(slotRate(id, L))} ${u.ru} · ${L % MS}/${MS} do bonusu`; bar.style.display = ''; bar.firstChild.style.width = (L % MS) / MS * 100 + '%';
      btn.innerHTML = `<small>+${n}</small>${COIN}${fmt(c)}`; btn.classList.toggle('ok', c <= S.cash); btn.disabled = false;
    } else if (i === o) {
      const c = unlockCost(u, i);
      row.className = 'slotrow locked'; lvb.innerHTML = PLUS; sp.textContent = 'Volné místo · Lv 1'; bar.style.display = 'none';
      btn.innerHTML = `${COIN}${fmt(c)}`; btn.classList.toggle('ok', c <= S.cash); btn.disabled = false;
    } else {
      row.className = 'slotrow locked off'; lvb.innerHTML = PLUS; sp.textContent = 'Nejdřív předchozí místo'; bar.style.display = 'none';
      btn.textContent = 'Zamčeno'; btn.classList.remove('ok'); btn.disabled = true;
    }
  }
}
function closeSheet() { sheetId = null; $('scrim').classList.remove('on'); $('sheet').classList.remove('on'); }
$('scrim').onclick = closeSheet;
(() => { // drag sheet down to dismiss
  let y0 = null, dy = 0; const sh = $('sheet');
  sh.addEventListener('pointerdown', e => { if (sh.scrollTop > 0 || e.target.closest('button')) return; y0 = e.clientY; dy = 0; sh.style.transition = 'none'; });
  addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  addEventListener('pointerup', () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 90) closeSheet(); y0 = null; });
})();

/* ================= EMPIRE SCREEN ================= */
const UPG_ICON = {
  price: '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
  heat: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 14a1.5 1.5 0 0 1 2.5-1.7L8 15"/>',
  cap: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>'
};
const PIN_XY = [[72, 52], [80, 112], [156, 62], [40, 80], [100, 196], [170, 276]];
const PIN_LBL = [[10, 4, 'start'], [10, 4, 'start'], [0, 22, 'middle'], [10, 4, 'start'], [10, 4, 'start'], [-12, 4, 'end']];
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
function buildEmp() {
  if (tab !== 'emp' || !me) return;
  const next = LOCS[S.loc + 1];
  const route = PIN_XY.map(p => p.join(',')).join(' ');
  const pins = LOCS.map((L, i) => {
    const [x, y] = PIN_XY[i], cur = i === S.loc, done = i < S.loc, nx = i === S.loc + 1;
    const fill = cur ? '#ffc857' : done ? '#9ad672' : 'rgba(246,240,222,.18)';
    return `<g>${cur ? `<circle cx="${x}" cy="${y}" r="14" fill="#ffc857" opacity=".25"><animate attributeName="r" values="9;16;9" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0;.35" dur="2.4s" repeatCount="indefinite"/></circle>` : ''}
      <circle cx="${x}" cy="${y}" r="${cur ? 8 : 6}" fill="${fill}" stroke="${nx ? '#ffc857' : '#0f1a1c'}" stroke-width="${nx ? 2 : 2}" ${nx ? 'stroke-dasharray="3 2"' : ''}/>
      <text x="${x + PIN_LBL[i][0]}" y="${y + PIN_LBL[i][1]}" text-anchor="${PIN_LBL[i][2]}" font-family="Baloo 2,sans-serif" font-weight="${cur ? 800 : 600}" font-size="${cur ? 13 : 11}" fill="${i <= S.loc + 1 ? '#f6f0de' : 'rgba(246,240,222,.4)'}">${L.n}</text></g>`;
  }).join('');
  const open = UPG.filter(u => !S.upg[u.id]).slice(0, 12);
  const doneN = UPG.length - UPG.filter(u => !S.upg[u.id]).length;
  const units = UNITS.reduce((a, u) => a + lvSum(u.id), 0);
  const stats = [['Celkem vyděláno', rm(S.total)], ['Prodáno', kg(S.sold)], ['Sáčků prodáno', fint(S.bagsSold)], ['Levelů celkem', fmt(units)], ['Vylepšení', `${doneN}/${UPG.length}`], ['Razie', S.raids], ['Ruční akce', fmt(S.taps)], ['Hraješ', fmtTime(Date.now() - S.start)]];
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  $('emp').innerHTML = `
    <div class="prof"><div class="avatar" aria-hidden="true">${esc(initial(me.name))}</div><div class="grow"><b>${esc(me.name)}</b><span>${LOCS[S.loc].n} · ${fmtTime(Date.now() - S.start)} ve hře</span></div><button class="ghostbtn" id="logoutBtn">Odhlásit</button></div>
    <h2>Mapa impéria</h2>
    <div class="mapwrap"><svg viewBox="0 0 240 300" role="img" aria-label="Mapa Malajsie s tvými lokacemi">
      <defs><pattern id="wv" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 5q4-3 8 0t8 0" fill="none" stroke="rgba(246,240,222,.06)" stroke-width="1"/></pattern></defs>
      <rect width="240" height="300" fill="url(#wv)"/>
      <path d="M58 22C86 12 124 16 152 22c20 4 34 20 32 42-3 22-14 38-17 58-3 25 5 50 13 80 8 30 14 55 4 75-10 18-32 18-42 6-12-18-22-40-35-58C93 205 81 191 73 171c-10-24-14-50-18-72-4-20-14-38-12-56 2-14 8-19 15-21z" fill="#1d3b2f" stroke="rgba(154,214,114,.35)" stroke-width="1.5"/>
      <path d="M40 22h170" stroke="rgba(246,240,222,.2)" stroke-dasharray="4 4"/><text x="206" y="16" text-anchor="end" font-family="Baloo 2,sans-serif" font-size="9" fill="rgba(246,240,222,.4)">Thajsko</text>
      <polyline points="${route}" fill="none" stroke="rgba(255,200,87,.35)" stroke-width="1.5" stroke-dasharray="3 4"/>
      ${pins}
    </svg></div>
    ${next ? `<div class="loccard"><h3>Další: ${next.n}</h3><p>${next.d}</p>
      <div class="stats3"><span>Produkce <b>×${next.mult}</b></span><span>Cena <b>${pct(next.price)}</b></span><span>Policie <b>${pct(next.heat)}</b></span></div>
      <button class="cta${S.cash >= next.cost ? ' ok' : ''}" id="locBtn">Expandovat ${COIN}${fmt(next.cost)}</button></div>`
      : `<div class="loccard"><h3>Ovládáš celou Malajsii</h3><p>Johor Bahru je tvoje. Vylepšuj dál a sleduj, jak čísla rostou.</p></div>`}
    <h2>Vylepšení</h2>
    ${open.map(u => `<div class="upg"><div class="ui"><svg viewBox="0 0 24 24">${u.kind === 'unit' ? ICON[u.t] : UPG_ICON[u.kind]}</svg></div><div class="ut"><b>${u.name}</b><span>${u.desc}</span></div><button class="cta${S.cash >= u.cost ? ' ok' : ''}" data-u="${u.id}">${COIN}${fmt(u.cost)}</button></div>`).join('') || '<p class="sh-note">Všechno vylepšeno.</p>'}
    <h2>Statistiky</h2>
    <div class="statgrid">${stats.map(([a, b]) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`).join('')}</div>
    ${!standalone ? `<h2>Aplikace</h2><div class="loccard"><p>${deferredInstall ? 'Přidej hru na plochu a hraj na celou obrazovku i offline.' : 'Na iPhonu: Sdílet → Přidat na plochu. Na Androidu: menu prohlížeče → Instalovat aplikaci.'}</p>${deferredInstall ? '<button class="cta ok" id="installBtn">Nainstalovat aplikaci</button>' : ''}</div>` : ''}
    <button class="danger" id="resetBtn">Smazat postup profilu ${esc(me.name)}</button>`;
  $('logoutBtn').onclick = logout;
  if ($('locBtn')) $('locBtn').onclick = () => buyLoc(S.loc + 1);
  $('emp').querySelectorAll('[data-u]').forEach(b => b.onclick = () => buyUpg(b.dataset.u));
  if ($('installBtn')) $('installBtn').onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; buildEmp(); };
  let armed = 0;
  $('resetBtn').onclick = () => {
    if (Date.now() - armed < 3000) { S = normalize(null); vis.treeBorn = [0]; save(); toast('Postup smazán'); setTab('farm'); return; }
    armed = Date.now(); $('resetBtn').textContent = 'Ťukni znovu pro potvrzení';
  };
}
function updateEmp() {
  if (tab !== 'emp') return;
  $('emp').querySelectorAll('[data-u]').forEach(b => { const u = UPG.find(x => x.id === b.dataset.u); b.classList.toggle('ok', S.cash >= u.cost); });
  const lb = $('locBtn'); if (lb) lb.classList.toggle('ok', S.cash >= LOCS[S.loc + 1].cost);
}

/* ================= TABS ================= */
function setTab(t) {
  tab = t; closeSheet();
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  $('emp').classList.toggle('hidden', t !== 'emp');
  ['hud', 'inv', 'ribbon', 'amt', 'hot'].forEach(id => $(id).classList.toggle('hidden', t === 'emp'));
  if (t === 'emp') { buildEmp(); $('emp').scrollTop = 0; }
  layKey = ''; render(true);
}
$('nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { setTab(b.dataset.v); vib(4); } });
$('avatarBtn').onclick = () => setTab('emp');
$('heatBtn').onclick = layLowNow;
$('amt').onclick = () => {
  const seq = [1, 10, 100, 'max']; buyAmt = seq[(seq.indexOf(buyAmt) + 1) % seq.length];
  $('amt').innerHTML = (buyAmt === 'max' ? 'MAX' : '×' + buyAmt) + '<small>levely</small>'; vib(4); render(true);
};
$('stage').addEventListener('pointerdown', e => {
  if (e.target !== cv || !LAY || tab === 'emp') return;
  initPressed = true;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  for (let k = LAY.objs.length - 1; k >= 0; k--) { const o = LAY.objs[k]; if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) { manual(o, e); return; } }
});
let initPressed = false;

/* ================= HUD RENDER ================= */
const ICO_LEAF = '<svg viewBox="0 0 14 14"><path d="M2 12c0-6 4-10 10-10-1 6-4 10-10 10z" fill="#9ad672"/></svg>';
const ICO_DRY = '<svg viewBox="0 0 14 14"><path d="M2 12c0-6 4-10 10-10-1 6-4 10-10 10z" fill="#b39466"/></svg>';
const ICO_POW = '<svg viewBox="0 0 14 14"><path d="M2 11q5-8 10 0z" fill="#b6ae86"/></svg>';
const ICO_BAG = '<svg viewBox="0 0 14 14"><path d="M3 3h8l.6 9H2.4z" fill="#ecebe7"/><rect x="3" y="3" width="8" height="1.4" fill="#5f9a45"/></svg>';
let lastSlow = 0, invKey = '';
function render(force) {
  if (!me) return;
  const now = Date.now();
  $('cashV').textContent = fmt(S.cash);
  $('ips').textContent = `+${rm(ipsEma)}/s` + (layLow() ? ' · zalehnuto' : '');
  const h = Math.min(100, S.heat);
  $('heatArc').setAttribute('stroke-dashoffset', String(88 - 88 * h / 100));
  $('heatArc').setAttribute('stroke', h > 75 ? '#ef7a55' : h > 45 ? '#ffc857' : '#9ad672');
  $('heatT').textContent = `Heat ${Math.round(h)} %`;
  $('heatS').textContent = layLow() ? `zalehnuto ${Math.ceil((S.layUntil - now) / 1000)} s` : now < S.layCd ? `znovu za ${Math.ceil((S.layCd - now) / 1000)} s` : 'ťukni = zalehnout';
  // inventory chips per scene
  let inv = '';
  if (tab === 'farm') inv = `<div class="chip"><i style="background:#1d3b2f">${ICO_LEAF}</i>${kg(S.onTree)}<span>strom</span></div><div class="chip"><i style="background:#1d3b2f">${ICO_LEAF}</i>${kg(S.fresh)}<span>čerstvé</span></div><div class="chip"><i style="background:#3a2e1f">${ICO_DRY}</i>${kg(S.dry)}<span>suché</span></div>`;
  else if (tab === 'proc') inv = `<div class="chip"><i style="background:#3a2e1f">${ICO_DRY}</i>${kg(S.dry)}<span>suché</span></div><div class="chip"><i style="background:#3a3524">${ICO_POW}</i>${kg(S.powder)}<span>prášek</span></div><div class="chip"><i style="background:#2b3a36">${ICO_BAG}</i>${fint(bagsTotal())}<span>sáčků</span></div>`;
  else if (tab === 'dist') inv = `<div class="chip"><i style="background:#2b3a36">${ICO_BAG}</i>${fint(S.b25)}×<span>25 g</span></div><div class="chip"><i style="background:#2b3a36">${ICO_BAG}</i>${fint(S.b50)}×<span>50 g</span></div><div class="chip"><i style="background:#2b3a36">${ICO_BAG}</i>${fint(S.b100)}×<span>100 g</span></div>`;
  if (inv !== invKey) { $('inv').innerHTML = inv; invKey = inv; }
  // event ribbon
  const rb = $('ribbon');
  if (S.ev && now < S.ev.until) { const E = EVENTS.find(x => x.id === S.ev.id); rb.className = 'on ' + E.cls; rb.textContent = `${E.txt} · ${Math.ceil((S.ev.until - now) / 1000)} s`; }
  else rb.className = '';
  // layout + pills
  if (tab !== 'emp' && W) {
    const k = [tab, W, H, TOP, ...UNITS.map(u => own(u.id)), S.lv.trees.join('.')].join('|');
    if (k !== layKey) { layKey = k; LAY = computeLayout(); buildPills(); }
    const c = caps(), sz = S.bag / 1000;
    let neck = null;
    if (own('dealers') + own('couriers') > 0) {
      const eq = { trees: c.grow / 2, pickers: c.pick / 2, racks: c.dry / 2, grinders: c.grind, packers: c.pack * sz, dealers: c.sell * sz };
      neck = Object.keys(eq).reduce((a, k2) => eq[k2] < eq[a] ? k2 : a, 'dealers');
      if (eq[neck] >= eq.dealers * .98) neck = null;
    }
    updatePills(neck);
  }
  updateHint();
  updateSheet();
  if (force || now - lastSlow > 1000) {
    lastSlow = now; updateEmp();
    $('empDot').classList.toggle('on', UPG.some(u => !S.upg[u.id] && S.cash >= u.cost) || (S.loc + 1 < LOCS.length && S.cash >= LOCS[S.loc + 1].cost));
  }
}
function fmtTime(ms) { const m = Math.floor(ms / 6e4); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }

/* ================= FX ================= */
function floater(x, y, txt, cls) {
  const el = document.createElement('div'); el.className = 'float ' + (cls || '');
  el.textContent = txt; el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 900);
}
let toastEl = null, toastT = 0;
function toast(t) {
  if (toastEl) toastEl.remove();
  toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.textContent = t;
  document.body.appendChild(toastEl); clearTimeout(toastT);
  const el = toastEl; toastT = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2200);
}
let bt = 0;
function bumpCash() { const c = $('cash'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
const vib = p => { if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
function modal(html) { $('modal').innerHTML = html; $('ov').classList.add('show'); }
$('ov').addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === $('ov')) $('ov').classList.remove('show'); });

/* ================= OFFLINE ================= */
function offline() {
  if (!me) return;
  const away = Math.min(Date.now() - (S.t || Date.now()), 8 * 3600e3) / 1000;
  if (away < 30) { S.t = Date.now(); return; }
  const c0 = S.cash; let left = away;
  while (left > 0) { const st = Math.min(1, left); tick(st, true); left -= st; }
  S.t = Date.now();
  const earned = S.cash - c0;
  if (earned > 0) modal(`<h2>Vítej zpět, ${esc(me.name)}</h2><p>Byl jsi pryč ${fmtTime(away * 1000)}. Sad rostl a lidi makali dál.</p><div class="big" style="color:var(--gold)">+${rm(earned)}</div><button class="cta ok" data-close>Vybrat</button>`);
  save();
}
setInterval(() => { if (!document.hidden) save(); }, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { last = performance.now(); offline(); } });
addEventListener('pagehide', save);
// iOS home-screen apps report a viewport shorter than the screen by the status-bar height,
// which leaves a strip under the nav. Size the app to the physical screen there.
function fitScreen() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const root = document.documentElement;
  if (!ios || !standalone) { root.classList.remove('fixh'); return; }
  const portrait = innerHeight >= innerWidth;
  const sh = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
  if (sh > innerHeight + 2) { root.style.setProperty('--appH', sh + 'px'); root.classList.add('fixh'); } else root.classList.remove('fixh');
}
fitScreen();
addEventListener('orientationchange', () => setTimeout(() => { fitScreen(); resize(); }, 300));
addEventListener('resize', () => { fitScreen(); resize(); if (loginOn) sizeLogin(); });
// the stage can change size without a window resize (app shown, safe areas, PWA chrome): watch it directly
if ('ResizeObserver' in window) new ResizeObserver(() => { if (!me) return; const r = $('stage').getBoundingClientRect(); if (Math.abs(r.width - W) > 1.5 || Math.abs(r.height - H) > 1.5) { resize(); render(true); } }).observe($('stage'));

/* ================= LOOP ================= */
let last = performance.now(), acc = 0;
function loop(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (loginOn) drawLogin(t);
  else if (me) {
    const earn = tick(dt, false);
    if (dt > 0) ipsEma += (earn / dt - ipsEma) * Math.min(1, dt * 1.5);
    const tn = Date.now();
    if (tn > S.nextEv) {
      const E = EVENTS[(Math.random() * EVENTS.length) | 0];
      S.ev = { id: E.id, until: tn + E.dur * 1000 };
      S.nextEv = tn + E.dur * 1000 + (90 + Math.random() * 120) * 1000; vib(10);
    }
    if (tab !== 'emp' && (Math.abs(cv.clientWidth - W) > 1.5 || Math.abs(cv.clientHeight - H) > 1.5)) { resize(); render(true); }
    if (tab !== 'emp' && W && LAY) { g0.setTransform(dpr, 0, 0, dpr, 0, 0); g0.clearRect(0, 0, W, H); DRAW[tab](g0, t, dt); }
    acc += dt; if (acc > .1) { acc = 0; render(false); }
  }
  requestAnimationFrame(loop);
}

/* ================= BOOT ================= */
if (location.hash === '#debug') window.__k = { L: () => LAY, S: () => S, tab: () => tab };
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(() => {});
(() => {
  const lastId = store.get(LK, null), p = profiles.find(x => x.id === lastId);
  if (p && !p.pin) enter(p); else showLogin();
  requestAnimationFrame(t => { last = t; loop(t); });
})();

})();
