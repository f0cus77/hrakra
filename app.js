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
  { id: 'trees',    tab: 'farm', title: 'Kratomový sad',    unit: 'Strom',   max: 2, base: 15,   k: 1.20, sm: 25, r0: .15, ru: 'kg/s', tap: 'Zalít' },
  { id: 'pickers',  tab: 'farm', title: 'Sběrači',          unit: 'Sběrač',  max: 4, base: 50,   k: 1.21, sm: 25, r0: .25, ru: 'kg/s', tap: 'Sklidit' },
  { id: 'racks',    tab: 'farm', title: 'Sušárna',          unit: 'Lísa',    max: 3, base: 120,  k: 1.22, sm: 35, r0: .20, ru: 'kg/s', tap: 'Usušit' },
  { id: 'grinders', tab: 'proc', title: 'Drcení',           unit: 'Drtička', max: 2, base: 300,  k: 1.23, sm: 120, r0: .15, ru: 'kg/s', tap: 'Podrtit' },
  { id: 'packers',  tab: 'proc', title: 'Balicí linka',     unit: 'Balič',   max: 3, base: 400,  k: 1.23, sm: 45, r0: 1,   ru: 'ks/s', tap: 'Zabalit' },
  { id: 'dealers',  tab: 'dist', title: 'Pouliční dealeři', unit: 'Dealer',  max: 5, base: 600,  k: 1.24, sm: 18, r0: .6,  ru: 'ks/s', tap: 'Prodat' },
  { id: 'couriers', tab: 'dist', title: 'Kurýrní síť',      unit: 'Kurýr',   max: 2, base: 4e4,  k: 1.25, sm: 80, r0: 4,   ru: 'ks/s', tap: null }
];
const UBY = Object.fromEntries(UNITS.map(u => [u.id, u]));
const MS = 10; // every 10 levels a slot gets ×1.75 speed
const BAG = { 25: { prem: 1.6, scale: .72 }, 50: { prem: 1.25, scale: .86 }, 100: { prem: 1.25, scale: 1.04 } };
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
// empire upgrades are endless levels: the first steps keep the old prices, then each level gets pricier by `ext`
UNITS.forEach(u => UPG.push({ id: 'u_' + u.id, kind: 'unit', t: u.id, names: UNAMES[u.id], tab: TIER.map((t, i) => u.base * t * (i + 1)), ext: 30,
  eff: n => `${u.title}: rychlost ×2 · teď ×${fmt(Math.pow(2, n))}` }));
UPG.push(
  { id: 'price', kind: 'price', names: ['Zip-lock sáčky', 'Vlastní značka', 'Kapsle', 'Export do Thajska', 'Prémiový Red Vein mix', 'Dárková balení'], tab: [400, 12e3, 4e5, 1.5e7, 6e8, 3e10], ext: 45,
    eff: n => `Prodejní cena +50 % · teď +${fmt((Math.pow(1.5, n) - 1) * 100)}\u00a0%` },
  { id: 'heat', kind: 'heat', names: ['Úplatek místnímu policistovi', 'Krycí čajovna', 'Právník v Ipohu', 'Kontakt u policie', 'Kamarád na ministerstvu'], tab: [2500, 7e4, 2.5e6, 1.2e8, 7e9], ext: 50,
    eff: n => `Heat −30 %, rychlejší vychladnutí · teď −${Math.round((1 - Math.pow(.7, n)) * 100)} %` },
  { id: 'hand', kind: 'hand', names: ['Pracovní rukavice', 'Ostrá mačeta', 'Silná kopi', 'Nářadí z Japonska'], tab: [60, 2500, 1.2e5, 6e6], ext: 50,
    eff: n => `Ruční práce ×3 · teď ×${fmt(Math.pow(3, n))}` },
  { id: 'cap', kind: 'cap', names: ['Prořezávání', 'Starší stromy', 'Opory větví', 'Šlechtění'], tab: [300, 3e4, 3e6, 3e8], ext: 100,
    eff: n => `Kapacita listí na stromě ×2 · teď ×${fmt(Math.pow(2, n))}` });
const UPBY = Object.fromEntries(UPG.map(u => [u.id, u]));
const ROMAN = ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
const upLv = id => (S.ul && S.ul[id]) | 0;
function upCost(up, n) {
  const tb = up.tab; if (n < tb.length) return tb[n];
  return tb[tb.length - 1] * Math.pow(up.ext, n - tb.length + 1) * (up.kind === 'unit' ? (n + 1) / tb.length : 1);
}
function upName(up, n) { const k = up.names.length, r = Math.floor(n / k) + 1; return up.names[n % k] + (r > 1 ? (ROMAN[r] || ' ' + r) : ''); }

// beyond the street: your own brand grows into a distributor, a franchise and an export empire
const BRAND = [
  { n: 'Vlastní značka', d: 'Logo, etikety a jméno, které lidi poznají. Odemkne síť prodejen.', cost: 5e8, eff: 'Cena sáčku ×2', price: 2 },
  { n: 'Distributor', d: 'Velkoobchod: tvoje zboží berou obchody po celé zemi.', cost: 5e10, eff: 'Prodej ×3', sell: 3 },
  { n: 'Franšíza', d: 'Prodejny pod tvou značkou provozují jiní a platí ti podíl.', cost: 5e12, eff: 'Příjem prodejen ×4', shop: 4 },
  { n: 'Export', d: 'Kontejnery do Thajska, Indonésie a na Filipíny.', cost: 5e14, eff: 'Cena sáčku ×3', price: 3 },
  { n: 'Globální značka', d: 'Tvoje logo v každém přístavu Asie.', cost: 5e16, eff: 'Všechno ×5', price: 5, sell: 1, shop: 5 }
];
const brandMult = k => BRAND.slice(0, S.brand).reduce((m, b) => m * (b[k] || 1), 1);
const SHOPS = [
  { n: 'Alor Setar', xy: [72, 46], lb: [10, 4, 'start'] }, { n: 'George Town', xy: [50, 72], lb: [10, 4, 'start'] }, { n: 'Ipoh', xy: [88, 122], lb: [10, 4, 'start'] },
  { n: 'Kota Bharu', xy: [166, 50], lb: [0, -10, 'middle'] }, { n: 'Kuala Terengganu', xy: [180, 98], lb: [-9, -7, 'end'] }, { n: 'Kuantan', xy: [168, 158], lb: [-10, 4, 'end'] },
  { n: 'Kuala Lumpur', xy: [104, 190], lb: [10, 4, 'start'] }, { n: 'Seremban', xy: [122, 214], lb: [10, 4, 'start'] }, { n: 'Melaka', xy: [134, 240], lb: [10, 4, 'start'] },
  { n: 'Johor Bahru', xy: [168, 278], lb: [-10, 4, 'end'] }
];
const shopCost = j => 1e8 * Math.pow(6, j);
const shopLvCost = (j, L, n = 1) => { const c0 = shopCost(j) * .25 * Math.pow(1.16, L - 1); return c0 * (Math.pow(1.16, n) - 1) / .16; };
const shopRate = (j, L) => L > 0 ? shopCost(j) * .004 * lvPow(L) * brandMult('shop') * xpMult() : 0;
const shopIncome = () => S.brand ? S.shops.reduce((a, L, j) => a + shopRate(j, L), 0) : 0;
// boss level from lifetime earnings; every level adds 5 % to the bag price
const xpLevel = tot => 1 + Math.floor(Math.log(1 + tot / 50) / Math.log(1.9));
const xpAt = L => 50 * (Math.pow(1.9, L - 1) - 1);
const xpMult = () => Math.pow(1.05, xpLevel(S.total) - 1);

const EVENTS = [
  { id: 'monsoon', txt: 'Monzun — sušení −50 %', dur: 60, cls: 'bad' },
  { id: 'buyer',   txt: 'Odběratel z Thajska — cena ×2', dur: 45, cls: 'good' },
  { id: 'bloom',   txt: 'Ideální počasí — růst ×3', dur: 40, cls: 'good' },
  { id: 'patrol',  txt: 'Policejní hlídky — heat ×2', dur: 40, cls: 'bad' },
  { id: 'rush',    txt: 'Noční trh — prodej ×2', dur: 45, cls: 'good' }
];

/* ================= STATE ================= */
const fresh = () => ({
  cash: 15, onTree: 3, fresh: 0, dry: 0, powder: 0, b25: 0, b50: 0, b100: 0, bag: 100, brand: 0, shops: [], xpLv: 1,
  lv: { trees: [1, 0], pickers: [0, 0, 0, 0], racks: [0, 0, 0], grinders: [0, 0], packers: [0, 0, 0], dealers: [0, 0, 0, 0, 0], couriers: [0, 0] },
  upg: {}, ul: {}, loc: 0, heat: 0, layUntil: 0, layCd: 0, ev: null, nextEv: Date.now() + 120e3,
  total: 0, taps: 0, raids: 0, sold: 0, bagsSold: 0, start: Date.now(), t: Date.now()
});
let S = fresh();
let buyAmt = 1, ipsEma = 0, tab = 'farm';

/* ================= MATH ================= */
const cnt = kind => upLv(kind);
const evOn = id => S.ev && S.ev.id === id && Date.now() < S.ev.until;
const MS_MULT = 1.75;
const lvPow = L => L > 0 ? L * Math.pow(MS_MULT, Math.floor(L / MS)) : 0;
const own = id => S.lv[id].filter(l => l > 0).length;
// a slot costs more the later it is, and pays back in output: level prices scale with the slot's own price
const LAM = .2, GAM = .4;
const costM = (u, i) => i === 0 ? 1 : LAM * Math.pow(u.sm, i);
const slotM = (u, i) => Math.pow(costM(u, i), GAM);
const power = id => S.lv[id].reduce((a, L, i) => a + slotM(UBY[id], i) * lvPow(L), 0);
const lvSum = id => S.lv[id].reduce((a, L) => a + L, 0);
function umult(id) {
  let m = 1;
  return Math.pow(2, upLv('u_' + id)) * LOCS[S.loc].mult;
}
const handMult = () => Math.pow(3, cnt('hand')) * LOCS[S.loc].mult;
const priceKg = () => PRICE_KG * LOCS[S.loc].price * Math.pow(1.5, cnt('price')) * brandMult('price') * xpMult() * (evOn('buyer') ? 2 : 1);
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
    sell: layLow() ? 0 : (unitRate('dealers') + unitRate('couriers')) * brandMult('sell') * (evOn('rush') ? 2 : 1)
  };
}
function unitRate(id) { return power(id) * UBY[id].r0 * umult(id); }
function slotRate(id, L, i) { return slotM(UBY[id], i) * lvPow(L) * UBY[id].r0 * umult(id); }
function lvCost(u, L, n, i) { const c0 = u.base * costM(u, i) * Math.pow(u.k, L - 1); return c0 * (Math.pow(u.k, n) - 1) / (u.k - 1); }
function lvMax(u, L, i) { const c0 = u.base * costM(u, i) * Math.pow(u.k, L - 1); return Math.max(0, Math.floor(Math.log(S.cash * (u.k - 1) / c0 + 1) / Math.log(u.k))); }
function unlockCost(u, i) { return u.base * (i === 0 ? 1 : Math.pow(u.sm, i)); }
// every number is whole: full below 10 000, then at most three digits + suffix (12k, 147k, 1M, 25M, 340B …)
const grp = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const SUF = ['k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
// cut, never rounded up, so a balance never looks bigger than it is
function short(n, units) {
  let i = -1, m = n;
  while (m >= 1000 && i < units.length - 1) { m /= 1000; i++; }
  return grp(Math.floor(m + 1e-9)) + (i < 0 ? '' : units[i]);
}
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1e4) return grp(Math.max(0, Math.min(9999, n)));
  return short(n, SUF);
}
// grams under 1 kg, whole kg under 10 t, then whole tonnes: 12 t · 340 t · 1 250 t · 25 kt …
function kg(n) {
  if (!isFinite(n)) return '∞';
  if (n > 0 && Math.round(n * 1000) < 1000) return grp(n * 1000) + '\u00a0g';
  if (n < 1e4) return grp(Math.max(0, Math.min(9999, n))) + '\u00a0kg';
  return short(n / 1000, ['\u00a0kt', '\u00a0Mt', '\u00a0Gt', '\u00a0Tt']).replace(/(\d)$/, '$1\u00a0t');
}
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
  const shopEarn = shopIncome() * dt; if (shopEarn > 0) { S.cash += shopEarn; S.total += shopEarn; }
  if (dt > 0) flows = { grow: g / dt, pick: p / dt, dry: d / dt, grind: gr / dt, pack: pk / dt, sell: r.sold / dt };
  return r.earn + shopEarn;
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
  if (o.vest) { g.fillStyle = o.vest; g.fillRect(x - 4 * s, y - 16 * s, 8 * s, 1.6 * s); g.fillRect(x - 1 * s, y - 20 * s, 2 * s, 11 * s); }
  if (o.helmet) { g.fillStyle = o.helmet; g.beginPath(); g.arc(x, y - 24.5 * s, 3.9 * s, Math.PI, 0); g.fill(); g.fillRect(x - 5 * s, y - 24.8 * s, 10 * s, 1.2 * s);
    if (o.visor) { g.fillStyle = o.visor; g.fillRect(x - 3.2 * s, y - 24 * s, 6.4 * s, 1.3 * s); } }
  else if (o.hat) { g.fillStyle = '#c8b58c'; g.beginPath(); g.moveTo(x - 8 * s, y - 24 * s); g.lineTo(x, y - 30 * s); g.lineTo(x + 8 * s, y - 24 * s); g.closePath(); g.fill();
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
function scooter(g, x, y, s, dir, t, lit, col = '#4a4e55', tr = 0) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  if (tr >= 2) { const c = tr >= 3 ? '94,240,255' : '255,90,200'; glow(g, 0, -1, 24, c, .45); }
  if (tr >= 3) col = '#1b2230';
  if (lit) { g.fillStyle = grad(g, 12, -8, 60, -8, [[0, 'rgba(255,235,190,.22)'], [1, 'rgba(255,235,190,0)']]); g.beginPath(); g.moveTo(12, -10); g.lineTo(60, -18); g.lineTo(60, 2); g.closePath(); g.fill(); }
  if (tr >= 3) { g.fillStyle = NEON; [-10, 10].forEach(wx => { rrect(g, wx - 5, -4 - Math.sin(t * 6) * .6, 10, 2.5, 1.2); g.fill(); }); }
  else { g.fillStyle = '#111'; [-10, 10].forEach(wx => { g.beginPath(); g.arc(wx, -4, 4, 0, 6.283); g.fill(); }); }
  g.strokeStyle = tr >= 3 ? 'rgba(0,0,0,0)' : '#555'; g.lineWidth = 1; [-10, 10].forEach(wx => { g.beginPath(); g.arc(wx, -4, 2, t * 20, t * 20 + 3); g.stroke(); });
  g.fillStyle = col; g.beginPath(); g.moveTo(-13, -6); g.quadraticCurveTo(-12, -14, -2, -13); g.lineTo(6, -13); g.lineTo(11, -18); g.lineTo(13, -16); g.lineTo(12, -6); g.closePath(); g.fill();
  g.fillStyle = tr >= 1 ? ['', '#ffc857', '#e0533f', '#2a3446'][tr] : '#7f9a71'; rrect(g, -19, tr >= 1 ? -25 : -22, tr >= 1 ? 12 : 10, tr >= 1 ? 12 : 9, 1.5); g.fill();
  if (tr >= 1) { g.fillStyle = tr >= 3 ? NEON : '#20160c'; g.fillRect(-17, -21, 8, 1.5); }
  if (tr >= 3) { g.strokeStyle = NEON; g.lineWidth = 1; g.beginPath(); g.moveTo(-13, -6); g.lineTo(12, -6); g.stroke(); }
  g.fillStyle = '#2f3540'; rrect(g, -6, -24, 6, 11, 3); g.fill();
  g.fillStyle = '#ddd'; g.beginPath(); g.arc(-3, -27, 3.6, 0, 6.283); g.fill();
  g.fillStyle = '#222'; g.fillRect(-1, -28, 3, 2);
  g.fillStyle = '#fff1cc'; g.beginPath(); g.arc(12.5, -15, 1.4, 0, 6.283); g.fill();
  g.fillStyle = '#c2463c'; g.fillRect(-14, -9, 2, 2);
  g.restore();
}
function van(g, x, y, s, dir, t, tr = 0) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  const VB = ['#d3d2cd', '#f2f0ea', '#1e2128', '#141a24'][tr], VC = ['#c6c5c0', '#e4e2dc', '#16181e', '#0e131b'][tr];
  if (tr >= 3) glow(g, 0, -2, 46, '94,240,255', .35);
  g.fillStyle = grad(g, 26, -10, 80, -10, [[0, 'rgba(255,235,190,.2)'], [1, 'rgba(255,235,190,0)']]); g.beginPath(); g.moveTo(26, -12); g.lineTo(80, -22); g.lineTo(80, 2); g.closePath(); g.fill();
  g.fillStyle = VB; rrect(g, -26, -28, 38, 22, 3); g.fill();
  g.fillStyle = VC; g.beginPath(); g.moveTo(12, -24); g.lineTo(20, -24); g.lineTo(27, -14); g.lineTo(27, -6); g.lineTo(12, -6); g.closePath(); g.fill();
  g.fillStyle = '#1d2430'; g.beginPath(); g.moveTo(14, -22); g.lineTo(19.5, -22); g.lineTo(24, -15); g.lineTo(14, -15); g.closePath(); g.fill();
  g.fillStyle = ['#7f9a71', '#2aa58a', '#d9b45a', NEON][tr]; g.fillRect(-24, -17, 34, tr ? 3 : 2);
  if (tr === 1) { g.fillStyle = '#2aa58a'; g.font = '800 8px "Baloo 2",sans-serif'; g.textAlign = 'center'; g.fillText('KETUM', -7, -20); }
  if (tr >= 2) { g.fillStyle = tr >= 3 ? NEON : '#d9b45a'; g.font = '800 8px "Baloo 2",sans-serif'; g.textAlign = 'center'; g.fillText(tr >= 3 ? 'K·EXPRESS' : 'KE', -7, -20); }
  g.fillStyle = '#111'; [-16, 16].forEach(wx => { g.beginPath(); g.arc(wx, -5, 5, 0, 6.283); g.fill(); g.fillStyle = '#444'; g.beginPath(); g.arc(wx, -5, 2, 0, 6.283); g.fill(); g.fillStyle = '#111'; });
  g.fillStyle = '#fff1cc'; g.fillRect(25, -12, 2, 3); g.fillStyle = '#c2463c'; g.fillRect(-27, -14, 2, 4);
  g.restore();
}
/* ================= SCENES ================= */
// every unit gets a new look as it levels: base → upgraded → pro → futuristic
const TIER_LV = [0, 25, 50, 100], TIER_NAME = ['základní', 'vylepšený', 'profi', 'futuristický'];
const tierOf = L => L >= 100 ? 3 : L >= 50 ? 2 : L >= 25 ? 1 : 0;
const NEON = '#5ef0ff';
function drone(g, x, y, s, t, seed) {
  const hy = y + Math.sin(t * 3 + seed) * 2 * s;
  glow(g, x, hy + 6 * s, 14 * s, '94,240,255', .25);
  g.fillStyle = '#1b2230'; rrect(g, x - 6 * s, hy - 2 * s, 12 * s, 5 * s, 2 * s); g.fill();
  g.strokeStyle = '#3a4456'; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(x - 11 * s, hy - 2 * s); g.lineTo(x + 11 * s, hy - 2 * s); g.stroke();
  g.fillStyle = 'rgba(200,240,255,.55)'; [-11, 11].forEach(dx => { g.beginPath(); g.ellipse(x + dx * s, hy - 3 * s, 5 * s * Math.abs(Math.sin(t * 40 + dx)), 1 * s, 0, 0, 6.283); g.fill(); });
  g.fillStyle = NEON; g.beginPath(); g.arc(x, hy + 1 * s, 1.4 * s, 0, 6.283); g.fill();
}
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

/* ---------- KRATOM TREE ---------- */
// Mitragyna speciosa: straight trunk, spreading branches, big glossy oval leaves in opposite pairs.
// Each slot is a different vein strain (red / white / green), shown on the leaf midribs.
const VEIN = [['#7a2a22', '#d9584a'], ['#a9b39a', '#f4f7e8'], ['#4d7a2e', '#b9e07c'], ['#7a2a22', '#d9584a']];
function leafPath(g, len, wid) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .22, -wid, len * .72, -wid * .95, len, 0); g.bezierCurveTo(len * .72, wid * .95, len * .22, wid, 0, 0); g.closePath(); }
function drawLeaf(g, x, y, ang, len, wid, base, light, vein) {
  g.save(); g.translate(x, y); g.rotate(ang);
  leafPath(g, len, wid); g.fillStyle = base; g.fill();
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .22, -wid, len * .72, -wid * .95, len, 0); g.closePath(); g.fillStyle = light; g.fill();
  g.strokeStyle = vein; g.lineCap = 'round'; g.lineWidth = Math.max(.35, wid * .14);
  g.beginPath(); g.moveTo(-len * .08, 0); g.lineTo(len * .9, 0); g.stroke();
  if (len > 14) {
    g.globalAlpha *= .55; g.lineWidth = Math.max(.4, wid * .08);
    for (let k = 1; k < 4; k++) { const px = len * k / 4.3; g.beginPath(); g.moveTo(px, 0); g.quadraticCurveTo(px + len * .08, -wid * .3, px + len * .16, -wid * .62); g.moveTo(px, 0); g.quadraticCurveTo(px + len * .08, wid * .3, px + len * .16, wid * .62); g.stroke(); }
  }
  g.restore();
}
const treeCache = new Map();
function kratomSprite(i, lv, ripe, day, s) {
  const key = [i, lv > 60 ? 60 : lv, Math.round(ripe * 8), Math.round(day * 6), s.toFixed(2), dpr].join('|');
  let c = treeCache.get(key); if (c) return c;
  if (treeCache.size > 48) treeCache.clear();
  const Wd = 150 * s, Hd = 150 * s, bx = Wd / 2, by = Hd - 8 * s, th = 100 * s;
  const cvs = document.createElement('canvas'); cvs.width = Math.ceil(Wd * dpr); cvs.height = Math.ceil(Hd * dpr);
  const g = cvs.getContext('2d'); g.scale(dpr, dpr);
  const bark = lc('#2c2018', '#6e4f36', day), barkD = lc('#1e1610', '#4a3424', day), barkL = lc('#3a2c20', '#9a7656', day);
  const tx = f => bx + f * 3 * s + Math.sin(f * 3.2 + i) * 1.4 * s, ty = f => by - th * f;
  // roots + trunk
  g.fillStyle = barkD; g.beginPath(); g.moveTo(bx - 11 * s, by + 1); g.quadraticCurveTo(bx - 4 * s, by - 6 * s, bx - 3 * s, by - 12 * s); g.lineTo(bx + 3 * s, by - 12 * s); g.quadraticCurveTo(bx + 4 * s, by - 6 * s, bx + 11 * s, by + 1); g.closePath(); g.fill();
  g.fillStyle = grad(g, bx - 5 * s, 0, bx + 5 * s, 0, [[0, barkD], [.45, bark], [1, barkD]]);
  g.beginPath(); g.moveTo(bx - 4.2 * s, by);
  for (let f = 0; f <= 1.001; f += .1) g.lineTo(tx(f) - (4.2 - 2.6 * f) * s, ty(f));
  for (let f = 1; f >= -.001; f -= .1) g.lineTo(tx(f) + (4.2 - 2.6 * f) * s, ty(f));
  g.closePath(); g.fill();
  g.strokeStyle = barkL; g.lineWidth = .8 * s; g.globalAlpha = .55;
  for (let k = 0; k < 7; k++) { const f = .05 + k * .12, ox = (R(i * 7 + k) - .5) * 4 * s; g.beginPath(); g.moveTo(tx(f) + ox, ty(f)); g.quadraticCurveTo(tx(f + .03) + ox + s, ty(f + .03), tx(f + .06) + ox, ty(f + .06)); g.stroke(); }
  g.globalAlpha = 1;
  // branches
  const nb = 5 + Math.min(4, Math.floor(Math.log2(1 + lv)));
  const big = [lc('#17402a', '#33904a', day), lc('#22573a', '#5cbd5e', day)];
  const young = [lc('#28552c', '#4fa544', day), lc('#33653a', '#7cc95e', day)];
  const vein = lc(lc(VEIN[i][0], VEIN[i][1], .25 + day * .75), lc('#1d4529', '#46984c', day), .3);
  const leaves = [];
  for (let b = 0; b < nb; b++) {
    const f = .34 + .6 * (b / (nb - 1)), side = (b + i) % 2 ? 1 : -1;
    const len = (46 - 22 * f + R(i * 31 + b) * 10) * s, elev = .28 + .42 * f + R(i * 17 + b) * .16;
    const x0 = tx(f), y0 = ty(f), dx = side * Math.cos(elev), dy = -Math.sin(elev);
    const x2 = x0 + dx * len, y2 = y0 + dy * len, x1 = x0 + dx * len * .5, y1 = y0 + dy * len * .5 - len * .12;
    g.strokeStyle = bark; g.lineCap = 'round'; g.lineWidth = (3.4 - 1.8 * f) * s;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
    const pairs = 3 + (len > 30 * s ? 1 : 0);
    for (let p = 0; p < pairs; p++) {
      const tt = .38 + .58 * p / (pairs - 1), mt = 1 - tt;
      const px = mt * mt * x0 + 2 * mt * tt * x1 + tt * tt * x2, py = mt * mt * y0 + 2 * mt * tt * y1 + tt * tt * y2;
      const ddx = 2 * mt * (x1 - x0) + 2 * tt * (x2 - x1), ddy = 2 * mt * (y1 - y0) + 2 * tt * (y2 - y1), a = Math.atan2(ddy, ddx);
      [-1, 1].forEach(sd => leaves.push({ x: px, y: py, a: a + sd * 1.0 + .22 * side * 0 + (sd > 0 ? .18 : .1), seed: i * 97 + b * 11 + p * 2 + (sd > 0 ? 1 : 0), d: b }));
    }
    leaves.push({ x: x2, y: y2, a: Math.atan2(y2 - y1, x2 - x1) + .15 * side, seed: i * 97 + b * 11 + 9, d: b });
  }
  // crown at the top of the trunk
  [-2.1, -1.57, -1.0].forEach((a, k) => leaves.push({ x: tx(1), y: ty(1), a, seed: i * 97 + 90 + k, d: nb }));
  leaves.sort((A, B) => A.d - B.d);
  for (const l of leaves) {
    const isRipe = R(l.seed) < ripe * 1.05;
    const sc = isRipe ? .95 + R(l.seed + 3) * .25 : .66 + R(l.seed + 5) * .12;
    const col = isRipe ? big : young;
    drawLeaf(g, l.x, l.y, l.a, 19 * s * sc, 7.8 * s * sc, col[0], col[1], vein);
  }
  c = { cv: cvs, w: Wd, h: Hd, ox: bx, oy: by };
  treeCache.set(key, c); return c;
}
function kratom(g, x, y, s, born, i, t, day, ripe, lv, extraScale = 1) {
  const age = (performance.now() - born) / 1000, gr = clamp(age / 2.2);
  const k = (gr < 1 ? .2 + .8 * eBack(gr) : 1) * extraScale;
  const sp = kratomSprite(i, lv, ripe, day, s);
  const sway = Math.sin(t * 1.1 + i * 1.7) * .035 + Math.sin(t * 2.7 + i) * .008 + (vis.water && performance.now() - vis.water < 600 ? Math.sin((performance.now() - vis.water) / 40) * .03 : 0);
  const tr = tierOf(lv);
  g.fillStyle = 'rgba(10,30,10,.22)'; g.beginPath(); g.ellipse(x + 4 * s, y + 2, 34 * s * k, 7 * s * k, 0, 0, 6.283); g.fill();
  if (tr >= 2) { // stone planter ring
    g.fillStyle = tr >= 3 ? '#1c2533' : '#c9b48e'; g.beginPath(); g.ellipse(x, y, 26 * s * k, 7 * s * k, 0, 0, 6.283); g.fill();
    g.fillStyle = tr >= 3 ? '#121924' : '#6b4f34'; g.beginPath(); g.ellipse(x, y - 1 * s, 21 * s * k, 5 * s * k, 0, 0, 6.283); g.fill();
  }
  if (tr >= 1) { // drip irrigation hose with droplets
    g.strokeStyle = tr >= 3 ? NEON : '#2f86c9'; g.lineWidth = 1.6 * s; g.beginPath(); g.ellipse(x, y, 30 * s * k, 8 * s * k, 0, 0, 6.283); g.stroke();
    for (let d = 0; d < 4; d++) { const a = d * 1.57 + t * .4, ph = (t * 1.3 + d * .25) % 1;
      g.fillStyle = `rgba(150,210,255,${.8 * (1 - ph)})`; g.beginPath(); g.arc(x + Math.cos(a) * 30 * s * k, y + Math.sin(a) * 8 * s * k + ph * 4 * s, 1.3 * s, 0, 6.283); g.fill(); }
  }
  if (tr >= 3) { glow(g, x, y - 70 * s * k, 70 * s * k, '94,240,255', .14 + .05 * Math.sin(t * 2 + i)); }
  g.save(); g.translate(x, y); g.scale(k, k); g.transform(1, 0, sway, 1, 0, 0);
  g.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
  g.restore();
  if (tr >= 2) { // grow lamp on a pole
    const lx = x + 26 * s * k, ly = y - 86 * s * k;
    g.strokeStyle = tr >= 3 ? '#2b3a4c' : '#5a5a60'; g.lineWidth = 1.8 * s; g.beginPath(); g.moveTo(lx, y + 1); g.lineTo(lx, ly); g.lineTo(lx - 8 * s, ly); g.stroke();
    const lc2 = tr >= 3 ? '94,240,255' : '255,120,200';
    glow(g, lx - 8 * s, ly + 3 * s, 16 * s, lc2, .45); g.fillStyle = `rgb(${lc2})`; rrect(g, lx - 13 * s, ly, 10 * s, 3 * s, 1.5 * s); g.fill();
  }
  if (tr >= 3) { // holo ring
    const r = 24 * s * k, hy = y - 6 * s - Math.sin(t * 1.5 + i) * 3 * s;
    g.strokeStyle = `rgba(94,240,255,${.55 + .25 * Math.sin(t * 3 + i)})`; g.lineWidth = 1.4 * s; g.beginPath(); g.ellipse(x, hy, r, r * .22, 0, 0, 6.283); g.stroke();
  }
}

/* ---------- TROPICAL PROPS ---------- */
function palm(g, x, y, h, lean, t, day, seed) {
  const sway = Math.sin(t * .9 + seed) * .06;
  const topX = x + lean * h * .35 + sway * h * .3, topY = y - h;
  g.strokeStyle = lc('#3a2c1f', '#8a6a48', day); g.lineCap = 'round';
  for (let k = 0; k < 10; k++) {
    const f0 = k / 10, f1 = (k + 1) / 10;
    const ax = x + (topX - x) * f0 * f0 * .4 + (topX - x) * f0 * .6, ay = y - h * f0, bx = x + (topX - x) * f1 * f1 * .4 + (topX - x) * f1 * .6, by = y - h * f1;
    g.lineWidth = (9 - 4 * f0) * h / 120; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.strokeStyle = lc('#2a2016', '#6e5236', day); g.lineWidth = 1; g.beginPath(); g.moveTo(ax - 3, ay); g.lineTo(ax + 3, ay - 2); g.stroke();
    g.strokeStyle = lc('#3a2c1f', '#8a6a48', day);
  }
  const fr = lc('#173a24', '#2f8a44', day), frL = lc('#1f4a2c', '#53b25c', day);
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * .5 + sway * 2 + Math.sin(t * 1.4 + k + seed) * .04, len = h * (.42 + R(seed + k) * .12);
    const ex = topX + Math.cos(a) * len, ey = topY + Math.sin(a) * len * .55 + len * .35;
    g.strokeStyle = fr; g.lineWidth = 2.2; g.beginPath(); g.moveTo(topX, topY); g.quadraticCurveTo(topX + Math.cos(a) * len * .5, topY + Math.sin(a) * len * .5 - len * .15, ex, ey); g.stroke();
    for (let q = 1; q < 9; q++) {
      const f = q / 9, mt = 1 - f;
      const cx1 = topX + Math.cos(a) * len * .5, cy1 = topY + Math.sin(a) * len * .5 - len * .15;
      const px = mt * mt * topX + 2 * mt * f * cx1 + f * f * ex, py = mt * mt * topY + 2 * mt * f * cy1 + f * f * ey;
      const ll = len * .22 * (1 - f * .6);
      g.strokeStyle = q % 2 ? fr : frL; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.2) * ll, py + Math.sin(a + 1.2) * ll + ll * .4); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.2) * ll, py + Math.sin(a - 1.2) * ll + ll * .4); g.stroke();
    }
  }
  g.fillStyle = lc('#3a2a14', '#7a5a2a', day); [[-4, 4], [4, 5], [0, 8]].forEach(([dx, dy]) => { g.beginPath(); g.arc(topX + dx, topY + dy, 3.6 * h / 120, 0, 6.283); g.fill(); });
}
function cloud(g, x, y, s, a) {
  g.fillStyle = `rgba(255,255,255,${a})`;
  [[0, 0, 16], [14, -6, 13], [28, 0, 14], [-14, 3, 11], [40, 4, 10]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 6.283); g.fill(); });
  g.fillStyle = `rgba(200,225,240,${a * .5})`; g.fillRect(x - 24 * s, y + 4 * s, 76 * s, 6 * s);
}
function hibiscus(g, x, y, r, col, t, k) {
  const sw = Math.sin(t * 2 + k) * .15;
  g.fillStyle = col;
  for (let p = 0; p < 5; p++) { const a = p * 1.2566 + sw; g.beginPath(); g.ellipse(x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7, r * .7, r * .45, a, 0, 6.283); g.fill(); }
  g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(x, y, r * .28, 0, 6.283); g.fill();
}
function hut(g, x, y, u, day) {
  g.fillStyle = 'rgba(80,60,20,.22)'; g.beginPath(); g.ellipse(x, y + 3, 46 * u, 7 * u, 0, 0, 6.283); g.fill();
  // stilts + bamboo walls
  g.fillStyle = lc('#3a2c1c', '#8a6236', day); [-26, 26].forEach(dx => g.fillRect(x + dx * u - 2 * u, y - 8 * u, 4 * u, 8 * u));
  g.fillStyle = lc('#4a3a22', '#d2a865', day); g.fillRect(x - 30 * u, y - 40 * u, 60 * u, 32 * u);
  g.strokeStyle = lc('#3a2c1a', '#a8803f', day); g.lineWidth = 1.2;
  for (let k = 0; k <= 10; k++) { g.beginPath(); g.moveTo(x - 30 * u + k * 6 * u, y - 40 * u); g.lineTo(x - 30 * u + k * 6 * u, y - 8 * u); g.stroke(); }
  g.fillStyle = '#1a120a'; rrect(g, x - 7 * u, y - 30 * u, 14 * u, 22 * u, 2 * u); g.fill();
  g.fillStyle = lc('#203a3a', '#35c0c4', day); rrect(g, x + 12 * u, y - 32 * u, 12 * u, 10 * u, 2 * u); g.fill();
  // thatched roof
  g.fillStyle = lc('#4a3a1a', '#c9a052', day); g.beginPath(); g.moveTo(x - 42 * u, y - 36 * u); g.lineTo(x, y - 66 * u); g.lineTo(x + 42 * u, y - 36 * u); g.closePath(); g.fill();
  g.strokeStyle = lc('#3a2c14', '#9a7432', day); g.lineWidth = 1.2;
  for (let k = 0; k < 14; k++) { const fx = x - 40 * u + k * 6 * u; g.beginPath(); g.moveTo(fx, y - 35 * u); g.lineTo(fx + (fx < x ? 4 : -4) * u, y - 44 * u); g.stroke(); }
  g.fillStyle = lc('#5a4520', '#e0b866', day); for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x - 42 * u + k * 10.5 * u, y - 36 * u); g.lineTo(x - 37 * u + k * 10.5 * u, y - 31 * u); g.lineTo(x - 32 * u + k * 10.5 * u, y - 36 * u); g.fill(); }
  glow(g, x, y - 20 * u, 26 * u, '255,200,120', .2 * (1 - day) + .03);
  [[-36, 2], [36, 2], [30, -4]].forEach(([dx, dy]) => { g.fillStyle = '#8a6440'; rrect(g, x + dx * u - 5 * u, y + dy * u - 7 * u, 10 * u, 7 * u, 1.5 * u); g.fill(); g.fillStyle = '#7fc25a'; g.beginPath(); g.ellipse(x + dx * u, y + dy * u - 7 * u, 4.5 * u, 2 * u, 0, 0, 6.283); g.fill(); });
}
function rack(g, x, y, w, u, day, owned, i, t) {
  const top = y - 30 * u, tr = tierOf(S.lv.racks[i] || 0);
  const P = [
    [lc('#3a2a18', '#b8894a', day), lc('#2a1e10', '#8a6232', day), lc('#3a2a1c', '#c8954f', day), lc('#2a1e12', '#9a6a34', day)],
    [lc('#2c3036', '#8a929c', day), lc('#22262c', '#6a7280', day), lc('#3a3f46', '#b4bcc6', day), lc('#2a2e34', '#7a828c', day)],
    [lc('#2a3440', '#5f86a8', day), lc('#1e2630', '#46667f', day), lc('#3a4a5a', '#d6dee6', day), lc('#2a3a48', '#8aa0b4', day)],
    ['#1a2230', '#121924', '#1d2a3a', NEON]][tr];
  g.fillStyle = 'rgba(40,60,20,.25)'; g.beginPath(); g.ellipse(x, y + 1, w * .55, 5 * u, 0, 0, 6.283); g.fill();
  g.strokeStyle = P[0]; g.lineWidth = 3.4 * u; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - w / 2 + 6 * u, y); g.lineTo(x - w / 2 + 6 * u, top - 4 * u); g.moveTo(x + w / 2 - 6 * u, y); g.lineTo(x + w / 2 - 6 * u, top - 4 * u); g.stroke();
  g.strokeStyle = P[1]; g.lineWidth = 1; [y - 8 * u, y - 18 * u].forEach(yy => { g.beginPath(); g.moveTo(x - w / 2 + 6 * u, yy); g.lineTo(x + w / 2 - 6 * u, yy + 2 * u); g.stroke(); });
  const ps = popScale('racks' + i);
  g.save(); g.translate(x, top); g.scale(ps, ps);
  if (tr >= 3) glow(g, 0, 6 * u, w * .55, '94,240,255', .22);
  g.fillStyle = P[2]; rrect(g, -w / 2, -3 * u, w, 6 * u, 3 * u); g.fill();
  if (tr >= 3) { g.strokeStyle = NEON; g.lineWidth = 1.4; rrect(g, -w / 2, -3 * u, w, 6 * u, 3 * u); g.stroke(); }
  if (tr >= 2) { // solar panel roof
    g.fillStyle = '#1f3c66'; g.beginPath(); g.moveTo(-w * .46, -16 * u); g.lineTo(w * .46, -20 * u); g.lineTo(w * .46, -15 * u); g.lineTo(-w * .46, -11 * u); g.closePath(); g.fill();
    g.strokeStyle = tr >= 3 ? NEON : 'rgba(180,210,255,.5)'; g.lineWidth = .8; for (let k = 1; k < 6; k++) { const xx = -w * .46 + k * w * .92 / 6; g.beginPath(); g.moveTo(xx, -16 * u - k * .8 * u); g.lineTo(xx, -11 * u - k * .8 * u); g.stroke(); }
    g.strokeStyle = P[0]; g.lineWidth = 1.5 * u; g.beginPath(); g.moveTo(-w * .4, -12 * u); g.lineTo(-w * .4, -3 * u); g.moveTo(w * .4, -16 * u); g.lineTo(w * .4, -3 * u); g.stroke();
  }
  g.strokeStyle = P[3]; g.lineWidth = 1; for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(-w / 2 + k * w / 10, -3 * u); g.lineTo(-w / 2 + k * w / 10, 3 * u); g.stroke(); }
  const dryRatio = (S.dry + 1e-9) / (S.fresh + S.dry + 1e-9);
  const n = Math.min(14, Math.ceil(Math.log10(1 + (S.fresh + S.dry) * 10) * 4));
  for (let m = 0; m < n; m++) {
    const c = clamp(dryRatio + R(m + i * 7) * .3 - .15);
    drawLeaf(g, -w / 2 + 8 * u + R(i * 40 + m) * (w - 22 * u), -3 * u, R(m * 3) - .5, 11 * u, 4 * u, lc(lc('#2f7a3c', '#7a5a34', c), '#000', .15 * (1 - day)), lc('#4fa452', '#9a7646', c), lc('#d9584a', '#c9a070', c));
  }
  g.restore();
  if (flows.dry > 0 && day > .2) {
    g.strokeStyle = `rgba(255,245,215,${.18 * day})`; g.lineWidth = 1;
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
  g.fillStyle = 'rgba(120,90,40,.22)'; g.beginPath(); g.ellipse(o.x, o.y + 4 * u, o.w * .56, 9 * u, 0, 0, 6.283); g.fill();
  g.save(); g.translate(o.x, o.y + kick * .3);
  g.fillStyle = lc('#6b5634', '#e8c47a', day); g.beginPath(); g.moveTo(-o.w / 2, 0); g.lineTo(-o.w / 2 + 12 * u, -20 * u); g.lineTo(o.w / 2 - 12 * u, -20 * u); g.lineTo(o.w / 2, 0); g.closePath(); g.fill();
  g.strokeStyle = lc('#5a4529', '#c49a52', day); g.lineWidth = 1.4;
  for (let k = 1; k < 7; k++) { const f = k / 7; g.beginPath(); g.moveTo(-o.w / 2 + f * o.w, 0); g.lineTo(-o.w / 2 + 12 * u + f * (o.w - 24 * u), -20 * u); g.stroke(); }
  g.strokeStyle = lc('#7a2a22', '#d9584a', day); g.lineWidth = 2; g.beginPath(); g.moveTo(-o.w / 2 + 3 * u, -3 * u); g.lineTo(o.w / 2 - 3 * u, -3 * u); g.stroke();
  const dryRatio = (S.dry + 1e-9) / (S.fresh + S.dry + 1e-9), n = Math.min(12, Math.ceil(Math.log10(1 + (S.fresh + S.dry) * 10) * 4));
  for (let m = 0; m < n; m++) { const c = clamp(dryRatio + R(m + 90) * .3 - .15); drawLeaf(g, -o.w / 2 + 16 * u + R(m + 70) * (o.w - 40 * u), -5 * u - R(m + 80) * 12 * u, R(m) - .5, 12 * u, 4.4 * u, lc('#2f7a3c', '#7a5a34', c), lc('#4fa452', '#9a7646', c), '#d9584a'); }
  g.restore();
  sign(g, o.x - o.w / 2 - 8 * u, o.y + 2 * u, u, 'Sušení');
}
function mortar(g, o, t) {
  const u = o.s, k = performance.now() - (vis.mortarKick || 0) < 260 ? Math.sin((performance.now() - vis.mortarKick) / 26) : 0;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(o.x, o.y + 1, 24 * u, 4 * u, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#8a5a32'; g.lineWidth = 5 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x + 6 * u, o.y - 22 * u - k * 6 * u); g.lineTo(o.x + 18 * u, o.y - 40 * u - k * 6 * u); g.stroke();
  g.fillStyle = grad(g, o.x - 20 * u, 0, o.x + 20 * u, 0, [[0, '#7d8790'], [.5, '#b8c1c8'], [1, '#6f7880']]);
  g.beginPath(); g.moveTo(o.x - 21 * u, o.y - 24 * u); g.quadraticCurveTo(o.x - 20 * u, o.y, o.x, o.y); g.quadraticCurveTo(o.x + 20 * u, o.y, o.x + 21 * u, o.y - 24 * u); g.closePath(); g.fill();
  g.fillStyle = '#5c646b'; g.beginPath(); g.ellipse(o.x, o.y - 24 * u, 21 * u, 5 * u, 0, 0, 6.283); g.fill();
  if (S.dry > 0) { g.fillStyle = '#8b7353'; g.beginPath(); g.ellipse(o.x, o.y - 24 * u, 15 * u, 3 * u, 0, 0, 6.283); g.fill(); }
  sign(g, o.x, o.y + 30 * u, u, 'Drcení');
}
function fallingLeaves(g, t, dt, u, day) {
  for (let j = vis.leaves.length - 1; j >= 0; j--) {
    const l = vis.leaves[j]; l.life -= dt;
    if (l.burst) { l.vy += 260 * dt; l.vx *= .96; } l.y += l.vy * dt; l.x += (l.vx || 0) * dt + Math.sin(t * 3 + l.ph) * 14 * dt;
    if (l.life <= 0 || l.y > H) { vis.leaves.splice(j, 1); continue; }
    g.globalAlpha = clamp(l.life * 2);
    drawLeaf(g, l.x, l.y, Math.sin(t * 3 + l.ph) * 1.2 + l.ph, 11 * u, 4.2 * u, lc('#1d4529', '#3f9a4a', day), lc('#2a6e38', '#6cc265', day), '#d9584a');
    g.globalAlpha = 1;
  }
  if (vis.leaves.length > 160) vis.leaves.splice(0, vis.leaves.length - 160);
}

/* ---------- FARM (tropical coast) ---------- */
function drawFarm(g, t, dt) {
  const L = LAY, u = L.u, { isDay, q, day } = dayCycle(t);
  const seaTop = TOP - 46, sandTop = F(.03), grassTop = F(.17);
  // sky
  g.fillStyle = grad(g, 0, 0, 0, seaTop, [[0, lc('#0e1030', '#38b6e8', day)], [1, lc('#2a2a5a', '#bdeef2', day)]]); g.fillRect(0, 0, W, seaTop + 2);
  if (day < .95) for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(246,240,222,${(1 - day) * (.2 + .45 * Math.abs(Math.sin(t * 1.3 + i * 2.1)))})`; g.fillRect(R(i) * W, R(i + 50) * seaTop, 1.3, 1.3); }
  const cx = W * (.08 + .84 * q), cy = seaTop - 10 - Math.sin(q * Math.PI) * (seaTop - 30);
  if (isDay) { glow(g, cx, cy, 90, '255,230,150', .35 * day + .08); g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(cx, cy, 13, 0, 6.283); g.fill(); }
  else { glow(g, cx, cy, 46, '220,230,255', .14); g.fillStyle = '#e4e8f0'; g.beginPath(); g.arc(cx, cy, 10, 0, 6.283); g.fill(); g.fillStyle = lc('#0e1030', '#2a2a5a', .5); g.beginPath(); g.arc(cx + 4, cy - 3, 9, 0, 6.283); g.fill(); }
  for (let k = 0; k < 4; k++) { const sx = ((R(k + 40) * W * 1.6 + t * (6 + k * 2)) % (W + 160)) - 80, sy = 18 + R(k + 41) * (seaTop - 60); cloud(g, sx, sy, .7 + R(k + 42) * .5, .55 * day + .08); }
  if (day > .3) for (let k = 0; k < 3; k++) { const bx = ((t * (14 + k * 5) + R(k + 60) * W) % (W + 40)) - 20, by = 30 + R(k + 61) * (seaTop - 50) + Math.sin(t * 2 + k) * 4, w2 = 5 + Math.sin(t * 8 + k * 2) * 2; g.strokeStyle = `rgba(40,50,60,${.5 * day})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx - 6, by - w2 * .4); g.quadraticCurveTo(bx - 3, by - w2, bx, by); g.quadraticCurveTo(bx + 3, by - w2, bx + 6, by - w2 * .4); g.stroke(); }
  // sea
  g.fillStyle = grad(g, 0, seaTop, 0, sandTop, [[0, lc('#14284a', '#1fa3c6', day)], [.6, lc('#1a3a5a', '#3fd0d4', day)], [1, lc('#2a5060', '#8fe8dc', day)]]); g.fillRect(0, seaTop, W, sandTop - seaTop + 2);
  g.fillStyle = lc('#16324a', '#2a9a7a', day); g.beginPath(); g.ellipse(W * .62, seaTop + 3, 46, 9, 0, Math.PI, 0); g.fill();
  palm(g, W * .6, seaTop + 3, 24, .3, t, day * .8, 7);
  g.fillStyle = `rgba(255,255,255,${.25 + .35 * day})`;
  for (let k = 0; k < 26; k++) { const sx = (R(k + 100) * W + t * (4 + R(k) * 6)) % W, sy = seaTop + 6 + R(k + 101) * (sandTop - seaTop - 12); g.fillRect(sx, sy, 6 + R(k + 2) * 8, 1.4); }
  if (isDay) { g.fillStyle = `rgba(255,245,200,${.35 * day})`; for (let k = 0; k < 8; k++) g.fillRect(cx - 14 + R(k + 200) * 28, seaTop + 4 + k * 3, 10 + R(k) * 12, 1.4); }
  else { g.fillStyle = 'rgba(230,235,255,.25)'; for (let k = 0; k < 6; k++) g.fillRect(cx - 10 + R(k + 210) * 20, seaTop + 4 + k * 3, 8, 1.2); }
  // shore foam + sand
  g.fillStyle = lc('#5a5240', '#f3dfa8', day); g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 6; x += 6) g.lineTo(x, sandTop + Math.sin(x * .03 + t * 1.2) * 3);
  g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = `rgba(255,255,255,${.5 + .3 * day})`; g.lineWidth = 2.2; g.beginPath();
  for (let x = 0; x <= W + 6; x += 6) { const yy = sandTop + Math.sin(x * .03 + t * 1.2) * 3 - 1; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
  g.fillStyle = lc('#4a4434', '#e6cf92', day); for (let k = 0; k < 30; k++) g.fillRect(R(k + 400) * W, sandTop + 6 + R(k + 401) * (grassTop - sandTop - 8), 2, 1.2);
  // grass with a soft wavy edge
  g.fillStyle = grad(g, 0, grassTop, 0, H, [[0, lc('#163a22', '#6ccb4e', day)], [1, lc('#0f2a18', '#3f9a3a', day)]]);
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, grassTop + Math.sin(x * .05) * 4 + Math.sin(x * .13) * 2); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = lc('#1b3a27', '#7ad85c', day); g.lineWidth = 1.2;
  for (let k = 0; k < 120; k++) { const gx = R(k + 500) * W, gy = grassTop + 10 + R(k + 501) * (H - grassTop - 10); g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx - 1.5, gy - 5 * u); g.moveTo(gx + 2, gy); g.lineTo(gx + 3, gy - 4 * u); g.stroke(); }
  // sandy path: hut -> orchard -> drying racks
  g.strokeStyle = lc('#4a3e2a', '#e2c286', day); g.lineCap = 'round'; g.lineWidth = 15 * u;
  g.beginPath(); g.moveTo(L.shed.x, L.shed.y + 4); g.bezierCurveTo(W * .7, F(.32), W * .58, F(.6), W * .5, L.racks[0].y + 4); g.stroke();
  g.lineWidth = 11 * u; g.beginPath(); g.moveTo(L.racks[0].x, L.racks[0].y + 4); g.lineTo(L.racks[2].x, L.racks[2].y + 4); g.stroke();
  g.strokeStyle = lc('#3a3020', '#cfae72', day); g.lineWidth = 1.2; g.setLineDash([3, 7]);
  g.beginPath(); g.moveTo(L.shed.x, L.shed.y + 4); g.bezierCurveTo(W * .7, F(.32), W * .58, F(.6), W * .5, L.racks[0].y + 4); g.stroke(); g.setLineDash([]);
  // flowers
  const FL = ['#ff4f6d', '#ff8fb3', '#ffd25e', '#ff7a3c', '#ffffff'];
  for (let k = 0; k < 16; k++) { const fx = R(k + 300) * W, fy = grassTop + 14 + R(k + 330) * (H - grassTop - 30); hibiscus(g, fx, fy, (2.6 + R(k) * 1.6) * u, lc('#3a2a3a', FL[k % 5], .4 + day * .6), t, k); }
  palm(g, W * .05, grassTop + 4, 128 * u, .55, t, day, 1);
  hut(g, L.shed.x, L.shed.y, u * 1.05, day);
  palm(g, W * .985, L.shed.y + 4, 110 * u, -.5, t, day, 3);
  tarp(g, L.tarp, u, day, t);
  const leafFrac = clamp(S.onTree / cap());
  while (vis.treeBorn.length < 4) vis.treeBorn.push(performance.now());
  const draws = [];
  L.trees.forEach((o, i) => {
    if (S.lv.trees[i]) draws.push({ y: o.y, f: () => { let k = popScale('trees' + i); if (vis.treeHit && vis.treeHit.i === i) { const qq = (performance.now() - vis.treeHit.t) / 1000; if (qq < .4) k *= 1 - .05 * Math.sin(qq * 30) * (1 - qq / .4); } kratom(g, o.x, o.y, o.s, vis.treeBorn[i], i, t, day, leafFrac, S.lv.trees[i], k); } });
    else if (i === own('trees')) draws.push({ y: o.y, f: () => {
      g.fillStyle = lc('#3a2a17', '#7a5a33', day); g.beginPath(); g.ellipse(o.x, o.y, 28 * u, 9 * u, 0, Math.PI, 0); g.fill();
      g.strokeStyle = lc('#3d5c35', '#6a9a4a', day); g.lineWidth = 2.5 * u; g.beginPath(); g.moveTo(o.x, o.y - 4 * u); g.lineTo(o.x, o.y - 20 * u); g.stroke();
      drawLeaf(g, o.x, o.y - 14 * u, -2.4, 11 * u, 4 * u, lc('#28502a', '#74bd52', day), lc('#33602f', '#a5e07a', day), '#d9584a');
      drawLeaf(g, o.x, o.y - 19 * u, -.7, 11 * u, 4 * u, lc('#28502a', '#74bd52', day), lc('#33602f', '#a5e07a', day), '#d9584a');
    } });
  });
  // pickers walk tree -> rack with baskets
  const nw = own('pickers'), ownT = Math.max(1, own('trees')), ownR = own('racks');
  for (let i = 0; i < nw; i++) {
    const T = L.trees[i % ownT], Rk = ownR ? L.racks[i % ownR] : L.tarp;
    const from = { x: T.x + (i % 2 ? 18 : -18) * u, y: T.y + 4 * u }, to = { x: Rk.x + (i % 2 ? 14 : -14) * u, y: Rk.y + 2 * u };
    const spd = 1 + Math.log10(S.lv.pickers[i] || 1) * .6;
    let x, y, dir = 1, full = false, walk = 0;
    if (flows.pick > 0) {
      const ph = (t * .08 * spd * (1 + i * .07) + i * .31) % 1, uu = ph < .5 ? ph * 2 : 2 - ph * 2, e = uu * uu * (3 - 2 * uu);
      x = lerp(from.x, to.x, e); y = lerp(from.y, to.y, e); dir = (to.x - from.x) * (ph < .5 ? 1 : -1) > 0 ? 1 : -1; full = ph < .5; walk = t * 10 + i;
      y -= Math.abs(Math.sin(walk)) * 1.5 * u;
    } else { x = from.x; y = from.y; }
    draws.push({ y, f: () => { g.fillStyle = 'rgba(20,40,10,.25)'; g.beginPath(); g.ellipse(x, y + 1, 7 * u, 2 * u, 0, 0, 6.283); g.fill(); const tr = tierOf(S.lv.pickers[i] || 0);
      person(g, x, y, u * 1.15, { walk, dir, hat: true, shirt: tr >= 3 ? '#1d2a3a' : ['#e0533f', '#2f86c9', '#e8a92c', '#2aa58a'][i], carry: true, carryFill: full,
        helmet: tr ? ['', '#ffc857', '#f6f0de', '#2b3a4c'][tr] : null, vest: tr >= 2 ? (tr >= 3 ? NEON : '#ffd23a') : null, visor: tr >= 3 ? NEON : null });
      if (tr >= 3) drone(g, x + dir * 10 * u, y - 44 * u, u, t, i); } });
  }
  L.racks.forEach((o, i) => draws.push({ y: o.y, f: () => { if (S.lv.racks[i]) rack(g, o.x, o.y, o.w, u, day, true, i, t); else if (i === own('racks')) ghostOutline(g, o.x, o.y, o.w, 30 * u, u); } }));
  draws.sort((a, b) => a.y - b.y).forEach(d => d.f());
  if (flows.pick > 0 && Math.random() < .05 + Math.min(.2, flows.pick * .03)) {
    const o = L.trees[(Math.random() * ownT) | 0];
    vis.leaves.push({ x: o.x + (Math.random() - .5) * 70 * o.s, y: o.y - 70 * o.s, vy: 16 + Math.random() * 10, vx: 0, ph: Math.random() * 6, life: 3 });
  }
  fallingLeaves(g, t, dt, u, day);
  if (day < .3) for (let i = 0; i < 12; i++) { const fx = (R(i + 9) * W + Math.sin(t * .4 + i) * 30) % W, fy = F(.2 + R(i + 3) * .6) + Math.cos(t * .7 + i) * 8; glow(g, fx, fy, 7, '214,240,160', (.3 + .3 * Math.sin(t * 3 + i * 2)) * (1 - day / .3)); }
  fxStep(g, dt);
  if (evOn('monsoon')) {
    g.fillStyle = 'rgba(20,35,50,.28)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(190,215,235,.35)'; g.lineWidth = 1;
    g.beginPath(); for (let i = 0; i < 90; i++) { const x = (R(i) * W + t * 60) % W, y = (R(i + 7) * H + t * 480 * (.8 + R(i) * .4)) % H; g.moveTo(x, y); g.lineTo(x - 3, y + 11); } g.stroke();
  }
}

/* ---------- WORKSHOP (beach shack) ---------- */
function grinder(g, gx, gy, s, i, t, spin, owned) {
  const ps = popScale('grinders' + i), tr = tierOf(S.lv.grinders[i] || 0);
  const GC = [['#c7552f', '#e0663a', '#f58a4e', '#c9542c', '#8a3518'], ['#2f6a9a', '#3d7fb8', '#5c9ad0', '#2e6898', '#1d4466'],
    ['#9aa4ae', '#c8d0d8', '#f2f5f8', '#a8b2bc', '#b8892c'], ['#141a24', '#1b2230', '#2a3446', '#141a24', NEON]][tr];
  g.save(); g.translate(gx, gy); g.scale(s * ps, s * ps);
  const jit = owned && spin ? Math.sin(t * 60 + i) * .6 : 0;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 54, 6, 0, 0, 6.283); g.fill();
  g.fillStyle = GC[0]; g.beginPath(); g.moveTo(-34, -104 + jit); g.lineTo(34, -104 + jit); g.lineTo(15, -78 + jit); g.lineTo(-15, -78 + jit); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(-34, -104 + jit); g.lineTo(-20, -104 + jit); g.lineTo(-8, -78 + jit); g.lineTo(-15, -78 + jit); g.closePath(); g.fill();
  const fill = clamp(Math.log10(1 + S.dry * 5) / 3);
  if (fill > .05 && owned) { g.fillStyle = '#8a7a55'; g.beginPath(); g.ellipse(0, -102 + jit, 30, 4 + fill * 5, 0, Math.PI, 0); g.fill(); }
  if (tr >= 3) glow(g, 0, -50 + jit, 70, '94,240,255', .18 + (spin ? .1 : 0));
  g.fillStyle = grad(g, -40, 0, 40, 0, [[0, GC[1]], [.5, GC[2]], [1, GC[3]]]);
  rrect(g, -40, -80 + jit, 80, 64, 10); g.fill();
  if (tr >= 2) { g.strokeStyle = GC[4]; g.lineWidth = tr >= 3 ? 2 : 3; rrect(g, -40, -80 + jit, 80, 64, 10); g.stroke(); }
  if (tr >= 3) { g.strokeStyle = NEON; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-34, -28 + jit); g.lineTo(34, -28 + jit); g.moveTo(-34, -58 + jit); g.lineTo(-18, -58 + jit); g.moveTo(18, -58 + jit); g.lineTo(34, -58 + jit); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g, -36, -76 + jit, 72, 8, 4); g.fill();
  g.fillStyle = GC[4]; [[-34, -74], [34, -74], [-34, -22], [34, -22]].forEach(([bx, by]) => { g.beginPath(); g.arc(bx, by + jit, 1.8, 0, 6.283); g.fill(); });
  g.fillStyle = '#20160c'; rrect(g, -14, -48 + jit, 28, 16, 3); g.fill(); g.fillStyle = tr >= 3 ? NEON : '#ffc857'; g.font = '800 9px "Baloo 2",sans-serif'; g.textAlign = 'center'; g.fillText(['K-0', 'K-X', 'PRO-', 'Q-'][tr] + (i + 1), 0, -37 + jit);
  g.fillStyle = '#26272c'; rrect(g, -18, -16, 36, 10, 3); g.fill();
  const wx = 44, wy = -52 + jit, wr = 20;
  g.strokeStyle = '#3b3f46'; g.lineWidth = 4; g.beginPath(); g.arc(wx, wy, wr, 0, 6.283); g.stroke();
  g.lineWidth = 2.5; for (let k = 0; k < 5; k++) { const a = vis.grAngle * (1 + i * .1) + k * 1.2566; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); g.stroke(); }
  g.fillStyle = '#ffc857'; g.beginPath(); g.arc(wx, wy, 4, 0, 6.283); g.fill();
  const led = owned && spin ? '154,214,114' : '239,122,85';
  glow(g, -26, -66 + jit, 9, led, .9); g.fillStyle = `rgb(${led})`; g.beginPath(); g.arc(-26, -66 + jit, 2.6, 0, 6.283); g.fill();
  const pile = clamp(Math.log10(1 + S.powder * 8) / 3.2);
  g.fillStyle = '#b5b56e'; g.beginPath(); g.ellipse(0, 0, 8 + pile * 34, 2 + pile * 10, 0, Math.PI, 0); g.fill();
  g.restore();
  if (owned && spin) for (let k = 0; k < 2; k++) vis.parts.push({ x: gx + (Math.random() - .5) * 6 * s, y: gy - 10 * s, vy: 30 + Math.random() * 40, vx: (Math.random() - .5) * 8, life: .3, c: '#b6ae86' });
}
function drawProc(g, t, dt) {
  const L = LAY, u = L.u, wallB = F(.6);
  // turquoise plank walls
  g.fillStyle = grad(g, 0, 0, 0, wallB, [[0, '#1f8f94'], [1, '#2bb3b2']]); g.fillRect(0, 0, W, wallB);
  for (let x = 0, k = 0; x < W; x += 24 * u, k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'; g.fillRect(x, 0, 24 * u, wallB); g.fillStyle = 'rgba(0,40,40,.25)'; g.fillRect(x, 0, 1.5, wallB); }
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 14; k++) g.fillRect(R(k + 700) * W, R(k + 701) * wallB, 10 + R(k) * 20, 1.5);
  g.fillStyle = '#7a4e2a'; g.fillRect(0, wallB - 34 * u, W, 34 * u); g.fillStyle = '#8f5c33'; g.fillRect(0, wallB - 34 * u, W, 4 * u);
  // window with a sea view
  const wx = W * .6, wy = F(.0), ww = W * .32, wh = F(.21) - F(.0);
  g.save(); rrect(g, wx, wy, ww, wh, 6); g.clip();
  g.fillStyle = grad(g, 0, wy, 0, wy + wh, [[0, '#5fd0f4'], [.55, '#c8f2f0'], [.56, '#1fb5cc'], [.8, '#64e0d6'], [.81, '#f3dfa8'], [1, '#e8cf8e']]); g.fillRect(wx, wy, ww, wh);
  glow(g, wx + ww * .75, wy + wh * .2, 30, '255,240,180', .6); g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(wx + ww * .75, wy + wh * .2, 7, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 6; k++) g.fillRect(wx + ((R(k + 800) * ww + t * 5) % ww), wy + wh * (.6 + R(k + 801) * .18), 6, 1.2);
  cloud(g, wx + ((t * 4) % (ww + 60)) - 30, wy + wh * .22, .45, .85);
  palm(g, wx + ww * .2, wy + wh + 4, wh * .95, .5, t, 1, 11);
  g.restore();
  g.strokeStyle = '#f2c14e'; g.lineWidth = 5; rrect(g, wx, wy, ww, wh, 6); g.stroke(); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
  g.fillStyle = '#f2c14e'; [[-1, wx - 16 * u], [1, wx + ww + 2]].forEach(([d, sx]) => { rrect(g, sx, wy, 14 * u, wh, 3); g.fill(); g.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 1; k < 6; k++) g.fillRect(sx + 2, wy + k * wh / 6, 14 * u - 4, 1.5); g.fillStyle = '#f2c14e'; });
  g.fillStyle = '#7a4e2a'; g.fillRect(wx - 6, wy + wh, ww + 12, 6 * u);
  // light from the window
  g.fillStyle = grad(g, 0, wy, 0, F(.95), [[0, 'rgba(255,245,210,.14)'], [1, 'rgba(255,245,210,0)']]);
  g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww, wy + wh); g.lineTo(wx + ww - W * .1, F(.95)); g.lineTo(wx - W * .35, F(.95)); g.closePath(); g.fill();
  // string lights + ceiling fan
  const ly0 = 8;
  g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly0); for (let k = 0; k <= 16; k++) g.lineTo(k / 16 * W, ly0 + Math.sin(k / 16 * Math.PI * 2) * 8 + 8); g.stroke();
  const BUL = ['255,90,110', '255,200,87', '110,220,160', '90,170,255', '255,140,70'];
  for (let k = 1; k < 16; k++) { const bx = k / 16 * W, by = ly0 + Math.sin(k / 16 * Math.PI * 2) * 8 + 13, on = .7 + .3 * Math.sin(t * 2 + k); glow(g, bx, by, 12, BUL[k % 5], .35 * on); g.fillStyle = `rgb(${BUL[k % 5]})`; g.beginPath(); g.arc(bx, by, 3, 0, 6.283); g.fill(); }
  // shelf with jars and a hanging plant
  const shY = F(.215);
  g.fillStyle = '#8f5c33'; g.fillRect(W * .04, shY, W * .5, 5 * u); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(W * .04, shY + 5 * u, W * .5, 3 * u);
  ['#ff8fb3', '#ffd25e', '#7fd35c', '#4aa8ff', '#ff7a3c'].forEach((c, k) => { const jx = W * .09 + k * W * .075; g.fillStyle = 'rgba(255,255,255,.35)'; rrect(g, jx, shY - 22 * u, 16 * u, 22 * u, 4 * u); g.fill(); g.fillStyle = c; rrect(g, jx + 2 * u, shY - 12 * u, 12 * u, 11 * u, 3 * u); g.fill(); g.fillStyle = '#6b4a2b'; g.fillRect(jx + 2 * u, shY - 25 * u, 12 * u, 4 * u); });
  const px = W * .48, py = shY;
  for (let k = 0; k < 7; k++) { const a = -Math.PI * .85 + k * Math.PI * .7 / 6 + Math.sin(t * 1.3 + k) * .05; drawLeaf(g, px, py - 12 * u, a, (14 + R(k + 900) * 9) * u, 4 * u, '#2f8a44', '#53b25c', '#1d5a2a'); }
  g.fillStyle = '#c4704f'; g.beginPath(); g.moveTo(px - 10 * u, py - 14 * u); g.lineTo(px + 10 * u, py - 14 * u); g.lineTo(px + 7 * u, py); g.lineTo(px - 7 * u, py); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(px - 10 * u, py - 14 * u, 20 * u, 3 * u);
  // floor planks
  g.fillStyle = grad(g, 0, wallB, 0, H, [[0, '#b07a45'], [1, '#8a5a32']]); g.fillRect(0, wallB, W, H - wallB);
  for (let y = wallB, k = 0; y < H; y += 20 * u, k++) { g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, y, W, 1.5); for (let x = (k % 2) * 40 * u; x < W; x += 80 * u) g.fillRect(x, y, 1.5, 20 * u); g.fillStyle = 'rgba(255,230,190,.08)'; g.fillRect(0, y + 2, W, 2); }
  // woven rug under the line
  g.fillStyle = '#d9584a'; rrect(g, W * .04, F(.74), W * .78, F(.92) - F(.74), 8); g.fill();
  g.fillStyle = '#f2c14e'; for (let k = 0; k < 3; k++) g.fillRect(W * .04, F(.765) + k * (F(.92) - F(.74)) / 3.6, W * .78, 3 * u);
  // bench
  const by = L.bench;
  g.fillStyle = '#9a6538'; g.fillRect(W * .04, by, W * .92, 10 * u); g.fillStyle = '#6e4626'; g.fillRect(W * .04, by + 10 * u, W * .92, 5 * u);
  g.fillStyle = '#6e4626'; [W * .08, W * .9].forEach(x => g.fillRect(x, by + 15 * u, 8 * u, wallB - by - 15 * u));
  const spin = flows.grind > 0 ? 3 + Math.min(10, Math.log10(1 + flows.grind * 50) * 4) : 0;
  const kick = performance.now() - vis.grindKick < 400 ? 8 : 0;
  vis.grAngle += (spin + kick) * dt;
  mortar(g, L.mortar, t);
  L.grind.forEach((o, i) => { if (S.lv.grinders[i]) grinder(g, o.x, o.y, o.s, i, t, spin || kick, true); else if (i === own('grinders')) ghostOutline(g, o.x, o.y, 90 * o.s, 100 * o.s, u); });
  // conveyor
  const B = L.belt, cy = B.y;
  const beltSpd = flows.pack > 0 ? 40 + Math.min(80, Math.log10(1 + flows.pack) * 40) : (vis.spawnBag > 0 ? 70 : 0);
  vis.belt = (vis.belt + beltSpd * dt) % 16;
  g.strokeStyle = '#3a3a40'; g.lineWidth = 4 * u; g.beginPath(); [B.x0 + 14, (B.x0 + B.x1) / 2, B.x1 - 14].forEach(x => { g.moveTo(x, cy + 8); g.lineTo(x, cy + 40 * u); }); g.stroke();
  const ptr = Math.max(0, ...S.lv.packers.map(tierOf));
  if (ptr >= 3) glow(g, (B.x0 + B.x1) / 2, cy + 6 * u, (B.x1 - B.x0) * .55, '94,240,255', .16);
  g.fillStyle = ['#ffc857', '#9aa4ae', '#e8eef4', NEON][ptr]; rrect(g, B.x0 - 2, cy - 3 * u, B.x1 - B.x0 + 4, 4 * u, 2); g.fill();
  g.fillStyle = '#1f2024'; rrect(g, B.x0, cy, B.x1 - B.x0, 12 * u, 6 * u); g.fill();
  g.strokeStyle = 'rgba(246,240,222,.12)'; g.lineWidth = 1.4; for (let x = B.x0 + 8 + vis.belt; x < B.x1 - 6; x += 16) { g.beginPath(); g.moveTo(x, cy + 2); g.lineTo(x - 4, cy + 10 * u); g.stroke(); }
  [B.x0 + 6 * u, B.x1 - 6 * u].forEach(rx => { g.fillStyle = '#4a4a52'; g.beginPath(); g.arc(rx, cy + 6 * u, 6 * u, 0, 6.283); g.fill(); const a = vis.belt / 16 * 6.283; g.strokeStyle = '#ffc857'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(rx, cy + 6 * u); g.lineTo(rx + Math.cos(a) * 5 * u, cy + 6 * u + Math.sin(a) * 5 * u); g.stroke(); });
  const np = own('packers');
  for (let i = 0; i < np; i++) { const tr = tierOf(S.lv.packers[i]), px = B.x0 + (B.x1 - B.x0) * (.25 + i * .25);
    person(g, px, cy + 2, u * 1.2, { shirt: tr >= 3 ? '#1d2a3a' : tr >= 2 ? '#eef2f4' : ['#2aa58a', '#e0533f', '#7a5cd6'][i], hat: i === 1 && !tr, helmet: tr ? ['', '#ffc857', '#2f86c9', '#2b3a4c'][tr] : null, visor: tr >= 3 ? NEON : null, vest: tr === 1 ? '#ffd23a' : tr >= 3 ? NEON : null, arm: flows.pack > 0 ? Math.abs(Math.sin(t * 7 + i * 1.3)) : 0 });
    if (tr >= 3) drone(g, px + 12 * u, cy - 40 * u, u, t, i + 5); }
  if (flows.pack > 0) vis.bagAcc += dt * Math.min(2.2, .6 + Math.log10(1 + flows.pack));
  while (vis.bagAcc >= 1) { vis.bagAcc--; vis.bags.push({ x: B.x0 + 12, sz: S.bag, drop: 0 }); }
  while (vis.spawnBag > 0) { vis.spawnBag--; vis.bags.push({ x: B.x0 + 12 - vis.bags.filter(b => b.x < B.x0 + 40).length * 22, sz: S.bag, drop: 0 }); }
  const C = L.crate, cw = 74 * u, ch = 46 * u;
  const inCrate = Math.min(9, Math.ceil(Math.log10(1 + bagsTotal()) * 3));
  for (let k = 0; k < inCrate; k++) bagShape(g, C.x - cw * .3 + (k % 3) * cw * .3, C.y - ch + 6 - Math.floor(k / 3) * 8 * u, [25, 50, 100][(R(k) * 3) | 0], .9 * u);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(C.x, C.y + 2, cw * .6, 5 * u, 0, 0, 6.283); g.fill();
  g.fillStyle = '#c8954f'; rrect(g, C.x - cw / 2, C.y - ch, cw, ch, 4); g.fill();
  g.strokeStyle = '#8a5a32'; g.lineWidth = 2.5; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(C.x - cw / 2, C.y - ch + k * ch / 3); g.lineTo(C.x + cw / 2, C.y - ch + k * ch / 3); g.stroke(); }
  g.fillStyle = '#20160c'; g.font = `800 ${9 * u}px "Baloo 2",sans-serif`; g.textAlign = 'center'; g.fillText('EXPORT', C.x, C.y - ch * .42);
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
  // hawker cart parked on the road, under a striped parasol
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + 3, 62 * u, 8 * u, 0, 0, 6.283); g.fill();
  glow(g, x, y - 50 * u, 70 * u, '255,200,120', .16);
  g.strokeStyle = '#d9d2c0'; g.lineWidth = 2.5 * u; g.beginPath(); g.moveTo(x + 6 * u, y - 30 * u); g.lineTo(x + 6 * u, y - 108 * u); g.stroke();
  const pr = 60 * u, pt = y - 112 * u;
  for (let k = 0; k < 8; k++) {
    const a0 = Math.PI + k * Math.PI / 8, a1 = a0 + Math.PI / 8;
    g.fillStyle = k % 2 ? '#f6f0de' : '#e0533f';
    g.beginPath(); g.moveTo(x + 6 * u, pt); g.lineTo(x + 6 * u + Math.cos(a0) * pr, pt + 22 * u + Math.sin(a0) * 4 * u); g.quadraticCurveTo(x + 6 * u + Math.cos((a0 + a1) / 2) * pr * 1.02, pt + 30 * u, x + 6 * u + Math.cos(a1) * pr, pt + 22 * u + Math.sin(a1) * 4 * u); g.closePath(); g.fill();
  }
  g.fillStyle = '#ffc857'; g.beginPath(); g.arc(x + 6 * u, pt - 2 * u, 3 * u, 0, 6.283); g.fill();
  // vendor behind the counter
  person(g, x - 20 * u, y - 30 * u, u * 1.25, { shirt: '#2aa58a', hat: false });
  // lantern
  const lx = x + 40 * u, ly = pt + 30 * u + Math.sin(t * 1.6) * 1.5 * u;
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, pt + 22 * u); g.lineTo(lx, ly - 6 * u); g.stroke();
  glow(g, lx, ly, 18 * u, '239,122,85', .35); g.fillStyle = '#d94f3c'; g.beginPath(); g.ellipse(lx, ly, 5 * u, 6.5 * u, 0, 0, 6.283); g.fill();
  // cart body
  g.fillStyle = '#1f8f94'; rrect(g, x - 52 * u, y - 36 * u, 104 * u, 28 * u, 5 * u); g.fill();
  g.fillStyle = '#ffc857'; g.fillRect(x - 52 * u, y - 26 * u, 104 * u, 3 * u);
  g.fillStyle = '#9a6538'; rrect(g, x - 56 * u, y - 40 * u, 112 * u, 6 * u, 3 * u); g.fill();
  const n = Math.min(7, Math.ceil(Math.log10(1 + bagsTotal()) * 2.4));
  for (let k = 0; k < n; k++) bagShape(g, x - 40 * u + k * 13 * u, y - 40 * u, [25, 50, 100][k % 3], u * .95);
  g.fillStyle = '#f6f0de'; g.font = `800 ${12 * u}px "Baloo 2",sans-serif`; g.textAlign = 'center'; g.fillText('PRODEJ', x, y - 13 * u);
  // wheels
  [-34, 34].forEach(dx => { g.fillStyle = '#1a1a1e'; g.beginPath(); g.arc(x + dx * u, y - 4 * u, 8 * u, 0, 6.283); g.fill(); g.strokeStyle = '#8a8a92'; g.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(x + dx * u - Math.cos(a) * 6 * u, y - 4 * u - Math.sin(a) * 6 * u); g.lineTo(x + dx * u + Math.cos(a) * 6 * u, y - 4 * u + Math.sin(a) * 6 * u); g.stroke(); } });
  // steam from the pot
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); for (let j = 0; j < 7; j++) { const yy = y - 46 * u - j * 5 * u, xx = x + 30 * u + k * 6 * u + Math.sin(t * 3 + j * .7 + k) * 3; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  g.fillStyle = '#5c646b'; rrect(g, x + 26 * u, y - 48 * u, 18 * u, 9 * u, 3 * u); g.fill();
}
function garage(g, x, y, u, open) {
  g.fillStyle = '#16181c'; rrect(g, x - 46 * u, y - 52 * u, 92 * u, 52 * u, 3); g.fill();
  g.fillStyle = '#ffc857'; g.fillRect(x - 46 * u, y - 56 * u, 92 * u, 5 * u);
  g.fillStyle = '#2f3440'; rrect(g, x - 40 * u, y - 46 * u + (open ? 30 * u : 0), 80 * u, 46 * u - (open ? 30 * u : 0), 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { const yy = y - 46 * u + k * 8 * u; if (yy < y) { g.beginPath(); g.moveTo(x - 40 * u, yy); g.lineTo(x + 40 * u, yy); g.stroke(); } }
}
function neon(g, x, y, text, col, t, u) {
  const fl = .75 + .25 * Math.sin(t * 9 + x) * Math.sin(t * 3.1);
  g.font = `800 ${11 * u}px "Baloo 2",sans-serif`; const w = g.measureText(text).width + 12 * u;
  g.fillStyle = 'rgba(10,8,20,.7)'; rrect(g, x - w / 2, y - 9 * u, w, 18 * u, 4 * u); g.fill();
  glow(g, x, y, 34 * u, col, .28 * fl); g.fillStyle = `rgba(${col},${.85 * fl + .15})`; g.textAlign = 'center'; g.fillText(text, x, y + 4 * u);
}
function drawDist(g, t, dt) {
  const L = LAY, u = L.u;
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#120c33'], [.45, '#3a2262'], [.6, '#5a2c6a'], [1, '#1a1426']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(246,240,222,${.18 + .35 * Math.abs(Math.sin(t * 1.1 + i * 1.7))})`; g.fillRect(R(i) * W, R(i + 20) * F(.2), 1.2, 1.2); }
  glow(g, W * .82, F(.02), 56, '220,225,255', .14); g.fillStyle = '#e4e8f0'; g.beginPath(); g.arc(W * .82, F(.02), 10, 0, 6.283); g.fill();
  const Lc = S.loc;
  g.fillStyle = '#2a1d4a';
  for (let i = 0; i < 10 + Lc * 3; i++) { const bw = 16 + R(i) * 28, bh = (L.yB - F(.05)) * (.25 + R(i + 5) * (.25 + Lc * .08)); g.fillRect(R(i + 11) * W - bw / 2, L.yB - bh, bw, bh); g.fillStyle = 'rgba(255,214,150,.35)'; for (let k = 0; k < 4; k++) if (R(i * 9 + k) > .5) g.fillRect(R(i + 11) * W - bw / 2 + 3 + R(k + i) * (bw - 6), L.yB - bh + 4 + k * bh / 5, 2, 2); g.fillStyle = '#2a1d4a'; }
  if (Lc >= 4) { const tx = W * .6; [-10, 10].forEach(dx => { g.fillStyle = '#1e1838'; g.beginPath(); g.moveTo(tx + dx - 7, L.yB); g.lineTo(tx + dx - 6, F(.02)); g.lineTo(tx + dx, F(-.06)); g.lineTo(tx + dx + 6, F(.02)); g.lineTo(tx + dx + 7, L.yB); g.closePath(); g.fill(); glow(g, tx + dx, F(-.06), 6, '239,122,85', .6 + .4 * Math.sin(t * 3 + dx)); }); g.fillRect(tx - 5, F(.12), 10, 3); }
  if (Lc === 3 || Lc === 5) { g.strokeStyle = '#2a2244'; g.lineWidth = 3; for (let k = 0; k < 2; k++) { const cx = W * (.12 + k * .16); g.beginPath(); g.moveTo(cx, L.yB); g.lineTo(cx, F(.04)); g.lineTo(cx + 40, F(.04)); g.moveTo(cx - 10, F(.04)); g.lineTo(cx, F(.04)); g.stroke(); glow(g, cx + 40, F(.04), 5, '255,200,87', .6 + .4 * Math.sin(t * 2 + k)); } }
  // pastel shophouses with five-foot-way arcades
  let x = -10, i = 0;
  while (x < W + 10) {
    const bw = 62 * u + R(i + 100) * 34 * u, fl = 2 + (R(i + 200) > .55 ? 1 : 0), bh = fl * 30 * u + 22 * u;
    const base = ['#3e8f80', '#c4704f', '#c9a443', '#b65e78', '#6f68b5'][i % 5];
    g.fillStyle = base; g.fillRect(x, L.yB - bh, bw - 2, bh); g.fillStyle = 'rgba(10,8,30,.36)'; g.fillRect(x, L.yB - bh, bw - 2, bh);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, L.yB - bh, bw - 2, 4 * u);
    g.fillStyle = lc(base, '#000', .5); g.beginPath(); g.moveTo(x - 2, L.yB - bh); g.lineTo(x + bw / 2, L.yB - bh - 8 * u); g.lineTo(x + bw, L.yB - bh); g.closePath(); g.fill();
    for (let f = 0; f < fl; f++) for (let w = 0; w < 3; w++) {
      const wx = x + 8 * u + w * (bw - 18 * u) / 3, wy = L.yB - bh + 12 * u + f * 30 * u, ww = (bw - 24 * u) / 3 - 2, wh = 15 * u;
      const on = R(i * 13 + f * 5 + w + Math.floor(t / (6 + R(i + w) * 9))) > .45;
      g.fillStyle = on ? `rgba(255,214,150,${.6 + .1 * Math.sin(t * 2 + w)})` : 'rgba(10,10,20,.75)'; rrect(g, wx, wy, ww, wh, ww / 2 > 6 ? 6 : 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(wx - 1, wy + wh, ww + 2, 2);
      if (on) glow(g, wx + ww / 2, wy + wh / 2, 16, '255,214,150', .07);
    }
    g.fillStyle = 'rgba(8,6,18,.85)'; g.fillRect(x + 4, L.yB - 18 * u, bw - 10, 18 * u);
    for (let a = 0; a < 3; a++) { const ax = x + 4 + a * (bw - 10) / 3; g.fillStyle = `rgba(255,200,130,${.18 + .08 * Math.sin(t + a + i)})`; g.beginPath(); g.moveTo(ax + 3, L.yB); g.lineTo(ax + 3, L.yB - 12 * u); g.quadraticCurveTo(ax + (bw - 10) / 6, L.yB - 20 * u, ax + (bw - 10) / 3 - 3, L.yB - 12 * u); g.lineTo(ax + (bw - 10) / 3 - 3, L.yB); g.fill(); }
    x += bw; i++;
  }
  neon(g, W * .3, L.yB - 64 * u, 'KOPI', '110,230,200', t, u);
  neon(g, W * .7, L.yB - 78 * u, 'MAKAN', '255,110,160', t, u);
  // lanterns
  const ly0 = F(.12);
  g.strokeStyle = 'rgba(246,240,222,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly0); for (let k = 0; k <= 20; k++) g.lineTo(k / 20 * W, ly0 + Math.sin(k / 20 * Math.PI * 3) * 6 + 6); g.stroke();
  for (let k = 1; k < 9; k++) { const lx = k / 9 * W, ly = ly0 + Math.sin(k / 9 * Math.PI * 3) * 6 + 13 + Math.sin(t * 1.5 + k) * 1.5; glow(g, lx, ly, 18, '239,122,85', .24); g.fillStyle = '#d94f3c'; g.beginPath(); g.ellipse(lx, ly, 5, 6.5, 0, 0, 6.283); g.fill(); g.fillStyle = '#ffc857'; g.fillRect(lx - 2.5, ly - 8, 5, 2); g.fillRect(lx - 1, ly + 6, 2, 4); }
  // sidewalk with palms
  g.fillStyle = '#4a4058'; g.fillRect(0, L.yB, W, L.walk - L.yB + 8 * u);
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let xx = 0; xx < W; xx += 24 * u) { g.beginPath(); g.moveTo(xx, L.yB); g.lineTo(xx, L.walk + 8 * u); g.stroke(); }
  palm(g, W * .42, L.walk + 2 * u, 96 * u, .15, t, .35, 21);
  // road
  g.fillStyle = '#5a5468'; g.fillRect(0, L.walk + 8 * u, W, 4 * u);
  g.fillStyle = grad(g, 0, L.walk + 12 * u, 0, H, [[0, '#2a2438'], [1, '#1c1828']]); g.fillRect(0, L.walk + 12 * u, W, H - L.walk);
  g.fillStyle = 'rgba(246,240,222,.2)'; for (let xx = ((-t * 0) % 34); xx < W; xx += 34 * u) g.fillRect(xx, (L.lane1 + L.lane2) / 2 - 2 * u, 16 * u, 2.5 * u);
  [W * .1, W * .66].forEach(lx => {
    g.strokeStyle = '#3a3448'; g.lineWidth = 3; g.beginPath(); g.moveTo(lx, L.walk + 8 * u); g.lineTo(lx, F(.22)); g.lineTo(lx + 12, F(.22)); g.stroke();
    g.fillStyle = grad(g, 0, F(.22), 0, H, [[0, 'rgba(255,220,160,.12)'], [1, 'rgba(255,220,160,0)']]);
    g.beginPath(); g.moveTo(lx + 7, F(.23)); g.lineTo(lx + 17, F(.23)); g.lineTo(lx + 64, H); g.lineTo(lx - 40, H); g.closePath(); g.fill(); glow(g, lx + 12, F(.23), 12, '255,220,160', .55);
    g.fillStyle = 'rgba(255,220,160,.12)'; g.beginPath(); g.ellipse(lx + 14, (L.lane1 + L.lane2) / 2 + 10 * u, 26 * u, 5 * u, 0, 0, 6.283); g.fill();
  });
  garage(g, W * .86, L.walk - 2 * u, u, own('couriers') > 0 && flows.sell > 0);
  const selling = flows.sell > 0;
  const nd = own('dealers'), nc = own('couriers');
  for (let k = 0; k < nd; k++) if (!selling) scooter(g, W * .5 + k * 22 * u, L.walk + 2 * u, u * 1.05, 1, t, false, ['#e0533f', '#2f86c9', '#e8a92c', '#2aa58a', '#9a6be0'][k], tierOf(S.lv.dealers[k]));
  for (let k = 0; k < nc; k++) if (!selling) van(g, W * .86 + (k ? -30 : 0) * u, L.walk - 2 * u, u * 1.05, -1, t, tierOf(S.lv.couriers[k]));
  stall(g, L.stall.x, L.stall.y, u, t);
  // traffic in front of the cart
  if (selling) {
    for (let k = 0; k < nc; k++) {
      const dir = k % 2 ? -1 : 1, ph = (t * (.05 + k * .012) + k * .5) % 1, vx = dir > 0 ? lerp(-70, W + 70, ph) : lerp(W + 70, -70, ph);
      van(g, vx, dir > 0 ? L.lane2 : L.lane1, u * 1.15, dir, t, tierOf(S.lv.couriers[k]));
    }
    for (let k = 0; k < nd; k++) {
      const dir = k % 2 ? -1 : 1, col = ['#e0533f', '#2f86c9', '#e8a92c', '#2aa58a', '#9a6be0'][k];
      const sp = (.09 + R(k) * .05) * (1 + Math.log10(S.lv.dealers[k] || 1) * .35);
      const ph = (t * sp + k * .27) % 1, vx = dir > 0 ? lerp(-50, W + 50, ph) : lerp(W + 50, -50, ph);
      const vy = (dir > 0 ? L.lane2 : L.lane1) - Math.abs(Math.sin(t * 9 + k)) * .6;
      g.fillStyle = `rgba(${dir > 0 ? '255,240,200' : '255,80,80'},.08)`; g.beginPath(); g.ellipse(vx, vy + 4 * u, 30 * u, 4 * u, 0, 0, 6.283); g.fill();
      scooter(g, vx, vy, u * 1.15, dir, t, true, col, tierOf(S.lv.dealers[k]));
      if (Math.random() < dt * Math.min(3, .5 + flows.sell * .2)) vis.coins.push({ x: vx, y: vy - 34 * u, vy: -50, life: 1 });
    }
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
  UNITS.forEach(u => { const a = o.lv[u.id] = (o.lv[u.id] || []).slice(); while (a.length < u.max) a.push(0); if (u.id !== 'trees') a.length = u.max; });
  if (!o.lv.trees[0]) o.lv.trees[0] = 1;
  // only 100 g bags now: older bag stock is repacked
  o.b100 = (o.b100 || 0) + (o.b25 || 0) / 4 + (o.b50 || 0) / 2; o.b25 = 0; o.b50 = 0; o.bag = 100;
  // only two trees now: the extra trees' output is folded into tree 2 as levels
  if (st && st.lv && st.lv.trees && st.lv.trees.length > 2) {
    const tu = UBY.trees, old = st.lv.trees; let P = 0;
    old.forEach((L, i) => { if (i >= 1 && L > 0) P += slotM(tu, i) * lvPow(L); });
    let L1 = Math.max(old[1] | 0, P > 0 ? 1 : 0);
    while (P > 0 && slotM(tu, 1) * lvPow(L1) < P && L1 < 5000) L1++;
    o.lv.trees = [Math.max(1, old[0] | 0), L1];
  }
  o.lv.trees.length = 2;
  o.shops = Array.from({ length: SHOPS.length }, (_, i) => (o.shops && o.shops[i]) | 0);
  o.brand = o.brand | 0;
  o.ul = Object.assign({}, (st && st.ul) || {});
  if (!(st && st.ul) && o.upg) {   // old saves: every bought one-off upgrade becomes one level of its line
    for (const k of Object.keys(o.upg)) {
      if (!o.upg[k]) continue;
      const m = k.match(/^(price|heat|hand|cap)\d+$/), uid = !m && UNITS.find(u => k === u.id + k.slice(u.id.length) && /^\d+$/.test(k.slice(u.id.length)));
      const key = m ? m[1] : uid ? 'u_' + uid.id : null;
      if (key) o.ul[key] = (o.ul[key] | 0) + 1;
    }
  }
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
  S.xpLv = xpLevel(S.total); paintLevel();
  setTab('farm');
  requestAnimationFrame(() => { resize(); offline(); render(true); });
}
function logout() { save(); store.del(LK); showLogin(); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* login background: a dusk orchard */
const lcv = $('lcv'), lg = lcv.getContext('2d'); let LW = 0, LH = 0;
function sizeLogin() { LW = innerWidth; LH = innerHeight; const d = Math.min(devicePixelRatio || 1, 2); lcv.width = LW * d; lcv.height = LH * d; lg.setTransform(d, 0, 0, d, 0, 0); }
function drawLogin(t) {
  const g = lg, W2 = LW, H2 = LH, sea = H2 * .42;
  g.fillStyle = grad(g, 0, 0, 0, sea, [[0, '#1b1440'], [.55, '#8a3d6e'], [1, '#f0905a']]); g.fillRect(0, 0, W2, sea + 1);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(246,240,222,${.15 + .3 * Math.abs(Math.sin(t * 1.2 + i * 2.3))})`; g.fillRect(R(i) * W2, R(i + 40) * sea * .5, 1.3, 1.3); }
  for (let k = 0; k < 3; k++) cloud(g, ((R(k + 40) * W2 * 1.5 + t * (5 + k * 2)) % (W2 + 160)) - 80, sea * (.25 + R(k + 41) * .35), .8 + R(k) * .4, .18);
  glow(g, W2 * .3, sea - 6, 150, '255,190,110', .55); g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(W2 * .3, sea - 4, 36, Math.PI, 0); g.fill();
  g.fillStyle = grad(g, 0, sea, 0, H2 * .56, [[0, '#d86f5a'], [.35, '#3a5f7a'], [1, '#1d3a4a']]); g.fillRect(0, sea, W2, H2 * .14 + 1);
  g.fillStyle = 'rgba(255,215,150,.55)'; for (let k = 0; k < 12; k++) g.fillRect(W2 * .3 - 26 + R(k + 300) * 52 + Math.sin(t * 1.5 + k) * 4, sea + 4 + k * 5, 14 + R(k) * 22, 1.6);
  g.fillStyle = '#16302a'; g.beginPath(); g.moveTo(0, H2); for (let x = 0; x <= W2 + 8; x += 8) g.lineTo(x, H2 * .55 + Math.sin(x * .02) * 8 + Math.sin(x * .07) * 3); g.lineTo(W2, H2); g.closePath(); g.fill();
  const d = Math.min(devicePixelRatio || 1, 2), u = Math.min(W2 / 390, H2 / 800);
  palm(g, -W2 * .03, H2 * .6, 130 * u, .35, t, .25, 2);
  [[.72, .445, .7], [.88, .45, .55]].forEach(([x, y, s], i) => kratom(g, W2 * x, H2 * y, Math.round(s * u * 20) / 20, 0, i, t, .55, .75, 12 + i * 10));
  for (let i = 0; i < 10; i++) { const fx = (R(i + 9) * W2 + Math.sin(t * .4 + i) * 40) % W2, fy = H2 * (.42 + R(i + 3) * .2) + Math.cos(t * .7 + i) * 10; glow(g, fx, fy, 7, '214,240,160', .3 + .3 * Math.sin(t * 3 + i * 2)); }
  g.fillStyle = grad(g, 0, H2 * .5, 0, H2, [[0, 'rgba(15,26,28,0)'], [.3, 'rgba(15,26,28,.85)'], [1, '#0f1a1c']]); g.fillRect(0, H2 * .5, W2, H2 * .5);
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
    const tp = [[.28, .52], [.72, .47]];
    L.trees = tp.map(([x, y], i) => {
      const Lv = S.lv.trees[i] || 1;
      return { x: W * x, y: F(y), s: Math.round(u * .74 * (.95 + Math.min(.3, Math.log10(Lv) * .18)) * 20) / 20 };
    });
    L.racks = [.16, .5, .84].map(x => ({ x: W * x, y: F(.845), w: Math.min(W * .25, 110 * u) }));
    L.shed = { x: W * .86, y: F(.09) };
    L.trees.forEach((o, i) => {
      if (S.lv.trees[i]) { L.objs.push({ k: 'tree', i, x: o.x - 50 * o.s, y: o.y - 118 * o.s, w: 100 * o.s, h: 122 * o.s }); L.pills.push({ key: 'trees' + i, kind: 'slot', id: 'trees', i, x: o.x, y: o.y + 8, a: 'top' }); }
      else if (i === own('trees')) L.pills.push({ key: 'trees' + i, kind: 'ghost', id: 'trees', i, x: o.x, y: o.y - 18, a: 'bottom' });
    });
    L.racks.forEach((o, i) => {
      if (S.lv.racks[i]) { L.objs.push({ k: 'rack', i, x: o.x - o.w / 2, y: o.y - 40 * u, w: o.w, h: 44 * u }); L.pills.push({ key: 'racks' + i, kind: 'slot', id: 'racks', i, x: o.x, y: o.y + 8, a: 'top', sm: true }); }
      else if (i === own('racks')) L.pills.push({ key: 'racks' + i, kind: 'ghost', id: 'racks', i, x: o.x, y: o.y + 8, a: 'top', sm: true, nolbl: i === 2 });
    });
    L.tarp = { x: W * .4, y: F(.14), w: 84 * u };
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
    L.yB = F(.50); L.walk = F(.58); L.lane1 = F(.86); L.lane2 = F(.975);
    L.stall = { x: W * .22, y: F(.745) };
    L.objs.push({ k: 'stall', x: L.stall.x - 60 * u, y: L.stall.y - 120 * u, w: 124 * u, h: 128 * u });
    L.pills.push({ key: 'dealers', kind: 'hub', id: 'dealers', x: W * .58, y: L.walk + 20 * u, a: 'top' });
    L.pills.push({ key: 'couriers', kind: 'hub', id: 'couriers', x: W * .86, y: L.walk - 62 * u, a: 'bottom' });
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
    bg.innerHTML = `<div class="bag1"><svg viewBox="0 0 20 24" width="26" height="30"><path d="M3 4h14l1 18H2z" fill="#ecebe7"/><rect x="5" y="10" width="10" height="7" rx="1.5" fill="#a5a07c"/><rect x="3" y="4" width="14" height="2" fill="#5f9a45"/></svg><div><b>Sáček 100 g</b><small></small></div></div>`;
    bg.style.left = '12px'; bg.style.top = (TOP + 2) + 'px';
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
      const st = `${o}/${u.max}`, sm = el.querySelector('small'); if (sm.textContent !== st) { sm.textContent = st; relayout = true; }
      el.classList.toggle('can', hubAffordable(p.id));
      el.classList.toggle('neck', neck === p.id);
    } else if (p.kind === 'ghost') {
      const c = unlockCost(u, p.i), t = '$' + fmt(c);
      const bt = el.querySelector('b'); if (bt.textContent !== t) { bt.textContent = t; relayout = true; }
      el.classList.toggle('ok', c <= S.cash);
    } else {
      const L = S.lv[p.id][p.i], n = buyAmt === 'max' ? Math.max(1, lvMax(u, L, p.i)) : buyAmt, c = lvCost(u, L, n, p.i);
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
  if (bg) { const t = rm(bagPrice(100)) + ' za kus'; const sm = bg.querySelector('small'); if (sm.textContent !== t) sm.textContent = t; }
}
const HINTS = {
  harvest: { tab: 'farm', text: 'Ťukni na strom: sklizeň', at: () => { const o = LAY.objs.find(x => x.k === 'tree'); return o && [o.x + o.w / 2, o.y + 6]; } },
  dry: { tab: 'farm', text: 'Ťukni na plachtu: sušení', at: () => { const o = LAY.objs.find(x => x.k === 'tarp'); return o && [o.x + o.w / 2, o.y - 2]; } },
  grind: { tab: 'proc', text: 'Ťukni na hmoždíř: drcení', at: () => { const o = LAY.objs.find(x => x.k === 'mortar'); return o && [o.x + o.w / 2, o.y - 4]; } },
  pack: { tab: 'proc', text: 'Ťukni na pás: balení', at: () => { const o = LAY.objs.find(x => x.k === 'belt'); return o && [o.x + o.w / 2, o.y + 6]; } },
  sell: { tab: 'dist', text: 'Ťukni na vozík: prodej', at: () => { const o = LAY.objs.find(x => x.k === 'stall'); return o && [o.x + o.w / 2, o.y - 4]; } }
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
  return S.lv[id].some((L, i) => L > 0 && lvCost(u, L, 1, i) <= S.cash);
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
  const n = buyAmt === 'max' ? lvMax(u, L, i) : buyAmt;
  const c = lvCost(u, L, Math.max(1, n), i);
  if (n < 1 || c > S.cash) { toast(`Chybí ${rm(c - S.cash)}`); vib(4); return false; }
  S.cash -= c; S.lv[u.id][i] = L + n;
  if (tierOf(L + n) > tierOf(L)) toast(`${u.unit} ${i + 1}: nový ${TIER_NAME[tierOf(L + n)]} vzhled`);
  else if (Math.floor((L + n) / MS) > Math.floor(L / MS)) toast(`${u.unit} ${i + 1}: Lv ${Math.floor((L + n) / MS) * MS}, rychlost +75 %`);
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
  const up = UPBY[id]; if (!up) return;
  const n = upLv(id), c = upCost(up, n);
  if (S.cash < c) { toast(`Chybí ${rm(c - S.cash)}`); return; }
  S.cash -= c; S.ul[id] = n + 1; vib(12); toast(`${upName(up, n)} · Lv ${n + 1}`); buildEmp(); render(true); save();
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
      const n = buyAmt === 'max' ? Math.max(1, lvMax(u, L, i)) : buyAmt, c = lvCost(u, L, n, i);
      row.className = 'slotrow'; lvb.innerHTML = `${L}<small>Lv</small>`;
      const nt = TIER_LV[tierOf(L) + 1]; sp.textContent = `${fmt(slotRate(id, L, i))} ${u.ru} · ${L % MS}/${MS} do bonusu${nt ? ` · nový vzhled Lv ${nt}` : ''}`; bar.style.display = ''; bar.firstChild.style.width = (L % MS) / MS * 100 + '%';
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
function brandCard() {
  const steps = BRAND.map((b, i) => `<i class="${i < S.brand ? 'on' : i === S.brand ? 'nx' : ''}"></i>`).join('');
  const done = BRAND.slice(0, S.brand).map(b => b.n).join(' → ');
  const nb = BRAND[S.brand];
  return `<div class="loccard brand"><div class="steps">${steps}</div>
    ${done ? `<p class="bdone">${done}</p>` : ''}
    ${nb ? `<h3>${nb.n}</h3><p>${nb.d}</p><div class="stats3"><span><b>${nb.eff}</b></span></div>
      <button class="cta${S.cash >= nb.cost ? ' ok' : ''}" id="brandBtn">${S.brand ? 'Rozšířit značku' : 'Založit značku'} ${COIN}${fmt(nb.cost)}</button>`
      : `<h3>Globální značka je tvoje</h3><p>Vylepšuj prodejny a sleduj, jak čísla rostou.</p>`}</div>`;
}
function shopMap() {
  const pins = SHOPS.map((sh, j) => {
    const [x, y] = sh.xy, L = S.shops[j], nx = !L && (j === 0 || S.shops[j - 1]);
    return `<g>${L ? `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="3" fill="#ffc857" stroke="#0f1a1c" stroke-width="2"/><path d="M${x - 3} ${y - 1}h6v4h-6z" fill="#0f1a1c"/>`
      : `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="3" fill="${nx ? 'rgba(255,200,87,.2)' : 'rgba(246,240,222,.12)'}" stroke="${nx ? '#ffc857' : 'rgba(246,240,222,.25)'}" stroke-width="1.5" ${nx ? 'stroke-dasharray="3 2"' : ''}/>`}
      <text x="${x + sh.lb[0]}" y="${y + sh.lb[1]}" text-anchor="${sh.lb[2]}" font-family="Baloo 2,sans-serif" font-weight="${L ? 800 : 600}" font-size="10" fill="${L ? '#f6f0de' : 'rgba(246,240,222,.45)'}">${sh.n}${L ? ' · ' + L : ''}</text></g>`;
  }).join('');
  return `<div class="mapwrap"><svg viewBox="0 0 240 300" role="img" aria-label="Mapa tvých prodejen">
    <path d="M58 22C86 12 124 16 152 22c20 4 34 20 32 42-3 22-14 38-17 58-3 25 5 50 13 80 8 30 14 55 4 75-10 18-32 18-42 6-12-18-22-40-35-58C93 205 81 191 73 171c-10-24-14-50-18-72-4-20-14-38-12-56 2-14 8-19 15-21z" fill="#1d3b2f" stroke="rgba(154,214,114,.35)" stroke-width="1.5"/>
    ${pins}</svg></div>`;
}
function shopRow(j) {
  const L = S.shops[j], c = shopNext(j), open = isFinite(c);
  return `<div class="upg${open ? '' : ' off'}"><div class="ul${L ? '' : ' z'}"><b>${L}</b><small>Lv</small></div>
    <div class="ut"><b>${SHOPS[j].n}</b><span>${L ? `${rm(shopRate(j, L))}/s · další level +${rm(shopRate(j, L + 1) - shopRate(j, L))}/s` : open ? `Nová prodejna · ${rm(shopRate(j, 1))}/s` : 'Nejdřív předchozí město'}</span></div>
    ${open ? `<button class="cta${S.cash >= c ? ' ok' : ''}" data-s="${j}">${COIN}${fmt(c)}</button>` : ''}</div>`;
}
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
  const open = UPG.map(u => ({ u, n: upLv(u.id), c: upCost(u, upLv(u.id)) })).sort((a, b) => a.c - b.c);
  const doneN = UPG.reduce((a, u) => a + upLv(u.id), 0);
  const units = UNITS.reduce((a, u) => a + lvSum(u.id), 0);
  const stats = [['Celkem vyděláno', rm(S.total)], ['Prodáno', kg(S.sold)], ['Sáčků prodáno', fint(S.bagsSold)], ['Levelů celkem', fmt(units)], ['Levely vylepšení', fmt(doneN)], ['Razie', S.raids], ['Ruční akce', fmt(S.taps)], ['Hraješ', fmtTime(Date.now() - S.start)]];
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  $('emp').innerHTML = `
    <div class="prof"><div class="avatar" aria-hidden="true">${esc(initial(me.name))}</div><div class="grow"><b>${esc(me.name)}</b><span>Šéf Lv ${xpLevel(S.total)} · ${LOCS[S.loc].n} · cena +${fmt((xpMult() - 1) * 100)} %</span></div><button class="ghostbtn" id="logoutBtn">Odhlásit</button></div>
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
    <h2>Značka</h2>
    ${brandCard()}
    ${S.brand ? `<h2>Moje prodejny <span class="h2s" id="shopInc">${rm(shopIncome())}/s</span></h2>${shopMap()}<div class="shops">${SHOPS.map((sh, j) => shopRow(j)).join('')}</div>` : ''}
    <h2>Vylepšení</h2>
    ${open.map(({ u, n, c }) => `<div class="upg"><div class="ul${n ? '' : ' z'}"><b>${n}</b><small>Lv</small></div><div class="ut"><b>${upName(u, n)}</b><span>${u.eff(n)}</span></div><button class="cta${S.cash >= c ? ' ok' : ''}" data-u="${u.id}">${COIN}${fmt(c)}</button></div>`).join('')}
    <h2>Statistiky</h2>
    <div class="statgrid">${stats.map(([a, b]) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`).join('')}</div>
    ${!standalone ? `<h2>Aplikace</h2><div class="loccard"><p>${deferredInstall ? 'Přidej hru na plochu a hraj na celou obrazovku i offline.' : 'Na iPhonu: Sdílet → Přidat na plochu. Na Androidu: menu prohlížeče → Instalovat aplikaci.'}</p>${deferredInstall ? '<button class="cta ok" id="installBtn">Nainstalovat aplikaci</button>' : ''}</div>` : ''}
    <button class="danger" id="resetBtn">Smazat postup profilu ${esc(me.name)}</button>`;
  $('logoutBtn').onclick = logout;
  if ($('brandBtn')) $('brandBtn').onclick = buyBrand;
  $('emp').querySelectorAll('[data-s]').forEach(b => b.onclick = () => buyShop(+b.dataset.s));
  if ($('locBtn')) $('locBtn').onclick = () => buyLoc(S.loc + 1);
  $('emp').querySelectorAll('[data-u]').forEach(b => b.onclick = () => buyUpg(b.dataset.u));
  if ($('installBtn')) $('installBtn').onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; buildEmp(); };
  let armed = 0;
  $('resetBtn').onclick = () => {
    if (Date.now() - armed < 3000) { S = normalize(null); vis.treeBorn = [0]; save(); toast('Postup smazán'); setTab('farm'); return; }
    armed = Date.now(); $('resetBtn').textContent = 'Ťukni znovu pro potvrzení';
  };
}
function paintLevel() {
  const L = xpLevel(S.total), a = xpAt(L), b = xpAt(L + 1), f = clamp((S.total - a) / Math.max(1, b - a));
  const el = $('avatarBtn'), t = String(L);
  if (el.dataset.l !== t) { el.dataset.l = t; el.innerHTML = `<b>${L}</b><small>Lv</small>`; el.setAttribute('aria-label', `Úroveň šéfa ${L}, impérium`); }
  el.style.setProperty('--xp', (f * 100).toFixed(1) + '%');
  if (L > (S.xpLv || 1)) {
    S.xpLv = L; vis.lvPop.boss = performance.now();
    toast(`Úroveň šéfa ${L} · cena sáčku +5 %`); vib([10, 30, 10]); el.classList.remove('lvup'); void el.offsetWidth; el.classList.add('lvup');
  }
}
function buyBrand() {
  const b = BRAND[S.brand]; if (!b) return;
  if (S.cash < b.cost) { toast(`Chybí ${rm(b.cost - S.cash)}`); return; }
  S.cash -= b.cost; S.brand++; vib([20, 30, 20]); toast(`${b.n}: ${b.eff}`); buildEmp(); render(true); save();
}
function buyShop(j) {
  if (!S.brand) return;
  const L = S.shops[j];
  if (!L && j > 0 && !S.shops[j - 1]) return;
  const c = L ? shopLvCost(j, L) : shopCost(j);
  if (S.cash < c) { toast(`Chybí ${rm(c - S.cash)}`); return; }
  S.cash -= c; S.shops[j] = L + 1; vib(L ? 8 : [10, 20, 10]); toast(L ? `${SHOPS[j].n}: Lv ${L + 1}` : `Nová prodejna: ${SHOPS[j].n}`); buildEmp(); render(true); save();
}
function shopNext(j) { const L = S.shops[j]; return L ? shopLvCost(j, L) : (j === 0 || S.shops[j - 1] ? shopCost(j) : Infinity); }
function updateEmp() {
  if (tab !== 'emp') return;
  $('emp').querySelectorAll('[data-u]').forEach(b => { const u = UPBY[b.dataset.u]; b.classList.toggle('ok', S.cash >= upCost(u, upLv(u.id))); });
  const lb = $('locBtn'); if (lb) lb.classList.toggle('ok', S.cash >= LOCS[S.loc + 1].cost);
  const bb = $('brandBtn'); if (bb) bb.classList.toggle('ok', S.cash >= BRAND[S.brand].cost);
  $('emp').querySelectorAll('[data-s]').forEach(b => b.classList.toggle('ok', S.cash >= shopNext(+b.dataset.s)));
  const si = $('shopInc'); if (si) si.textContent = rm(shopIncome()) + '/s';
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
  else if (tab === 'dist') inv = `<div class="chip"><i style="background:#2b3a36">${ICO_BAG}</i>${fint(bagsTotal())}×<span>100 g</span></div><div class="chip"><i style="background:#3a3524">${ICO_POW}</i>${rm(bagPrice(100))}<span>za sáček</span></div>${own('dealers') ? '' : ''}${S.brand ? `<div class="chip"><i style="background:#3a2a4a">${ICO_BAG}</i>${S.shops.filter(x => x > 0).length}<span>prodejen</span></div>` : ''}`;
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
    $('empDot').classList.toggle('on', UPG.some(u => S.cash >= upCost(u, upLv(u.id))) || (S.loc + 1 < LOCS.length && S.cash >= LOCS[S.loc + 1].cost) || (S.brand < BRAND.length && S.cash >= BRAND[S.brand].cost) || (S.brand > 0 && SHOPS.some((_, j) => S.cash >= shopNext(j))));
    paintLevel();
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
// touch hygiene for the phone: no pinch / double-tap zoom, no text selection, no long-press menus
(() => {
  const stop = e => e.preventDefault(), opt = { passive: false };
  const el = e => (e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement) || document.body;
  const typing = e => !!el(e).closest('input,textarea');
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, stop, opt));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, opt);
  document.addEventListener('dblclick', stop, opt);
  document.addEventListener('contextmenu', e => { if (!typing(e)) e.preventDefault(); });
  document.addEventListener('selectstart', e => { if (!typing(e)) e.preventDefault(); });
  // a quick second tap on plain text/background would zoom on older iOS; buttons and the scene keep their taps
  let lastEnd = 0;
  document.addEventListener('touchend', e => {
    const now = e.timeStamp, quick = now - lastEnd < 320; lastEnd = now;
    if (quick && e.touches.length === 0 && !el(e).closest('button,a,input,textarea,select,label,[data-p],[data-i],[data-u],#stage,#scrim,#ov')) e.preventDefault();
  }, opt);
})();
// pill widths depend on the web font: re-measure once it has loaded
if (document.fonts) { document.fonts.ready.then(() => { layKey = ''; }); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { layKey = ''; }); }
if (location.hash === '#debug') window.__k = { L: () => LAY, S: () => S, tab: () => tab };
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(() => {});
(() => {
  const lastId = store.get(LK, null), p = profiles.find(x => x.id === lastId);
  if (p) enter(p); else showLogin();   // stay signed in until you log out; the PIN only guards switching profiles
  requestAnimationFrame(t => { last = t; loop(t); });
})();

})();
