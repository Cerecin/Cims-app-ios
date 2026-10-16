(function(){var M={"Cims":"Cumes","3000 Pirineu":"3000 Pirineo","Sostres":"Teitos","☰ Filtres":"☰ Filtros","Mantén premut el mapa per afegir un punt":"Mantén premido o mapa para engadir un punto","Rutes":"Rutas","Resum":"Resumo","Llistes":"Listas","Fites":"Fitos","Punts":"Puntos","Cerca":"Busca","Dades i còpies":"Datos e copias","Cerca un cim…":"Busca un cume…","Filtres":"Filtros","La meva ubicació":"A miña ubicación","Capes":"Capas","Cerca als meus punts…":"Busca nos meus puntos…","Afegir punt":"Engadir punto"};function tx(n){var t=n.nodeValue,k=t.trim();if(k&&M[k]!=null)n.nodeValue=t.replace(k,M[k])}function run(){var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),n;while((n=w.nextNode()))tx(n);["placeholder","aria-label","title","alt"].forEach(function(a){document.querySelectorAll("["+a+"]").forEach(function(e){var k=e.getAttribute(a).trim();if(M[k]!=null)e.setAttribute(a,M[k])})});document.documentElement.setAttribute("lang","gl")}if(document.body)run();else document.addEventListener("DOMContentLoaded",run)})();
/* Cims · seguiment de 100 Cims FEEC, tresmils i sostres comarcals */
(function () {
  'use strict';
  var D = window.DATA, SEED = window.SEED;
  var KEY = 'cimsState.v1';
  var NATIVE = window.Android || null;
  var IOS_TOUCH = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Versió web (PWA): sense el pont d'Android l'estat es desa també a IndexedDB (localStorage té un límit de ~5 MB).
  // index.html el llegeix abans d'arrencar l'app i el deixa a window.__IDB_STATE.
  var wsDbP = null, wsWarned = false;
  function webStateDb() {
    if (!wsDbP) wsDbP = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej('no idb');
      var r = indexedDB.open('cimsState', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return wsDbP;
  }
  function webStateSave(raw, lsOk) {
    if (window.__IDB_UNKNOWN) return;  // no s'ha pogut llegir l'estat desat: no el trepitgem
    webStateDb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(raw, 'state');
        t.oncomplete = res; t.onerror = t.onabort = function () { rej(t.error); };
      });
    }).catch(function () {
      if (!lsOk && !wsWarned) { wsWarned = true; toast('Non se puido gardar no navegador. Fai unha copia a man (⋯ → Exportar)'); }
    });
  }

  // ---------- helpers ----------
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’´`]/g, "'"); }
  function fmtAlt(h) { return h == null || h === '' ? '' : (h % 1 ? (Math.round(h * 10) / 10).toLocaleString('ca-ES', { minimumFractionDigits: 1 }) : Math.round(h).toLocaleString('ca-ES')) + ' m'; }
  function fmtDate(d) { if (!d) return ''; var p = d.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; }
  function today() { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function dist(a, b, c, d) { var R = 6371, p = Math.PI / 180, x = Math.sin((c - a) * p / 2), y = Math.sin((d - b) * p / 2); return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a * p) * Math.cos(c * p) * y * y)); }
  function toast(msg, actLabel, actFn) {
    var t = $('#toast'); t.textContent = msg;
    if (actLabel) { var b = document.createElement('button'); b.className = 'toast-act'; b.textContent = actLabel; b.onclick = function () { t.classList.add('hidden'); actFn(); }; t.appendChild(b); }
    t.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, actLabel ? 5000 : 2600);
  }

  // ---------- data indexes ----------
  var F = D.feec, U = D.uiaa, CAT = D.cat, SOS = D.sostres, AL = D.alps || [];
  var aById = {}; AL.forEach(function (a) { aById[a.id] = a; });
  var N_AP = AL.filter(function (a) { return a.k === 'P'; }).length;
  // Llistes que es fan servir (es poden activar/desactivar al menú)
  var LISTS = [['feec', '100 Cims FEEC', 'Inclúe as comarcas e o mapa de esenciais'], ['sos', 'Teitos comarcais', 'O cume máis alto de cada comarca'], ['cat', '3000 catalás', 'Os tresmiles de Cataluña'], ['uiaa', '3000 do Pirineo', 'Lista de tresmiles do Pirineo (Buyse, altitudes SITAR / ICGC / IGN)'], ['alps', '4000 dos Alpes', 'Lista UIAA: 82 principais e 46 secundarios']];
  function lsOn(l) { return !S || !S.lists || S.lists[l] !== false; }
  function fmtVer(v) { return 'v0.' + v; }
  var fById = {}, uById = {};
  F.forEach(function (f) { fById[f.id] = f; });
  U.forEach(function (u) { uById[u.id] = u; });
  var sostreOf = {}; // feec id -> [comarques]
  SOS.forEach(function (s) { if (s.f) (sostreOf[s.f] = sostreOf[s.f] || []).push(s.com); });
  var N_ESS = F.filter(function (f) { return f.e; }).length;
  var N_P = U.filter(function (u) { return u.k === 'P'; }).length, N_S = U.filter(function (u) { return u.k === 'S'; }).length;
  var CAT_VIG = CAT.filter(function (c) { return c.est === 'Vigent'; });

  // ---------- state ----------
  var S;
  function seedState() {
    var done = {};
    SEED.feec.forEach(function (id) { done['f:' + id] = { d: '' }; });
    SEED.uiaa.forEach(function (id) { done['u:' + id] = { d: '' }; });
    return migrate({ v: 2, done: done, points: JSON.parse(JSON.stringify(SEED.points)), routes: JSON.parse(JSON.stringify(SEED.routes)) });
  }
  function emptyState() { return { v: 3, done: {}, want: {}, points: [], routes: [] }; }
  // v1 -> v2: els tresmils i sostres passen d'identificador per posició (u12, s3) a identificador per nom
  function migrate(s) {
    if (!s) return s;
    var GFIX = { Asturias: 'Astúries', Galicia: 'Galícia' };
    (s.points || []).forEach(function (p) { if (GFIX[p.g]) p.g = GFIX[p.g]; });
    (s.routes || []).forEach(function (r) { if (GFIX[r.g]) r.g = GFIX[r.g]; });
    if (s.v < 3) migrate2(s);
    // cims eliminats de la llista: es purguen de les dades guardades
    ['u:u-sotllo-nord', 'u:u-agulla-nord-de-malavesina'].forEach(function (k) { if (s.done) delete s.done[k]; if (s.want) delete s.want[k]; });
    // v0.68: cims que han sortit de la llista de 3000 del Pirineu. El progrés (data i companys) passa al punt propi
    // (que es crea si no existia), perquè no es perdi res.
    var GONE = { 'u-algas-n': ['Algas N', 3032, 42.76967, -0.27099], 'u-frondella-sw': ['Frondella SW', 3001, 42.82855, -0.29751], 'u-espalda-esparets': ['Espalda Esparets', 3077, 42.67725, 0.04303], 'u-diente-royo': ['Diente Royo', 3010, 42.63615, 0.42807], 'u-hito-e-de-perdiguero': ['Hito E de Perdiguero', 3170, 42.69008, 0.52599], 'u-pico-audoubert': ['Pico Audoubert', 3045, 42.6962, 0.4893], 'u-aguja-de-lliterola': ['Aguja de Lliterola', 3028, 42.70049, 0.52619], 'u-pico-occidental-de-clarabide': ['Pico Occidental de Clarabide', 3008, 42.69416, 0.46397], 'u-pequeno-pico-portillon': ['Pequeño Pico Portillón', 3000, 42.69297, 0.5031], 'u-gendarme-schmidt-endell': ['Gendarme Schmidt-Endell', 3335, null, null], 'u-aguja-escudier': ['Aguja Escudier', 3315, null, null], 'u-besiberri-del-mig-s': ['Besiberri del Mig S', 3003, 42.59989, 0.82494], 'u-besiberri-del-mig-n': ['Besiberri del Mig N', 3002, 42.60062, 0.82568], 'u-pico-celesti-passet': ['Pico Celesti Passet', 3002, 42.58938, 0.82715] };
    if (!s.m68) {
      s.m68 = 1;
      Object.keys(GONE).forEach(function (id) {
        var k = 'u:' + id, rec = s.done && s.done[k];
        if (s.want) delete s.want[k];
        if (!rec) return;
        var A = ascList(rec), ds = [], tx = [];
        A.forEach(function (x) { if (x.d && ds.indexOf(x.d) < 0) ds.push(x.d); if (x.c) { var t = (A.length > 1 && x.d ? fmtDate(x.d) + ': ' : '') + x.c; if (tx.indexOf(t) < 0) tx.push(t); } });
        ds.sort();
        if (rec.nt) tx.push(rec.nt);
        s.points = s.points || [];
        var p = s.points.filter(function (q) { return q.u === id; })[0];
        if (!p) { var g = GONE[id]; p = { id: uid(), g: 'Cims', n: g[0], h: g[1], la: g[2], lo: g[3], d: '', nt: '', f: null, u: id }; s.points.unshift(p); }
        if (ds.length) { var all = ptOwn(p).concat(ds).filter(function (d, i, a2) { return a2.indexOf(d) === i; }).sort(); p.d = all[0]; if (all.length > 1) p.ds = all; }
        var txt = tx.join('\n');
        if (txt && (p.nt || '').indexOf(txt) < 0) p.nt = [p.nt, txt].filter(Boolean).join('\n');
        delete s.done[k];
      });
    }
    // v0.70: cims de la llista que acaben de rebre coordenades. Un punt propi sense enllaç que hi cau a sobre
    // (<100 m) s'hi enllaça i el cim queda marcat com a fet amb les dates del punt, perquè no desaparegui.
    if (!s.m70) {
      s.m70 = 1;
      var NEWC = {'u-agulla-d-arnales':1,'u-algas-se':1,'u-grande-fache':1,'u-nudillo-del-monte-perdido-artell-del-mont-perdut':1,'u-tuqueta-de-marbore':1,'u-premier-conseiller':1,'u-crabounouse-n':1,'u-punta-gias-inferior':1,'u-pico-maldito':1,'u-pico-del-medio':1,'u-espalda-de-aneto':1,'u-punta-oliveras-arenas':1,'u-pico-coronas':1,'u-tuca-del-collado-de-coronas':1,'u-primer-pico-occidental-de-maladeta':1,'u-avantcim-ne-de-la-maladeta':1,'u-agulla-del-collado-de-coronas':1,'u-segundo-pico-occidental-de-maladeta':1,'u-tercer-pico-occidental-de-maladeta':1,'u-avantcim-n-del-pic-le-bondidier':1,'u-aguja-russell-superior':1,'u-primer-resalte-de-salenques':1,'u-diente-de-alba':1,'u-incisiu-oriental-d-alba':1,'u-agulla-sw-abadias':1,'u-punta-de-la-brecha-superior-de-llosas':1,'u-gendarme-de-alba':1,'u-argarot-s':1,'u-agulla-n-de-malavesina':1,'u-avantcim-n-de-sotllo':1,'u-cap-de-la-coma-de-riufred':1,'u-campbieil-ssw-lentilla':1};
      (s.points || []).forEach(function (p) {
        if (p.la == null || p.u || p.f || p.a) return;
        var best = null;
        U.forEach(function (u) { if (NEWC[u.id] && u.la != null) { var km = dist(u.la, u.lo, p.la, p.lo); if (km < 0.1 && (!best || km < best[0])) best = [km, u]; } });
        if (!best) return;
        p.u = best[1].id;
        var k = 'u:' + p.u, ds = ptOwn(p);
        if (!s.done) s.done = {};
        if (!s.done[k] && (ds.length || p.d != null)) s.done[k] = ds.length ? { d: ds[0], a: ds.map(function (d) { return { d: d, s: 'm' }; }) } : { d: '' };
      });
    }
    // v2 -> v3: els teus punts que són un 4000 dels Alps queden enllaçats i marcats com a fets
    if (s.v < 3) {
      (s.points || []).forEach(function (p) {
        if (p.la == null || p.a) return;
        var best = null;
        var pn = norm(p.n);
        AL.forEach(function (a) {
          if (a.la == null) return;
          var km = dist(a.la, a.lo, p.la, p.lo), an = norm(a.n), byName = pn.length > 4 && (an.indexOf(pn) >= 0 || pn.indexOf(an) >= 0);
          if ((km < 0.2 || (byName && km < 2)) && (!best || km < best[0])) best = [km, a];
        });
        if (!best) return;
        p.a = best[1].id;
        if (!s.done['a:' + p.a]) s.done['a:' + p.a] = { d: p.d || '' };
      });
      s.v = 3;
    }
    return s;
  }
  function migrate2(s) {
    if (s.v >= 2) return;
    var M = D.mig || {}, nd = {};
    Object.keys(s.done || {}).forEach(function (k) { nd[M[k] || k] = s.done[k]; });
    s.done = nd;
    (s.points || []).forEach(function (p) { if (p.u && M['u:' + p.u]) p.u = M['u:' + p.u].slice(2); });
    s.v = 2;
  }
  // L'estat es desa a dos llocs: un fitxer de l'app (sense límit de mida) i, mentre hi càpiga, localStorage (límit ~5 MB).
  // En obrir l'app es fa servir el més recent (camp _ts), així una còpia vella o incompleta de localStorage no pot guanyar.
  function load() {
    var cand = [];
    try { cand.push(localStorage.getItem(KEY)); } catch (e) { }
    if (NATIVE && NATIVE.loadState) { try { cand.push(NATIVE.loadState()); } catch (e) { } }
    if (!NATIVE && window.__IDB_STATE) cand.push(window.__IDB_STATE);
    var best = null;
    cand.forEach(function (raw) {
      if (!raw) return;
      try { var s = JSON.parse(raw); if (s && s.done && (!best || (s._ts || 0) > (best._ts || 0))) best = s; } catch (e) { }
    });
    return best ? migrate(best) : seedState();
  }
  // ---------- cims bessons ----------
  // Un mateix cim que és a més d'una llista (p. ex. la Pica d'Estats: 100 Cims i 3000) té una clau per llista.
  // Quan en marques, desmarques o canvies una, es copia a les altres.
  var TWINS = (function () {
    var g = [];
    F.forEach(function (f) {
      U.forEach(function (u) {
        if (u.la != null && Math.abs(u.la - f.la) < 0.002 && dist(u.la, u.lo, f.la, f.lo) < 0.05 && Math.abs(u.h - f.h) < 20) g.push(['f:' + f.id, 'u:' + u.id]);
      });
    });
    return g;
  })();
  var twinSnap = null, twinOwner = null;
  function recJ(k) { return S.done[k] ? JSON.stringify(S.done[k]) : ''; }
  function mergeRecs(recs) {
    var seen = {}, a = [], nt = '';
    recs.forEach(function (r) {
      if (r.nt && !nt) nt = r.nt;
      ascList(r).forEach(function (x) { var id = (x.id || '') + '|' + (x.d || '') + '|' + (x.id ? '' : x.s || ''); if (!seen[id]) { seen[id] = 1; a.push(Object.assign({}, x)); } });
    });
    // sense data + amb data el mateix dia manual: queda la que té data
    if (a.length > 1) a = a.filter(function (x) { return x.d || x.id; }).length ? a.filter(function (x) { return x.d || x.id; }) : [a[0]];
    sortAsc(a);
    var out = { d: '', a: a }; syncFirst(out);
    if (a.length === 1 && a[0].s === 'm' && !a[0].id) delete out.a;
    if (nt) out.nt = nt;
    return out;
  }
  function syncTwins() {
    var first = twinOwner !== S || !twinSnap;
    TWINS.forEach(function (grp, gi) {
      var cur = grp.map(recJ), src;
      if (first) src = grp.filter(function (k) { return S.done[k]; });
      else src = grp.filter(function (k, i) { return cur[i] !== twinSnap[gi][i]; });
      if (!src.length) return;
      var live = src.filter(function (k) { return S.done[k]; });
      if (!live.length) { grp.forEach(function (k) { delete S.done[k]; }); return; }
      var m = live.length === 1 ? JSON.parse(JSON.stringify(S.done[live[0]])) : mergeRecs(live.map(function (k) { return S.done[k]; }));
      grp.forEach(function (k) { S.done[k] = JSON.parse(JSON.stringify(m)); });
    });
    twinOwner = S; twinSnap = TWINS.map(function (grp) { return grp.map(recJ); });
  }
  function pruneWant() {
    if (!S.want) { S.want = {}; return; }
    Object.keys(S.want).forEach(function (k) { if (S.done[k]) delete S.want[k]; });
    TWINS.forEach(function (g) { var w = g.filter(function (k) { return S.want[k]; })[0]; if (w && !g.some(function (k) { return S.done[k]; })) g.forEach(function (k) { S.want[k] = S.want[k] || { d: S.want[w].d || '' }; }); });
  }
  var saveT = null;
  function flushSave() {
    if (saveT == null) return; clearTimeout(saveT); saveT = null;
    S._ts = Date.now();
    var raw = JSON.stringify(S);
    if (NATIVE && NATIVE.saveState) { try { NATIVE.saveState(raw); } catch (e) { } }
    // si ja no hi cap, es treu de localStorage (no pot quedar-hi una versió antiga): el fitxer de l'app és el que mana
    var lsOk = true;
    try { localStorage.setItem(KEY, raw); } catch (e) { lsOk = false; try { if ((NATIVE && NATIVE.saveState) || window.indexedDB) localStorage.removeItem(KEY); } catch (e2) { } }
    if (!NATIVE) webStateSave(raw, lsOk);
    if (window.__cloudSchedule) window.__cloudSchedule();
  }
  // el càlcul es fa a l'instant (migrate/twins) però escriure a disc s'ajorna uns ms perquè el toc no es quedi encallat
  function save() {
    migrate(S); syncTwins(); pruneWant();
    if (saveT != null) clearTimeout(saveT);
    saveT = setTimeout(flushSave, 180);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) flushSave(); });
  window.addEventListener('pagehide', flushSave);
  var FORCE_ALL = false; // només per llistar «tot» dins d'una medalla (els que falten)
  function isDone(k) { return FORCE_ALL || !!S.done[k]; }
  // «Vull fer»: cims pendents que vols fer (amb data prevista opcional). S.want = { clau: { d: 'AAAA-MM-DD' | '' } }
  function isWant(k) { return !!(S.want && S.want[k] && !S.done[k]); }
  function ascNoteView(c, i) {
    return c ? '<button class="an-view" data-act="anote" data-ai="' + i + '"><span class="an-t">' + esc(c) + '</span><span class="an-ed">Editar</span></button>'
      : '<button class="an-add" data-act="anote" data-ai="' + i + '">＋ Engadir nota (con quen, como foi…)</button>';
  }
  function twinKeys(k) { for (var i = 0; i < TWINS.length; i++) if (TWINS[i].indexOf(k) >= 0) return TWINS[i]; return [k]; }
  function setWant(k, on, date) {
    S.want = S.want || {};
    twinKeys(k).forEach(function (kk) { if (on) S.want[kk] = { d: date != null ? date : ((S.want[kk] && S.want[kk].d) || '') }; else delete S.want[kk]; });
    save();
  }
  function itemAlps(a) {
    var b = [[a.k === 'P' ? 'Principal' : 'Secundario', a.k === 'P' ? 'b-p' : 'b-s']];
    return { key: 'a:' + a.id, name: a.n, alt: a.h, meta: a.z + ' · ' + a.co, badges: b, ll: a.la != null ? [a.la, a.lo] : null, kind: 'alps', ref: a };
  }
  // Registre d'ascensions: rec.a = [{d, s ('m' manual | 'track' | 'arxiu'), id (activitat importada), n (nom)}].
  // rec.d és sempre la primera data (la que va a l'Excel). Els registres antics sense «a» compten com una ascensió.
  function ascList(rec) { return !rec ? [] : rec.a && rec.a.length ? rec.a : [{ d: rec.d || '', s: 'm' }]; }
  function nAsc(k) { return ascList(S.done[k]).length; }
  function sortAsc(a) { return a.sort(function (x, y) { var p = x.d || '9999', q = y.d || '9999'; return p < q ? -1 : p > q ? 1 : 0; }); }
  function syncFirst(rec) { var ds = rec.a.map(function (x) { return x.d; }).filter(Boolean).sort(); rec.d = ds[0] || ''; }
  function addAscent(k, asc) {
    var rec = S.done[k];
    if (!rec) { S.done[k] = { d: asc.d || '', a: [asc] }; return true; }
    var a = rec.a ? rec.a : (rec.d ? [{ d: rec.d, s: 'm' }] : []);
    rec.a = a;
    if (asc.id && a.some(function (x) { return String(x.id) === String(asc.id); })) return false;
    var same = asc.d && a.filter(function (x) { return x.d === asc.d && !x.id; })[0];
    if (same) { if (asc.id) { same.id = asc.id; same.n = asc.n; same.s = asc.s; } syncFirst(rec); return false; }
    a.push(asc); sortAsc(a); syncFirst(rec); return true;
  }
  function hasActivity(k, id) { var r = S.done[k]; return !!(r && r.a && r.a.some(function (x) { return String(x.id) === String(id); })); }
  // ---- sortida → cims: la sortida (v.cm = claus de cims, v.id) és la font; l'ascensió del cim porta {vid, pid, s:'via'}
  // lk = ascensió creada per la sortida (si es desvincula s'esborra); sense lk = ja existia i només s'hi enllaça.
  function visitOf(vid) {
    for (var i = 0; i < S.points.length; i++) { var vs = S.points[i].vs || []; for (var j = 0; j < vs.length; j++) if (vid && vs[j].id === vid) return { p: S.points[i], v: vs[j] }; }
    return null;
  }
  function linkAsc(k, p, v) {
    if (k.slice(0, 2) === 'p:') return;
    var tk = twinKeys(k); k = tk.filter(function (x) { return S.done[x]; })[0] || k;
    var d = /^\d{4}-\d\d-\d\d$/.test(v.d || '') ? v.d : '', rec = S.done[k];
    if (!rec) { S.done[k] = { d: d, a: [{ d: d, s: 'via', pid: p.id, vid: v.id, lk: 1 }] }; return; }
    var a = ascList(rec).map(function (x) { return Object.assign({}, x); });
    var mine = a.filter(function (x) { return x.vid === v.id; })[0];
    if (mine) mine.d = d;
    else {
      var same = a.filter(function (x) { return !x.vid && d && x.d === d; })[0] || a.filter(function (x) { return !x.vid && !x.d; })[0];
      if (same) { same.pid = p.id; same.vid = v.id; if (d) same.d = d; }
      else a.push({ d: d, s: 'via', pid: p.id, vid: v.id, lk: 1 });
    }
    rec.a = sortAsc(a); syncFirst(rec);
  }
  function unlinkAsc(k, vid) {
    if (k.slice(0, 2) === 'p:') return;
    twinKeys(k).forEach(function (kk) {
      var rec = S.done[kk]; if (!rec || !rec.a || !rec.a.some(function (x) { return x.vid === vid; })) return;
      var a = rec.a.filter(function (x) { return !(x.vid === vid && x.lk); });
      a.forEach(function (x) { if (x.vid === vid) { delete x.vid; delete x.pid; } });
      if (!a.length) delete S.done[kk]; else { rec.a = a; syncFirst(rec); }
    });
  }
  function syncVisit(p, v, oldCm) {
    var nw = v.cm || [];
    (oldCm || []).forEach(function (k) { if (nw.indexOf(k) < 0) unlinkAsc(k, v.id); });
    nw.forEach(function (k) { linkAsc(k, p, v); });
  }
  function unlinkPoint(p) { var pk = 'p:' + p.id; S.points.forEach(function (q) { (q.vs || []).forEach(function (v) { if (v.cm && v.cm.indexOf(pk) >= 0) { v.cm = v.cm.filter(function (c) { return c !== pk; }); if (!v.cm.length) delete v.cm; } }); }); (p.vs || []).forEach(function (v) { (v.cm || []).forEach(function (k) { unlinkAsc(k, v.id); }); }); }
  // si s'esborra una ascensió enllaçada des del cim, el cim surt també de la sortida
  function dropFromVisits(k, list) {
    var tk = twinKeys(k);
    list.forEach(function (x) {
      var rt = x.vid && routeOf(x.vid); if (rt && rt.cm) { rt.cm = rt.cm.filter(function (c) { return tk.indexOf(c) < 0; }); if (!rt.cm.length) delete rt.cm; return; }
      var r = x.vid && visitOf(x.vid); if (!r || !r.v.cm) return;
      r.v.cm = r.v.cm.filter(function (c) { return tk.indexOf(c) < 0; }); if (!r.v.cm.length) delete r.v.cm;
    });
  }
  function setDone(k, on, date) {
    if (on) { S.done[k] = Object.assign({}, S.done[k] || {}, { d: date != null ? date : ((S.done[k] && S.done[k].d) || today()) }); if (S.done[k].a) { S.done[k].a = [{ d: S.done[k].d, s: 'm' }]; } }
    else { dropFromVisits(k, ascList(S.done[k])); delete S.done[k]; }
    save(); refreshAll(); checkMedals(false);
  }

  // ---------- items for lists ----------
  function coordsForUiaa(id) {
    var u = uById[id]; if (u && u.la != null) return [u.la, u.lo];
    for (var i = 0; i < S.points.length; i++) { var p = S.points[i]; if (p.u === id && p.la != null) return [p.la, p.lo]; }
    return null;
  }
  // ---------- fotos de les cims ----------
  // Les fotos van a part de l'app: carpeta «fotos/» a l'arrel del repositori de GitHub (index.json + paquets pNN.b64).
  // L'app les baixa sola, les desa al mòbil (IndexedDB) i les llegeix d'allà: les actualitzacions de l'app no les toquen.
  var PH_KEYS = 'cimsFotosKeys', PH_HASH = 'cimsFotosHash', phMem = {}, phUrl = {}, phDbP = null;
  try { window.PHK = JSON.parse(localStorage.getItem(PH_KEYS)) || {}; } catch (e) { window.PHK = {}; }
  function phDb() {
    if (!phDbP) phDbP = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej('no idb');
      var r = indexedDB.open('cimsFotos', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('packs'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return phDbP;
  }
  function phGet(b) { return phDb().then(function (db) { return new Promise(function (res) { var q = db.transaction('packs').objectStore('packs').get(b); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }); }
  function phPut(b, v) { return phDb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('packs', 'readwrite'); if (v) t.objectStore('packs').put(v, b); else t.objectStore('packs').delete(b); t.oncomplete = res; t.onerror = function () { rej(t.error); }; }); }); }
  function phKeyFor(it) {
    var P = window.PHK; if (!P) return null;
    var ks = twinKeys(it.key).slice(); if (it.f) ks.push('f:' + it.f.id);
    for (var i = 0; i < ks.length; i++) if (P[ks[i]] != null) return ks[i];
    return null;
  }
  function phLoad(k, cb) {
    var b = window.PHK && window.PHK[k]; if (b == null) return cb(null);
    if (phUrl[k]) return cb(phUrl[k]);
    (phMem[b] ? Promise.resolve(phMem[b]) : phGet(String(b)).then(function (r) { if (r) phMem[b] = r; return r; })).then(function (r) {
      var e = r && r.keys[k]; if (!e) return cb(null);
      var u = URL.createObjectURL(new Blob([r.buf.slice(e[0], e[0] + e[1])], { type: new Uint8Array(r.buf, e[0], 4)[0] === 82 ? 'image/webp' : 'image/jpeg' }));
      phUrl[k] = u; cb(u);
    }).catch(function () { cb(null); });
  }
  // petició GitHub: pel pont d'Android (accepta token) o, al navegador, amb fetch
  var nhId = 0, nhCb = {};
  window.__nativeHttpDone = function (id, code, text) { var f = nhCb[id]; delete nhCb[id]; if (f) f(code, text); };
  function ghText(path) {
    if (!NATIVE) return fetch(path + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw r.status; return r.text(); });
    var url = 'https://raw.githubusercontent.com/' + ota.repo + '/' + (ota.br || 'main') + '/' + path + '?t=' + Date.now();
    var h = ota.tok ? { Authorization: 'token ' + ota.tok } : {};
    if (NATIVE && NATIVE.http) return new Promise(function (res, rej) { var id = 'ph' + (++nhId); nhCb[id] = function (c, t) { c === 200 ? res(t) : rej(c); }; NATIVE.http(id, 'GET', url, JSON.stringify(h), ''); });
    return fetch(url, { headers: h, cache: 'no-store' }).then(function (r) { if (!r.ok) throw r.status; return r.text(); });
  }
  var phBusy = false;
  function phStatus(o) { try { if (o) localStorage.setItem('cimsFotosSt', JSON.stringify(o)); return JSON.parse(localStorage.getItem('cimsFotosSt')) || {}; } catch (e) { return {}; } }
  function phSync(manual, force) {
    if (phBusy || (NATIVE && !ota.repo)) return; phBusy = true;
    if (force) { try { localStorage.removeItem(PH_HASH); } catch (e) { } }
    var have = {}; try { have = JSON.parse(localStorage.getItem(PH_HASH)) || {}; } catch (e) { }
    ghText('fotos/index.json').then(function (t) {
      var idx = JSON.parse(t), packs = idx.packs || {}, todo = Object.keys(packs).filter(function (b) { return have[b] !== packs[b]; });
      var gone = Object.keys(have).filter(function (b) { return !packs[b]; }), n = 0;
      function keysSave() {
        var K = {}; Object.keys(idx.k || {}).forEach(function (k) { var b = String(idx.k[k][0]); if (have[b] === packs[b]) K[k] = b; });
        window.PHK = K; try { localStorage.setItem(PH_KEYS, JSON.stringify(K)); localStorage.setItem(PH_HASH, JSON.stringify(have)); } catch (e) { }
      }
      var chain = Promise.all(gone.map(function (b) { delete have[b]; delete phMem[b]; return phPut(b, null); }));
      todo.forEach(function (b) {
        chain = chain.then(function () { return ghText('fotos/p' + b + '.b64'); }).then(function (b64) {
          var bin = atob(b64.replace(/\s+/g, '')), u8 = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          var keys = {}; Object.keys(idx.k).forEach(function (k) { var e = idx.k[k]; if (String(e[0]) === b) keys[k] = [e[1], e[2]]; });
          return phPut(b, { buf: u8.buffer, keys: keys });
        }).then(function () { have[b] = packs[b]; delete phMem[b]; phUrl = {}; n++; keysSave(); });
      });
      return chain.then(function () { keysSave(); phBusy = false; phStatus({ t: Date.now(), n: Object.keys(window.PHK).length }); if (n || manual) toast('Fotos ao día: ' + Object.keys(window.PHK).length + ' cumes con foto'); if ($('#otaSheet')) otaSheet(); });
    }).catch(function (e) {
      phBusy = false;
      var msg = e === 404 ? 'Non hai o cartafol «fotos» no repositorio (súbeo a GitHub ao carón de «app»)' : 'Non se puideron descargar (' + (e && e.message || e) + ')';
      phStatus({ t: Date.now(), n: Object.keys(window.PHK).length, err: msg });
      if (manual) toast('Fotos: ' + msg);
      if ($('#otaSheet')) otaSheet();
    });
  }
  function phHydrate() {
    var box = document.querySelector('#sheet .ph-load'); if (!box) return;
    var img = box.querySelector('img');
    phLoad(box.dataset.pk, function (u) { if (!u) { if (box.dataset.fb) { img.src = box.dataset.fb; img.onerror = function () { box.style.display = 'none'; }; } else box.style.display = 'none'; return; } img.src = u; });
  }
  // nom de la zona/sector sense el codi «Z10 · …»
  var ZNAME = { 'Besiberri': 'Besiberri - Comaloforno' };
  function zl(z) { z = String(z == null ? '' : z); if (!/^Z\d+ · /.test(z)) return z; z = z.replace(/^Z\d+ · /, ''); return ZNAME[z] || z.replace(/-/g, ' - '); }
  function itemFeec(f) {
    var b = [];
    if (f.e) b.push(['Esencial', 'b-ess']);
    if (sostreOf[f.id]) b.push(['Teito', 'b-sos']);
    return { key: 'f:' + f.id, name: f.n, alt: f.h, meta: f.r, badges: b, ll: [f.la, f.lo], kind: 'feec', ref: f };
  }
  function itemUiaa(u) {
    var b = [];
    if (u.k === 'P') b.push(['Principal', 'b-p']); else if (u.k === 'S') b.push(['Secundario', 'b-s']); else b.push(['Fóra UIAA', 'b-baixa']);
    if (u.ca) b.push(['Catalán', 'b-cat']);
    return { key: 'u:' + u.id, name: u.n, alt: u.h, meta: zl(u.z) + (u.num && u.num !== '—' ? ' · nº ' + u.num : ''), badges: b, ll: coordsForUiaa(u.id), kind: 'uiaa', ref: u };
  }
  function itemCat(c) {
    var u = uById[c.ref], b = [];
    if (c.est !== 'Vigent') b.push(['Baixa', 'b-baixa']);
    if (c.k === 'Principal') b.push(['Principal', 'b-p']); else if (c.k === 'Secundari') b.push(['Secundario', 'b-s']); else b.push(['Fóra UIAA', 'b-baixa']);
    return { key: 'u:' + c.ref, name: c.n, alt: c.h, meta: zl(c.z) + ' · ' + c.est, badges: b, ll: coordsForUiaa(c.ref), kind: 'cat', ref: c, u: u };
  }
  function itemByKey(k) {
    var id = k.slice(2);
    if (k[0] === 'f') return fById[id] ? itemFeec(fById[id]) : null;
    if (k[0] === 'u') return uById[id] ? itemUiaa(uById[id]) : null;
    if (k[0] === 'a') return aById[id] ? itemAlps(aById[id]) : null;
    var x = SOS.filter(function (y) { return y.id === id; })[0]; return x ? itemSostre(x) : null;
  }
  function itemSostre(s) {
    var f = s.f ? fById[s.f] : null, b = [];
    if (f) b.push([f.e ? 'Esencial' : '100 Cims', f.e ? 'b-ess' : 'b-p']);
    return { key: f ? 'f:' + f.id : 's:' + s.id, name: s.n, alt: s.h, meta: s.com + (s.z ? ' · ' + s.z : ''), badges: b, ll: f ? [f.la, f.lo] : null, kind: 'sostre', ref: s, f: f };
  }

  // ---------- RESUM ----------
  function stats() {
    var ess = 0, tot = 0, byCom = {}, byZone = {};
    F.forEach(function (f) {
      var d = isDone('f:' + f.id), c = byCom[f.c] = byCom[f.c] || { n: 0, e: 0, ed: 0, d: 0 };
      c.n++; if (f.e) c.e++;
      if (d) { tot++; c.d++; if (f.e) { ess++; c.ed++; } }
    });
    var p = 0, s = 0;
    U.forEach(function (u) {
      var d = isDone('u:' + u.id);
      if (u.k === 'X') return;
      var z = byZone[u.z] = byZone[u.z] || { p: 0, pd: 0, s: 0, sd: 0 };
      if (u.k === 'P') { z.p++; if (d) { p++; z.pd++; } } else { z.s++; if (d) { s++; z.sd++; } }
    });
    var cat = CAT_VIG.filter(function (c) { return isDone('u:' + c.ref); }).length;
    var sos = SOS.filter(function (x) { return isDone(x.f ? 'f:' + x.f : 's:' + x.id); }).length;
    var ap = 0, as = 0; AL.forEach(function (a) { if (isDone('a:' + a.id)) { if (a.k === 'P') ap++; else as++; } });
    return { ess: ess, tot: tot, noess: tot - ess, byCom: byCom, byZone: byZone, p: p, s: s, cat: cat, sos: sos, ap: ap, as: as };
  }
  function bar(label, small, frac, color) {
    var w = Math.max(0, Math.min(1, frac)) * 100;
    if (String(small).indexOf('%') < 0) small = Math.round(w) + '% · ' + small;
    return '<div class="bar"><div class="bl"><span>' + esc(label) + '</span><small>' + esc(small) + '</small></div>' +
      '<div class="track"><div class="fill" style="width:' + w.toFixed(1) + '%;background:' + color + '"></div></div></div>';
  }
  // Animacions suaus: les barres creixen des del valor anterior i els números compten fins al nou valor
  var prevAnim = {};
  function animateIn(el) {
    if (!el) return;
    var prev = prevAnim[el.id] || { bars: [], kpis: [] }, now = { bars: [], kpis: [] };
    $$('.bar .fill', el).forEach(function (f, i) {
      var w = f.style.width; now.bars.push(w);
      if (prev.bars[i] != null && prev.bars[i] !== w) { f.style.transition = 'none'; f.style.width = prev.bars[i]; void f.offsetWidth; f.style.transition = ''; f.style.width = w; }
    });
    $$('.kpi .v', el).forEach(function (v, i) {
      var t = v.textContent; now.kpis.push(t);
      var p = prev.kpis[i]; if (p == null || p === t) return;
      var m1 = /^(\d+)(%?)$/.exec(p), m2 = /^(\d+)(%?)$/.exec(t);
      if (!m1 || !m2 || m1[2] !== m2[2]) return;
      var a = +m1[1], b = +m2[1], t0 = null;
      v.classList.add('bump');
      requestAnimationFrame(function step(ts) {
        if (t0 == null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 500), e = 1 - Math.pow(1 - k, 3);
        v.textContent = Math.round(a + (b - a) * e) + m2[2];
        if (k < 1) requestAnimationFrame(step); else { v.textContent = t; v.classList.remove('bump'); }
      });
    });
    prevAnim[el.id] = now;
  }
  function kpi(v, l, cls, act) { return '<div class="kpi ' + cls + (act ? ' tap' : '') + '"' + (act ? ' data-rsd="' + act + '" role="button"' : '') + '><div class="v">' + v + '</div><div class="l">' + esc(l) + '</div>' + (act ? '<i class="kpi-go">›</i>' : '') + '</div>'; }
  function renderResum() {
    var st = stats(), NF = F.length;
    var done100 = st.ess >= 100;
    var next = done100 ? (Math.floor(st.tot / 100) + 1) * 100 : 100;
    var falten = done100 ? next - st.tot : 100 - st.ess;
    var prog = done100 ? st.tot / 100 : st.ess / 100;
    var tram = done100 ? (st.tot % 100) / 100 : st.ess / 100;
    var tramTxt = done100 ? (st.tot % 100) + ' de 100 cara aos ' + next : st.ess + ' de 100 esenciais';
    var h = '';
    // Dos nivells: cada targeta (100 Cims, Comarques, Tresmils, Sostres, 4000) es plega/desplega,
    // i dins de cada una hi ha una llista que també es desplega (es dibuixa només quan s'obre).
    var RS = resumOpen();
    NEST = {};
    function nested(id, title, fn) {
      NEST[id] = fn;
      var o = !!RS['n_' + id];
      return '<div class="rs2' + (o ? ' open' : '') + '" data-rs2="' + id + '"><button class="rs2-h" data-rsh2="' + id + '"><span>' + esc(title) + '</span><span class="chev">▾</span></button>' +
        '<div class="rs-b"><div><div class="rs2-in">' + (o ? fn() : '') + '</div></div></div></div>';
    }
    var HD = {};
    function ringSvg(fr) {
      var r = 40, c = 2 * Math.PI * r;
      return '<svg class="hero-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="9"/>' +
        '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (c * Math.max(0, Math.min(1, fr))).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>';
    }
    function sec(id, title, sum, body, links) {
      var hd = HD[id] || {}, open = RS[id] ? ' open' : '';
      var inner = '<div class="rs-b"><div><div class="rs-in">' + body + (links && links.length ? '<div class="rs-links">' + links.map(function (l) { return '<button class="chip" data-golist="' + l[0] + '">' + esc(l[1]) + ' ›</button>'; }).join('') + '</div>' : '') + '</div></div></div>';
      return '<div class="card rs' + open + '" data-rs="' + id + '"><button class="rs-h" data-rsh="' + id + '">' +
        '<span class="rs-t">' + esc(title) + '</span><span class="rs-sum">' + esc(sum) + '</span><span class="chev">▾</span></button>' +
        '<span class="rs-bar rs-mini"><b style="width:' + (Math.max(0, Math.min(1, hd.frac || 0)) * 100).toFixed(1) + '%;background:' + (hd.c || 'var(--pine)') + '"></b></span>' + inner + '</div>';
    }
    function cimRows(items) {
      return '<ul class="rl">' + items.map(function (it) {
        var d = isDone(it.key), na = d ? nAsc(it.key) : 0;
        return '<li data-ckey="' + esc(it.key) + '"' + (d ? ' class="done"' : '') + '><span class="rl-c">' + (d ? '✓' : '') + '</span><span class="rl-b"><span class="rl-n">' + esc(it.name) + (it.e ? ' <i class="rl-e">E</i>' : '') + '</span><span class="rl-m">' + esc(it.meta) + '</span></span><span class="rl-a">' + fmtAlt(it.alt) + (na > 1 ? ' <b>×' + na + '</b>' : '') + '</span></li>';
      }).join('') + '</ul>';
    }
    var byAlt = function (a, b) { return (b.alt || 0) - (a.alt || 0); };
    var SECS = {};
    if (lsOn('feec')) {
      HD.feec = { hero: 1, frac: tram, pct: pct(tram), a: st.tot, b: '/ ' + NF,
        p: done100 ? 'Reto dos 100 superado. Para o seguinte fáltanche <b>' + falten + '</b>.' : st.ess + ' esenciais de 100. Fáltanche <b>' + falten + '</b> para o reto.',
        pills: [[st.ess, 'essencials'], [st.noess, 'non esenciais'], [pct(st.tot / NF), 'do total']] };
      SECS.feec = sec('feec', '100 Cims FEEC', st.tot + '/' + NF + ' · ' + st.ess + ' esenc.',
        '<div class="kpis">' + kpi(st.ess, 'Esenciais acadados', 'k-lav', 'feec:ess') + kpi(falten, 'Faltan para os ' + next, 'k-peach', 'feec:falten') + kpi(pct(prog), 'Progreso do reto', 'k-mint') +
        kpi(st.noess, 'Non esenciais', 'k-sky', 'feec:noess') + kpi(st.tot, 'Total FEEC', 'k-butter', 'feec:tot') + kpi(pct(st.tot / NF), '% do total FEEC', 'k-gray') + '</div>' +
        bar('Progreso cara aos ' + next, pct(tram) + ' · ' + tramTxt, tram, 'var(--pine)') +
        bar('Sobre o total FEEC (' + NF + ')', pct(st.tot / NF) + ' · ' + st.tot + ' de ' + NF, st.tot / NF, 'var(--sky-d)') +
        
        nested('feec', 'Lista dos ' + NF + ' cumes', function () { return cimRows(F.map(function (f) { var it = itemFeec(f); it.e = f.e; it.meta = f.c; return it; }).sort(byAlt)); }),
        []);
      var coms = Object.keys(st.byCom).sort(function (a, b) { return norm(a) < norm(b) ? -1 : 1; });
      var cEss = coms.filter(function (c) { return st.byCom[c].e && st.byCom[c].ed >= st.byCom[c].e; }).length, cAll = coms.filter(function (c) { return st.byCom[c].d >= st.byCom[c].n; }).length, cAny = coms.filter(function (c) { return st.byCom[c].d > 0; }).length;
      var nEC = coms.filter(function (c) { return st.byCom[c].e; }).length;
      HD.com = { c: 'var(--lav-d)', a: cEss, b: '/ ' + nEC + ' esenciais', frac: cEss / Math.max(1, nEC), l: cAll + ' completas', r: cAny + ' con algún cume' };
      SECS.com = sec('com', 'Comarcas', cEss + '/' + nEC + ' esenc.',
        '<div class="kpis">' + kpi(cEss, 'con todos os esenciais', 'k-lav', 'grp:com:ess') + kpi(cAll, 'completes', 'k-mint', 'grp:com:all') + kpi(cAny, 'con algún cume feito', 'k-sky', 'grp:com:curs') + '</div>' +
        bar('Comarcas con todos os esenciais', cEss + ' de ' + coms.filter(function (c) { return st.byCom[c].e; }).length, cEss / Math.max(1, coms.filter(function (c) { return st.byCom[c].e; }).length), 'var(--lav-d)') +
        bar('Comarcas completas (todos os cumes)', cAll + ' de ' + coms.length, cAll / Math.max(1, coms.length), 'var(--pine)') +
        nested('com', 'Esenciais por comarca', function () {
          return '<table class="mini"><tr><th>Comarca</th><th style="text-align:right">Esenciais</th><th style="text-align:right">Faltan</th></tr>' +
            coms.filter(function (c) { return st.byCom[c].e; }).map(function (c) { var x = st.byCom[c], fr = x.ed / x.e;
              return '<tr data-gocom="' + esc(c) + '"><td>' + esc(c) + '<div class="minibar"><i style="width:' + (fr * 100).toFixed(0) + '%"></i></div></td><td class="n">' + x.ed + '/' + x.e + '</td><td class="n" style="color:' + (x.e - x.ed ? 'var(--peach-d)' : 'var(--mute)') + ';font-weight:700">' + (x.e - x.ed || '✓') + '</td></tr>'; }).join('') + '</table>';
        }) +
        nested('comall', 'Todos os cumes por comarca', function () {
          return '<table class="mini"><tr><th>Comarca</th><th style="text-align:right">Cumes</th><th style="text-align:right">Faltan</th></tr>' +
            coms.map(function (c) { var x = st.byCom[c], fr = x.d / x.n;
              return '<tr data-gocom="' + esc(c) + '"><td>' + esc(c) + '<div class="minibar mb-all"><i style="width:' + (fr * 100).toFixed(0) + '%"></i></div></td><td class="n">' + x.d + '/' + x.n + '</td><td class="n" style="color:' + (x.n - x.d ? 'var(--peach-d)' : 'var(--mute)') + ';font-weight:700">' + (x.n - x.d || '✓') + '</td></tr>'; }).join('') + '</table>';
        }),
        []);
    }
    var u = st.p + st.s, NU = N_P + N_S;
    if (lsOn('uiaa') || lsOn('cat')) {
      var zs = Object.keys(st.byZone).sort(function (a, b) { return parseInt(a.slice(1)) - parseInt(b.slice(1)); });
      HD.t3000 = { c: 'var(--sky-d)', a: lsOn('uiaa') ? u : st.cat, b: lsOn('uiaa') ? '/ ' + NU : '/ ' + CAT_VIG.length + ' cat.', frac: lsOn('uiaa') ? u / NU : st.cat / CAT_VIG.length,
        l: lsOn('cat') && lsOn('uiaa') ? st.cat + ' de ' + CAT_VIG.length + ' catalás' : '', r: lsOn('uiaa') ? st.p + ' princ. · ' + st.s + ' sec.' : '' };
      SECS.t3000 = sec('t3000', '3000 do Pirineo', (lsOn('uiaa') ? u + '/' + NU : '') + (lsOn('uiaa') && lsOn('cat') ? ' · ' : '') + (lsOn('cat') ? st.cat + '/' + CAT_VIG.length + ' cat.' : ''),
        (lsOn('uiaa') ? (lsOn('cat') ? '<div class="rs-sub">3000 do Pirineo</div>' : '') + '<div class="kpis">' +
        kpi(st.p, 'principais (de ' + N_P + ')', 'k-sky', 'uiaa:p') + kpi(st.s, 'secundarios (de ' + N_S + ')', 'k-butter', 'uiaa:s') + kpi(pct(u / NU), 'dos ' + NU, 'k-sky', 'uiaa:tot') + '</div>' +
        bar('3000 do Pirineo (' + NU + ')', u + ' de ' + NU, u / NU, 'var(--sky-d)') : '') +
        (lsOn('cat') ? '<div class="rs-sub">3000 catalás</div><div class="kpis">' +
          kpi(st.cat, 'catalás principais (de ' + CAT_VIG.length + ')', 'k-rose', 'cat:all') + kpi(CAT_VIG.length - st.cat, 'Faltan', 'k-peach', 'cat:pend') + kpi(pct(st.cat / CAT_VIG.length), 'dos ' + CAT_VIG.length + ' catalás', 'k-sky') + '</div>' +
          bar('3000 catalás (' + CAT_VIG.length + ')', st.cat + ' de ' + CAT_VIG.length, st.cat / CAT_VIG.length, 'var(--rose-d)') : '') +
        (lsOn('uiaa') ? nested('t3000', 'Zonas dos 3000', function () {
          return '<table class="mini"><tr><th>Zona</th><th style="text-align:right">Princ.</th><th style="text-align:right">Sec.</th></tr>' +
            zs.map(function (z) { var x = st.byZone[z], fr = (x.pd + x.sd) / (x.p + x.s);
              return '<tr data-gozone="' + esc(z) + '"><td>' + esc(zl(z)) + '<div class="minibar"><i style="width:' + (fr * 100).toFixed(0) + '%;background:#9FC9E8"></i></div></td><td class="n">' + x.pd + '/' + x.p + '</td><td class="n">' + x.sd + '/' + x.s + '</td></tr>'; }).join('') + '</table>';
        }) : '') +
        (lsOn('cat') ? nested('cat', 'Os tresmiles catalás', function () { return cimRows(CAT.map(function (c) { var it = itemCat(c); it.meta = zl(c.z) + (c.est !== 'Vigent' ? ' · de baixa' : ''); return it; }).sort(byAlt)); }) : ''),
        []);
    }
    if (lsOn('sos')) {
      var sp = SOS.length - st.sos;
      HD.sos = { c: 'var(--amber)', a: st.sos, b: '/ ' + SOS.length, frac: st.sos / SOS.length, l: sp + ' pendentes' };
      SECS.sos = sec('sos', 'Teitos comarcais', st.sos + '/' + SOS.length,
        '<div class="kpis">' + kpi(st.sos, 'Teitos acadados', 'k-butter', 'sos:fet') + kpi(sp, 'Pendentes', 'k-peach', 'sos:pend') + kpi(pct(st.sos / SOS.length), 'do total', 'k-mint') + '</div>' +
        bar('Teitos comarcais (' + SOS.length + ')', pct(st.sos / SOS.length) + ' · ' + st.sos + ' de ' + SOS.length, st.sos / SOS.length, 'var(--amber)') +
        nested('sos', 'Lista dos ' + SOS.length + ' teitos', function () { return cimRows(SOS.slice().sort(function (a, b) { return norm(a.com) < norm(b.com) ? -1 : 1; }).map(function (x) { var it = itemSostre(x); it.meta = x.com; return it; })); }),
        []);
    }
    if (lsOn('alps') && AL.length) {
      var at = st.ap + st.as;
      var ms = {}; AL.forEach(function (a) { var m = ms[a.z] = ms[a.z] || { n: 0, d: 0, p: 0, pd: 0 }; m.n++; if (a.k === 'P') m.p++; if (isDone('a:' + a.id)) { m.d++; if (a.k === 'P') m.pd++; } });
      HD.alps = { c: 'var(--rose-d)', a: at, b: '/ ' + AL.length, frac: at / AL.length, l: st.ap + ' de ' + N_AP + ' principais' };
      SECS.alps = sec('alps', '4000 dos Alpes', at + '/' + AL.length,
        '<div class="kpis">' + kpi(st.ap, 'principais (de ' + N_AP + ')', 'k-lav', 'alps:p') + kpi(st.as, 'secundarios (de ' + (AL.length - N_AP) + ')', 'k-butter', 'alps:s') + kpi(pct(at / AL.length), 'dos ' + AL.length, 'k-rose', 'alps:tot') + '</div>' +
        bar('4000 principais (' + N_AP + ')', st.ap + ' de ' + N_AP, st.ap / N_AP, 'var(--lav-d)') +
        bar('Todos os 4000 (' + AL.length + ')', at + ' de ' + AL.length, at / AL.length, 'var(--rose-d)') +
        nested('alps', 'Macizos dos 4000', function () {
          return '<table class="mini"><tr><th>Macizo</th><th style="text-align:right">Princ.</th><th style="text-align:right">Todos</th></tr>' +
            Object.keys(ms).sort(function (a, b) { return ms[b].n - ms[a].n; }).map(function (z) { var m = ms[z];
              return '<tr data-gomas="' + esc(z) + '"><td>' + esc(z) + '<div class="minibar"><i style="width:' + (m.d / m.n * 100).toFixed(0) + '%;background:#E8B4A0"></i></div></td><td class="n">' + m.pd + '/' + m.p + '</td><td class="n">' + m.d + '/' + m.n + '</td></tr>'; }).join('') + '</table>';
        }),
        []);
    }
    resumOrder().forEach(function (k) { if (SECS[k]) h += SECS[k]; });
    h += '<button class="btn rs-order" data-rsorder="1">⇅ Cambiar a orde do resumo</button>';
    h += statsEntry();
    // últims cims: cada cim un sol cop (la seva darrera ascensió); els bessons de dues llistes compten com un i surten amb el nom dels 100 Cims
    var rec = [], lastBy = {};
    Object.keys(S.done).forEach(function (k) {
      var tk = twinKeys(k); if (!tk.some(listOnFor)) return;
      var c = tk[0]; if (/^[a-z]:/.test(c) && nameOfKey(c) === c.slice(2)) return;
      ascList(S.done[k]).forEach(function (x) { if (x.d && (!lastBy[c] || x.d > lastBy[c])) lastBy[c] = x.d; });
    });
    Object.keys(lastBy).forEach(function (c) { rec.push([lastBy[c], c]); });
    S.points.forEach(function (p) { var ds = ptDates(p); if (ds.length && !officialPoint(p)) rec.push([ds[ds.length - 1], 'p:' + p.id]); });
    rec.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0; });
    if (rec.length) {
      h += '<div class="card"><h2>Últimos cumes <button class="h-link" data-diari="1">Diario ›</button></h2><ul class="recent">' + rec.slice(0, 10).map(function (r) {
        var na = r[1][0] !== 'p' ? twinKeys(r[1]).reduce(function (t, kk) { return Math.max(t, S.done[kk] ? ascList(S.done[kk]).length : 0); }, 0) : 0;
        return '<li data-rk="' + esc(r[1]) + '"><span>' + esc(nameOfKey(r[1])) + (na > 1 ? ' <small style="color:var(--mute)">×' + na + '</small>' : '') + '</span><span style="color:var(--mute)">' + fmtDate(r[0]) + '</span></li>';
      }).join('') + '</ul></div>';
    }
    $('#v-resum').innerHTML = h;
    if (view === 'resum') animateIn($('#v-resum'));
  }
  // ---------- RESUM: llistes que s'obren en tocar una casella ----------
  // Una fulla (la mateixa dels cims) amb la llista; en tocar un cim s'obre la seva fitxa amb «‹ Tornar a la llista».
  var RSD = null;
  function lastAsc(k) { var l = ''; ascList(S.done[k]).forEach(function (x) { if (x.d && x.d > l) l = x.d; }); return l; }
  function byRecent(a, b) { var x = lastAsc(a.key), y = lastAsc(b.key); return x < y ? 1 : x > y ? -1 : (b.alt || 0) - (a.alt || 0); }
  function byAltD(a, b) { return (b.alt || 0) - (a.alt || 0); }
  function byWant(a, b) { var x = S.want[a.key].d || '9999', y = S.want[b.key].d || '9999'; return x < y ? -1 : x > y ? 1 : norm(a.name) < norm(b.name) ? -1 : 1; }
  function feecIt(f) { var it = itemFeec(f); it.e = f.e; it.meta = f.c; return it; }
  function rdRow(it) {
    var d = isDone(it.key), w = isWant(it.key), na = d ? nAsc(it.key) : 0, ld = d ? lastAsc(it.key) : '', sub = '';
    if (d) sub = (ld ? fmtDate(ld) : 'sen data') + (na > 1 ? ' <b>×' + na + '</b>' : '');
    else if (w) sub = '<span class="rd-w">★ quero facer' + (S.want[it.key].d ? ' · ' + esc(fmtDate(S.want[it.key].d).slice(0, 5)) : '') + '</span>';
    return '<li data-rdk="' + esc(it.key) + '"' + (d ? ' class="done"' : w ? ' class="want"' : '') + '><span class="rl-c">' + (d ? '✓' : w ? '★' : '') + '</span><span class="rl-b"><span class="rl-n">' + esc(it.name) + (it.e ? ' <i class="rl-e">E</i>' : '') +
      '</span><span class="rl-m">' + esc(it.meta) + '</span></span><span class="rl-a">' + fmtAlt(it.alt) + (sub ? '<small>' + sub + '</small>' : '') + '</span></li>';
  }
  function rdList(items) { return '<ul class="rl tall">' + items.map(rdRow).join('') + '</ul>'; }
  function rdGroup(h, items) { return items.length ? '<h4 class="rd-h">' + h + '</h4>' + rdList(items) : ''; }
  // pendents: primer els «vull fer», després la resta per altitud
  function pendGroups(items) {
    var w = items.filter(function (i) { return isWant(i.key); }).sort(byWant), r = items.filter(function (i) { return !isWant(i.key); }).sort(byAltD);
    return rdGroup('★ Quero facer · ' + w.length, w) + rdGroup((w.length ? 'O resto' : 'Pendentes') + ' · ' + r.length, r);
  }
  function doneGroups(items) { var d = items.filter(function (i) { return isDone(i.key); }).sort(byRecent); return rdGroup('Feitos · ' + d.length, d); }
  function dpBody(items) { return doneGroups(items) + pendGroups(items.filter(function (i) { return !isDone(i.key); })); }
  function feecProg(st) { var done100 = st.ess >= 100, next = done100 ? (Math.floor(st.tot / 100) + 1) * 100 : 100; return { done100: done100, next: next, falten: done100 ? next - st.tot : 100 - st.ess }; }

  // llistes simples: { title, sub, body() }
  function rsdSimple(id) {
    var st = stats(), pr = feecProg(st), A = id.split(':');
    var fe = function (pred) { return F.filter(pred).map(feecIt); };
    if (id === 'feec:ess') { var a = fe(function (f) { return f.e && isDone('f:' + f.id); }).sort(byRecent); return { title: 'Esenciais acadados · ' + a.length, sub: 'De ' + N_ESS + ' esenciais. Primeiro os feitos máis recentemente.', body: function () { return rdList(a); } }; }
    if (id === 'feec:noess') { var b = fe(function (f) { return !f.e && isDone('f:' + f.id); }).sort(byRecent); return { title: 'Non esenciais acadados · ' + b.length, sub: 'Cumes que non contan para os esenciais. Primeiro os máis recentes.', body: function () { return rdList(b); } }; }
    if (id === 'feec:tot') { var c = fe(function (f) { return isDone('f:' + f.id); }).sort(byRecent); return { title: 'Cumes FEEC feitos · ' + c.length, sub: 'Todos os cumes da lista FEEC que fixeches, os máis recentes primeiro.', body: function () { return rdList(c); } }; }
    if (id === 'feec:falten') {
      var pend = fe(function (f) { return !isDone('f:' + f.id) && (pr.done100 || f.e); });
      return { title: (pr.done100 ? 'Cumes pendentes · ' : 'Esenciais pendentes · ') + pend.length,
        sub: (pr.done100 ? 'Fáltanche ' + pr.falten + ' para chegar aos ' + pr.next + '. ' : 'Fan falta ' + pr.falten + ' máis para os 100. ') + 'Primeiro os «quero facer», despois de máis alto a máis baixo.',
        body: function () { return pendGroups(pend); } };
    }
    if (A[0] === 'uiaa') {
      var u = U.filter(function (x) { return x.k !== 'X' && (A[1] === 'tot' || x.k === (A[1] === 'p' ? 'P' : 'S')); }).map(itemUiaa), nd = u.filter(function (i) { return isDone(i.key); }).length;
      return { title: '3000 do Pirineo' + (A[1] === 'p' ? ' principais' : A[1] === 's' ? ' secundarios' : '') + ' · ' + nd + '/' + u.length, sub: 'Feitos primeiro, despois os pendentes (primeiro os «quero facer»).', body: function () { return dpBody(u); } };
    }
    if (A[0] === 'alps') {
      var al = AL.filter(function (x) { return A[1] === 'tot' || x.k === (A[1] === 'p' ? 'P' : 'S'); }).map(itemAlps), na = al.filter(function (i) { return isDone(i.key); }).length;
      return { title: '4000 dos Alpes' + (A[1] === 'p' ? ' principais' : A[1] === 's' ? ' secundarios' : '') + ' · ' + na + '/' + al.length, sub: 'Feitos primeiro, despois os pendentes (primeiro os «quero facer»).', body: function () { return dpBody(al); } };
    }
    if (id === 'cat:pend') { var cp = CAT_VIG.map(itemCat).filter(function (i) { return !isDone(i.key); }); return { title: '3000 catalás pendentes · ' + cp.length, sub: 'Primeiro os «quero facer».', body: function () { return pendGroups(cp); } }; }
    if (id === 'cat:all') { var ct = CAT_VIG.map(itemCat), nc = ct.filter(function (i) { return isDone(i.key); }).length; return { title: '3000 catalás · ' + nc + '/' + ct.length, sub: 'Os tresmiles vixentes de Cataluña.', body: function () { return dpBody(ct); } }; }
    if (id === 'sos:fet' || id === 'sos:pend') {
      var so = SOS.map(function (x) { var it = itemSostre(x); it.meta = x.com; return it; }), dn = so.filter(function (i) { return isDone(i.key); });
      return id === 'sos:fet' ? { title: 'Teitos acadados · ' + dn.length, sub: 'Os máis recentes primeiro.', body: function () { return rdList(dn.sort(byRecent)); } }
        : { title: 'Teitos pendentes · ' + (so.length - dn.length), sub: 'Primeiro os «quero facer».', body: function () { return pendGroups(so.filter(function (i) { return !isDone(i.key); })); } };
    }
    return null;
  }
  // llistes per grups (comarca, zona, massís): cada grup es desplega i mostra els seus cims
  function rsdGroups(kind) {
    var gs = {}, order = [];
    function add(name, it, isP) { var g = gs[name]; if (!g) { g = gs[name] = { name: name, items: [], n: 0, d: 0, p: 0, pd: 0, e: 0, ed: 0 }; order.push(name); } g.items.push(it); g.n++; var dn = isDone(it.key); if (dn) g.d++; if (isP) { g.p++; if (dn) g.pd++; } if (it.e) { g.e++; if (dn) g.ed++; } }
    if (kind === 'com') F.forEach(function (f) { add(f.c, feecIt(f), false); });
    else if (kind === 'zone') U.forEach(function (u) { if (u.k !== 'X') add(u.z, itemUiaa(u), u.k === 'P'); });
    else AL.forEach(function (a) { add(a.z, itemAlps(a), a.k === 'P'); });
    var arr = order.map(function (n) { return gs[n]; });
    if (kind === 'zone') arr.sort(function (a, b) { return parseInt(a.name.slice(1)) - parseInt(b.name.slice(1)); }); else arr.sort(function (a, b) { return norm(a.name) < norm(b.name) ? -1 : 1; });
    return arr;
  }
  var GRP_TABS = {
    com: { title: 'Comarcas', tabs: [['ess', 'Todos os esenciais'], ['all', 'Completas'], ['curs', 'En curso']] },
    zone: { title: 'Zonas dos 3000', tabs: [['ac', 'Rematadas'], ['pr', 'Principais rematados'], ['curs', 'En curso']] },
    mas: { title: 'Macizos dos 4000', tabs: [['ac', 'Rematados'], ['pr', 'Principais rematados'], ['curs', 'En curso']] }
  };
  function grpFilter(kind, tab, g) {
    if (kind === 'com') { var essOk = g.e > 0 && g.ed >= g.e; return tab === 'ess' ? essOk : tab === 'all' ? g.d >= g.n : (g.d > 0 && !essOk); }
    var all = g.d >= g.n; return tab === 'ac' ? all : tab === 'pr' ? (g.p > 0 && g.pd >= g.p) : (g.d > 0 && !all);
  }
  function grpSub(kind, tab, g) {
    if (kind === 'com') return (tab === 'all' ? g.d + '/' + g.n + ' cumes' : g.e ? g.ed + '/' + g.e + ' esenciais' : g.d + '/' + g.n + ' cumes');
    return (tab === 'pr' ? g.pd + '/' + g.p + ' principais' : g.d + '/' + g.n + ' cumes');
  }
  function grpBody() {
    var kind = RSD.kind, tab = RSD.tab, list = rsdGroups(kind).filter(function (g) { return grpFilter(kind, tab, g); });
    if (tab === 'curs') list.sort(function (a, b) { return (a.n - a.d) - (b.n - b.d); });
    if (!list.length) return '<div class="empty">Ningún por agora</div>';
    return list.map(function (g) {
      var open = !!RSD.open[g.name], items = g.items.slice();
      if (kind === 'com' && tab === 'ess') items = items.filter(function (i) { return i.e; });
      if (kind !== 'com' && tab === 'pr') items = items.filter(function (i) { return i.ref.k === 'P'; });
      items.sort(function (a, b) { return (isDone(b.key) - isDone(a.key)) || byAltD(a, b); });
      return '<div class="rd-g' + (open ? ' open' : '') + '"><button class="rd-gh" data-rdg="' + esc(g.name) + '"><span class="rd-gn">' + esc(zl(g.name)) + '</span><span class="rd-gs">' + esc(grpSub(kind, tab, g)) + '</span><span class="chev">▾</span></button>' + (open ? rdList(items) : '') + '</div>';
    }).join('');
  }
  function rsdOpen(id, keep) {
    SHEET_BACK = null;
    var A = id.split(':'), spec;
    if (A[0] === 'grp') {
      var cfg = GRP_TABS[A[1]];
      if (!keep || !RSD || RSD.id !== id) RSD = { id: id, kind: A[1], tab: A[2], open: {} };
      spec = { title: cfg.title, sub: A[1] === 'com' ? 'Toca unha comarca para ver os seus cumes.' : A[1] === 'zone' ? 'Toca unha zona para ver os seus cumes.' : 'Toca un macizo para ver os seus cumes.', body: grpBody, tabs: cfg.tabs };
    } else {
      spec = rsdSimple(id); if (!spec) return;
      RSD = { id: id, kind: null, tab: null, open: {} };
    }
    RSD.spec = spec;
    var tabs = spec.tabs ? '<div class="chips rd-tabs">' + spec.tabs.map(function (t) { return '<button class="chip' + (t[0] === RSD.tab ? ' on' : '') + '" data-rdt="' + t[0] + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' : '';
    openSheet('<h3>' + esc(spec.title) + '</h3><div class="sub">' + esc(spec.sub) + '</div>' + tabs + '<div id="rdBody">' + spec.body() + '</div>');
    var sh = $('#sheet');
    sh.onclick = function (e) {
      var t = e.target.closest('[data-rdt]');
      if (t) { RSD.tab = t.dataset.rdt; $$('#sheet [data-rdt]').forEach(function (x) { x.classList.toggle('on', x === t); }); $('#rdBody').innerHTML = spec.body(); return; }
      var g = e.target.closest('[data-rdg]');
      if (g) { var n = g.dataset.rdg; RSD.open[n] = !RSD.open[n]; $('#rdBody').innerHTML = spec.body(); return; }
      var r = e.target.closest('[data-rdk]');
      if (r) { var it = itemByKey(r.dataset.rdk); if (!it) return; SHEET_BACK = function () { rsdOpen(RSD.id, true); }; openItem(it); }
    };
  }

  var NEST = {};
  var RS_NAMES = { feec: '100 Cims FEEC', com: 'Comarcas', t3000: '3000 do Pirineo', sos: 'Teitos comarcais', alps: '4000 dos Alpes' };
  function resumOrder() {
    var d = ['feec', 'com', 't3000', 'sos', 'alps'], x = null;
    try { x = JSON.parse(localStorage.getItem('cimsResumOrder')); } catch (e) { }
    if (x && x.length) { x = x.filter(function (k) { return d.indexOf(k) >= 0; }); d.forEach(function (k) { if (x.indexOf(k) < 0) x.push(k); }); return x; }
    return d;
  }
  function orderSheet() {
    var o = resumOrder();
    openSheet('<h3>Orde do resumo</h3><div class="sub">Move cada bloque cara arriba ou cara abaixo.</div><ul class="ord">' + o.map(function (k, i) {
      return '<li><span>' + esc(RS_NAMES[k]) + '</span><button class="btn" data-mv="' + i + '" data-d="-1"' + (i ? '' : ' disabled') + '>↑</button><button class="btn" data-mv="' + i + '" data-d="1"' + (i < o.length - 1 ? '' : ' disabled') + '>↓</button></li>';
    }).join('') + '</ul><div class="btns"><button class="btn pri" data-ok="1">Feito</button><button class="btn" data-reset="1">Orde por defecto</button></div>');
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-mv]');
      if (b) { var i = +b.dataset.mv, j = i + (+b.dataset.d), a = resumOrder(), t = a[i]; a[i] = a[j]; a[j] = t; try { localStorage.setItem('cimsResumOrder', JSON.stringify(a)); } catch (er) { } renderResum(); orderSheet(); return; }
      if (e.target.closest('[data-reset]')) { try { localStorage.removeItem('cimsResumOrder'); } catch (er) { } renderResum(); orderSheet(); return; }
      if (e.target.closest('[data-ok]')) closeSheet();
    };
  }
  function resumOpen() {
    var d = { feec: true, com: false, t3000: false, sos: false, alps: false };
    try { var x = JSON.parse(localStorage.getItem('cimsResumOpen')); if (x) Object.assign(d, x); } catch (e) { }
    return d;
  }
  $('#v-resum').addEventListener('click', function (e) {
    var h2 = e.target.closest('[data-rsh2]');
    if (h2) {
      var box = h2.parentNode, id2 = h2.dataset.rsh2, o2 = resumOpen(), op = !box.classList.contains('open');
      var inner = $('.rs2-in', box); if (op && !inner.innerHTML && NEST[id2]) inner.innerHTML = NEST[id2]();
      void box.offsetWidth; box.classList.toggle('open', op); o2['n_' + id2] = op;
      try { localStorage.setItem('cimsResumOpen', JSON.stringify(o2)); } catch (er) { }
      return;
    }
    if (e.target.closest('[data-rsorder]')) { orderSheet(); return; }
    var rd = e.target.closest('[data-rsd]'); if (rd) { rsdOpen(rd.dataset.rsd); return; }
    var ck = e.target.closest('[data-ckey]');
    if (ck) { var itc = itemByKey(ck.dataset.ckey); if (itc) openItem(itc); return; }
    var hb = e.target.closest('[data-rsh]');
    if (hb) {
      var card = hb.parentNode, o = resumOpen(); o[hb.dataset.rsh] = !card.classList.contains('open');
      card.classList.toggle('open', o[hb.dataset.rsh]);
      try { localStorage.setItem('cimsResumOpen', JSON.stringify(o)); } catch (er) { }
      return;
    }
    var gl = e.target.closest('[data-golist]'), gc = e.target.closest('[data-gocom]'), gz = e.target.closest('[data-gozone]'), gm = e.target.closest('[data-gomas]');
    if (!gl && !gc && !gz && !gm) return;
    LS.list = gl ? gl.dataset.golist : gc ? 'feec' : gm ? 'alps' : 'uiaa'; LS.estat = 'tots'; LS.tipus = 'tots'; LS.grp = gc ? gc.dataset.gocom : gz ? gz.dataset.gozone : gm ? gm.dataset.gomas : ''; LS.q = ''; $('#q').value = '';
    showView('llistes'); renderSeg(); renderFilters(); renderList(); $('#v-llistes').scrollTop = 0;
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-gostats]')) { showView('stats'); return; }
    if (e.target.closest('[data-statsback]')) { showView('resum'); return; }
    var sp = e.target.closest('#v-stats [data-stp]'); if (sp) { STP = sp.dataset.stp; if (STP === 'custom' && !STC) { var r0 = statPeriod('custom'); STC = { a: r0.a, b: r0.b }; } renderStats(); return; }
  });
  function nameOfKey(k) {
    var t = k.slice(0, 1), id = k.slice(2);
    if (t === 'f') return fById[id] ? fById[id].n : id;
    if (t === 'u') return uById[id] ? uById[id].n : id;
    if (t === 'a') return aById[id] ? aById[id].n : id;
    if (t === 's') { var s = SOS.filter(function (x) { return x.id === id; })[0]; return s ? s.n : id; }
    if (t === 'p') { var p = S.points.filter(function (x) { return x.id === id; })[0]; return p ? p.n : id; }
    return k;
  }

  // ---------- LLISTES ----------
  var LS = { list: 'feec', q: '', estat: 'tots', tipus: 'tots', grp: '', sort: 'alt' };
  function listItems() {
    var arr;
    if (LS.list === 'feec') arr = F.map(itemFeec);
    else if (LS.list === 'uiaa') arr = U.map(itemUiaa);
    else if (LS.list === 'cat') arr = CAT.map(itemCat);
    else if (LS.list === 'alps') arr = AL.map(itemAlps);
    else arr = SOS.map(itemSostre);
    var q = norm(LS.q);
    arr = arr.filter(function (it) {
      if (q && norm(it.name + ' ' + it.meta).indexOf(q) < 0) return false;
      var d = isDone(it.key);
      if (LS.estat === 'pend' && d) return false;
      if (LS.estat === 'fets' && !d) return false;
      if (LS.estat === 'vull' && !isWant(it.key)) return false;
      if (LS.list === 'feec') {
        if (LS.tipus === 'ess' && !it.ref.e) return false;
        if (LS.tipus === 'noess' && it.ref.e) return false;
        if (LS.grp && it.ref.r.split(',').map(function (s) { return s.trim(); }).indexOf(LS.grp) < 0) return false;
      }
      if (LS.list === 'uiaa' || LS.list === 'alps') {
        if (LS.tipus === 'P' && it.ref.k !== 'P') return false;
        if (LS.tipus === 'S' && it.ref.k !== 'S') return false;
        if (LS.grp && it.ref.z !== LS.grp) return false;
      }
      return true;
    });
    var fd = function (it) { var r = S.done[it.key]; return r && r.d ? r.d : ''; };
    arr.sort(LS.sort === 'nom' ? function (a, b) { return norm(a.name) < norm(b.name) ? -1 : 1; } :
      LS.sort === 'data' ? function (a, b) { var x = fd(a), y = fd(b); return x && y ? (x < y ? 1 : x > y ? -1 : 0) : x ? -1 : y ? 1 : (b.alt || 0) - (a.alt || 0); } :
      function (a, b) { return (b.alt || 0) - (a.alt || 0); });
    return arr;
  }
  function nFiltres() { return (LS.tipus !== 'tots' ? 1 : 0) + (LS.grp ? 1 : 0) + (LS.sort !== 'alt' ? 1 : 0); }
  function renderFilters() {
    var nW = 0; listBase().forEach(function (it) { if (isWant(it.key)) nW++; });
    $('#filters').innerHTML = [['tots', 'Todos'], ['pend', 'Pendentes'], ['fets', 'Feitos'], ['vull', '★ Quero facer' + (nW ? ' · ' + nW : '')]].map(function (o) {
      return '<button class="' + (LS.estat === o[0] ? 'on' : '') + (o[0] === 'vull' ? ' v' : '') + '" data-estat="' + o[0] + '">' + o[1] + '</button>';
    }).join('');
    var n = nFiltres(), b = $('#fltBtn'); if (b) { $('em', b).textContent = n || ''; $('em', b).classList.toggle('hidden', !n); }
  }
  function listBase() {
    return LS.list === 'feec' ? F.map(itemFeec) : LS.list === 'uiaa' ? U.map(itemUiaa) : LS.list === 'cat' ? CAT.map(itemCat) : LS.list === 'alps' ? AL.map(itemAlps) : SOS.map(itemSostre);
  }
  function openFilters() {
    var h = '<h3>Filtros</h3><div class="sub">' + esc({ feec: '100 Cims FEEC', uiaa: '3000 do Pirineo', cat: '3000 catalás', sostres: 'Teitos comarcais', alps: '4000 dos Alpes' }[LS.list]) + '</div>';
    var chips = function (attr, cur, arr) { return '<div class="chips">' + arr.map(function (o) { return '<button class="chip' + (cur === o[0] ? ' on' : '') + '" data-' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    if (LS.list === 'feec') h += '<h4 class="fh">Tipo</h4>' + chips('ftipus', LS.tipus, [['tots', 'Todos'], ['ess', 'Esenciais'], ['noess', 'Non esenciais']]);
    if (LS.list === 'uiaa' || LS.list === 'alps') h += '<h4 class="fh">Tipo</h4>' + chips('ftipus', LS.tipus, [['tots', 'Todos'], ['P', 'Principais'], ['S', 'Secundarios']]);
    var opts = null, lab = '';
    if (LS.list === 'feec') { var coms = {}; F.forEach(function (f) { f.r.split(',').forEach(function (c) { coms[c.trim()] = 1; }); }); opts = Object.keys(coms).sort(function (a, b) { return norm(a) < norm(b) ? -1 : 1; }); lab = ['Comarca', 'Todas as comarcas']; }
    else if (LS.list === 'uiaa') { var zs = {}; U.forEach(function (u) { zs[u.z] = 1; }); opts = Object.keys(zs).sort(function (a, b) { return parseInt(a.slice(1)) - parseInt(b.slice(1)); }); lab = ['Zona', 'Todas as zonas']; }
    else if (LS.list === 'alps') { var ms = {}; AL.forEach(function (a) { ms[a.z] = 1; }); opts = Object.keys(ms).sort(); lab = ['Macizo', 'Todos os macizos']; }
    if (opts) h += '<h4 class="fh">' + lab[0] + '</h4><select class="fsel" id="fGrp"><option value="">' + lab[1] + '</option>' + opts.map(function (c) { return '<option value="' + esc(c) + '"' + (LS.grp === c ? ' selected' : '') + '>' + esc(zl(c)) + '</option>'; }).join('') + '</select>';
    h += '<h4 class="fh">Orde</h4>' + chips('fsort', LS.sort, [['alt', 'Altitude'], ['nom', 'Nome'], ['data', 'Data']]);
    h += '<div class="btns"><button class="btn" data-fclear="1">Limpar</button><button class="btn pri" data-fok="1" id="fOk">Amosar ' + listItems().length + ' cumes</button></div>';
    openSheet(h);
    var sh = $('#sheet');
    var upd = function () { renderFilters(); renderList(); $('#fOk').textContent = 'Amosar ' + listItems().length + ' cumes'; };
    sh.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ftipus) { LS.tipus = b.dataset.ftipus; $$('#sheet [data-ftipus]').forEach(function (x) { x.classList.toggle('on', x === b); }); upd(); }
      if (b.dataset.fsort) { LS.sort = b.dataset.fsort; $$('#sheet [data-fsort]').forEach(function (x) { x.classList.toggle('on', x === b); }); upd(); }
      if (b.dataset.fclear) { LS.tipus = 'tots'; LS.grp = ''; LS.sort = 'alt'; openFilters(); renderFilters(); renderList(); }
      if (b.dataset.fok) closeSheet();
    };
    var g = $('#fGrp'); if (g) g.onchange = function () { LS.grp = g.value; upd(); };
  }
  var SEG_LIST = { feec: 'feec', uiaa: 'uiaa', cat: 'cat', sostres: 'sos', alps: 'alps' };
  function renderSeg() {
    var first = null;
    $$('#listSeg button').forEach(function (b) { var ok = lsOn(SEG_LIST[b.dataset.l]); b.classList.toggle('hidden', !ok); if (ok && !first) first = b.dataset.l; });
    if (!lsOn(SEG_LIST[LS.list]) && first) { LS.list = first; LS.tipus = 'tots'; LS.grp = ''; }
    $$('#listSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === LS.list); });
    var C = { feec: F.filter(function (f) { return isDone('f:' + f.id); }).length, uiaa: U.filter(function (u) { return u.k !== 'X' && isDone('u:' + u.id); }).length,
      cat: CAT_VIG.filter(function (c) { return isDone('u:' + c.ref); }).length, sostres: SOS.filter(function (x) { return isDone(x.f ? 'f:' + x.f : 's:' + x.id); }).length, alps: AL.filter(function (a) { return isDone('a:' + a.id); }).length };
    $$('#listSeg button').forEach(function (b) { var l = b.dataset.l, base = b.dataset.t || (b.dataset.t = b.textContent); b.innerHTML = esc(base) + '<small>' + C[l] + '</small>'; });
  }
  function renderListProg() {
    var all = LS.list === 'feec' ? F.map(itemFeec) : LS.list === 'uiaa' ? U.map(itemUiaa) : LS.list === 'cat' ? CAT.map(itemCat) : LS.list === 'alps' ? AL.map(itemAlps) : SOS.map(itemSostre);
    var dn = function (arr) { return arr.filter(function (i) { return isDone(i.key); }).length; };
    var t = all.length, d = dn(all), pc = t ? Math.round(d / t * 100) : 0, h = bar('Feitos · faltan ' + (t - d), pc + '% · ' + d + ' de ' + t, t ? d / t : 0, 'var(--pine)');
    var sub = null;
    if (LS.list === 'feec') sub = ['Esenciais', all.filter(function (i) { return i.ref.e; })];
    else if (LS.list === 'uiaa' || LS.list === 'alps') sub = ['Principais', all.filter(function (i) { return i.ref.k === 'P'; })];
    if (sub && sub[1].length && sub[1].length < t) { var sd = dn(sub[1]), sn = LS.list === 'feec' ? 100 : sub[1].length; if (sd > sn) sd = sn; sub[1] = { length: sn }; h += bar(sub[0] + ' · faltan ' + (sn - sd), Math.round(sd / sn * 100) + '% · ' + sd + ' de ' + sn, sd / sn, 'var(--sky-d)'); }
    $('#listProg').innerHTML = h;
  }
  function renderList() {
    renderListProg();
    var items = listItems(), nd = items.filter(function (i) { return isDone(i.key); }).length, nw = items.filter(function (i) { return isWant(i.key); }).length;
    $('#listCount').textContent = items.length + ' cumes · ' + nd + ' feitos' + (nw ? ' · ' + nw + ' quero facer' : '');
    $('#list').innerHTML = items.length ? items.map(function (it) {
      var d = isDone(it.key), w = isWant(it.key), dd = d && S.done[it.key].d, na = d ? nAsc(it.key) : 0, wd = w && S.want[it.key].d;
      var tag = d ? (dd ? 'feito ' + fmtDate(dd).slice(0, 6) + fmtDate(dd).slice(8) : 'feito') : w ? (wd ? 'quero facer · ' + fmtDate(wd).slice(0, 5) : 'quero facer') : '';
      return '<li class="row' + (d ? ' done' : w ? ' want' : '') + '" data-key="' + esc(it.key) + '" data-kind="' + it.kind + '" data-i="' + esc(it.kind === 'sostre' ? it.ref.id : it.kind === 'cat' ? it.ref.n : it.ref.id) + '">' +
        '<button class="chk" aria-label="Marcar como feito">' + (w ? '★' : '✓') + '</button><div class="body"><div class="nm">' + esc(it.name) + '</div>' +
        '<div class="meta">' + it.badges.map(function (b) { return '<span class="badge ' + b[1] + '" style="margin:0 4px 0 0">' + esc(b[0]) + '</span>'; }).join('') + esc(it.meta) + '</div></div>' +
        '<div class="alt">' + fmtAlt(it.alt) + (na > 1 ? '<span class="xn">×' + na + '</span>' : '') + (tag ? '<small>' + tag + '</small>' : '') + '</div>' +
        (d ? '' : '<button class="wnt' + (w ? ' on' : '') + '" aria-label="Quero facer">' + (w ? '★' : '☆') + '</button>') + '</li>';
    }).join('') : '<div class="empty">Ningún cume con estes filtros</div>';
  }
  function findItem(kind, i) {
    if (kind === 'feec') return itemFeec(fById[i]);
    if (kind === 'uiaa') return itemUiaa(uById[i]);
    if (kind === 'cat') return itemCat(CAT.filter(function (c) { return c.n === i; })[0]);
    if (kind === 'alps') return itemAlps(aById[i]);
    return itemSostre(SOS.filter(function (s) { return s.id === i; })[0]);
  }

  // ---------- detail sheet ----------
  var sheetOpen = false;
  var sheetT = null;
  var MENU_SHOWN = false, FROM_MENU = false; // FROM_MENU: la fulla actual ve de Configuració (enrere hi torna)
  function openSheet(html) {
    var sh = $('#sheet'), sc = $('#scrim'), wasOpen = sheetOpen && !sh.classList.contains('closing');
    MENU_SHOWN = false;
    clearTimeout(sheetT); sh.classList.remove('closing'); sc.classList.remove('closing');
    sh.style.transform = sh.style.transition = sc.style.opacity = sc.style.transition = '';
    sh.innerHTML = '<div class="grab"></div>' + html; sh.classList.remove('hidden'); sc.classList.remove('hidden'); sh.scrollTop = 0; sheetOpen = true;
    if (!wasOpen) { sh.classList.remove('opening'); void sh.offsetWidth; sh.classList.add('opening'); }
  }
  var SHEET_BACK = null;
  function closeSheet() {
    var sh = $('#sheet'), sc = $('#scrim'); sheetOpen = false; SHEET_BACK = null; SHEET_UP = null; FROM_MENU = false;
    if (sh.classList.contains('hidden')) return;
    sh.classList.add('closing'); sc.classList.add('closing');
    clearTimeout(sheetT);
    sheetT = setTimeout(function () { sh.classList.add('hidden'); sc.classList.add('hidden'); sh.classList.remove('closing', 'opening'); sc.classList.remove('closing'); }, 220);
  }
  // lliscar la fulla cap avall per tancar-la (des de dalt de tot de la fulla)
  (function () {
    var sh = $('#sheet'), sc = $('#scrim'), y0 = null, x0 = 0, dy = 0, t0 = 0, drag = false;
    sh.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || sh.scrollTop > 0 || e.target.closest('input,select,textarea,.tri')) { y0 = null; return; }
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; drag = false; t0 = Date.now();
    }, { passive: true });
    sh.addEventListener('touchmove', function (e) {
      if (y0 == null) return;
      var d = e.touches[0].clientY - y0, dx = Math.abs(e.touches[0].clientX - x0);
      if (!drag) { if (d > 8 && d > dx && sh.scrollTop <= 0) { drag = true; sh.style.transition = 'none'; } else if (d < -4 || dx > 10) { y0 = null; return; } else return; }
      dy = Math.max(0, d); sh.style.transform = 'translateY(' + dy + 'px)'; sc.style.opacity = String(Math.max(0, 1 - dy / 400));
      e.preventDefault();
    }, { passive: false });
    function end() {
      if (y0 == null) return; y0 = null;
      if (!drag) return; drag = false;
      var v = dy / Math.max(1, Date.now() - t0);
      sh.style.transition = 'transform .2s ease-out'; sc.style.transition = 'opacity .2s';
      if (dy > 110 || v > 0.6) {
        sh.style.transform = 'translateY(100%)'; sc.style.opacity = '0'; sheetOpen = false; SHEET_BACK = null;
        clearTimeout(sheetT);
        sheetT = setTimeout(function () { sh.classList.add('hidden'); sc.classList.add('hidden'); sh.classList.remove('closing', 'opening'); sh.style.transform = sh.style.transition = sc.style.opacity = sc.style.transition = ''; }, 210);
      } else {
        sh.style.transform = ''; sc.style.opacity = '';
        setTimeout(function () { sh.style.transition = sc.style.transition = ''; }, 210);
      }
    }
    sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
  })();
  // ---------- diari: totes les sortides en una sola línia de temps ----------
  // Cims de les llistes (ascensions), sortides d'escalada, punts amb data i rutes es llegeixen d'on són desats
  // i es presenten junts per dia. No es canvia com es desen: res a migrar, res a perdre.
  var LSHORT = { f: '100 Cims', u: '3000', a: '4000', s: 'Sostre' };
  function diariDays() {
    var D = {}, und = 0;
    var add = function (d, it) { (D[d] = D[d] || []).push(it); };
    var seen = {}, lkd = {};
    S.points.forEach(function (p) { if (!officialPoint(p)) (p.vs || []).forEach(function (v) { if (v.id && v.cm && v.cm.length && /^\d{4}-\d\d-\d\d$/.test(v.d || '')) lkd[v.id] = 1; }); });
    S.routes.forEach(function (r) { if (r.id && r.cm && r.cm.length && /^\d{4}-\d\d-\d\d$/.test(r.d || '')) lkd[r.id] = 1; });
    Object.keys(S.done).forEach(function (k) {
      var tk = twinKeys(k), c = tk[0]; if (seen[c] || !tk.some(listOnFor)) return; seen[c] = 1;
      var info = cimInfo(c) || cimInfo(k); if (!info) return;
      var labs = tk.filter(function (kk) { return S.done[kk] && listOnFor(kk); }).map(function (kk) { return LSHORT[kk[0]]; });
      var A = ascList(S.done[k]); if (!A.some(function (x) { return x.d; })) und++;
      A.forEach(function (x) { if (x.d && !(x.vid && lkd[x.vid])) add(x.d, { o: 0, a: 'data-gk="' + esc(c) + '"', n: info.n, m: labs.join(' · ') + (info.h ? ' · ' + fmtAlt(info.h) : ''), c: x.c || '' }); });
    });
    S.points.forEach(function (p) {
      if (officialPoint(p)) return;
      var vd = {};
      (p.vs || []).forEach(function (v) {
        if (!/^\d{4}-\d\d-\d\d$/.test(v.d || '')) return; vd[v.d] = 1;
        add(v.d, { o: 1, a: 'data-gp="' + esc(p.id) + '"', n: v.v || p.n, m: [p.g === 'Escalades' ? 'Escalada' : p.g, p.n !== v.v ? p.n : '', v.gr].filter(Boolean).join(' · ') + (v.cm && v.cm.length ? ' · ⛰ ' + v.cm.map(nameOfKey).join(', ') : ''), c: v.c || '' });
      });
      ptDates(p).forEach(function (d) { if (!vd[d]) add(d, { o: 2, a: 'data-gp="' + esc(p.id) + '"', n: p.n, m: (p.g || 'Punto') + (p.h ? ' · ' + fmtAlt(p.h) : ''), c: (p.ac && p.ac[d]) || '' }); });
    });
    S.routes.forEach(function (r, i) { if (r.d) add(r.d, { o: 3, a: 'data-gr="' + i + '"', n: r.n, m: (r.t || 'Ruta') + (r.km ? ' · ' + r.km + ' km' : '') + (r.up ? ' · +' + r.up + ' m' : '') + (r.cm && r.cm.length ? ' · ⛰ ' + r.cm.map(nameOfKey).join(', ') : ''), c: '' }); });
    var days = Object.keys(D).sort().reverse().map(function (d) { return { d: d, it: D[d].sort(function (a, b) { return a.o - b.o; }) }; });
    return { days: days, und: und };
  }
  var DOW = ['dom.', 'lun.', 'mar.', 'mér.', 'xov.', 'ven.', 'sáb.'], DIA = { y: null, t: 'all', q: '' };
  var DTYPES = [['all', 'Todo'], ['0', 'Cumes'], ['1', 'Escalada'], ['2', 'Puntos'], ['3', 'Rutas']], DCOL = ['#4E9F6D', '#D9822B', '#7B66C9', '#E5173F'];
  function renderDiari() {
    var el = $('#v-diari'); if (!el) return;
    var R = diariDays(), ys = [];
    R.days.forEach(function (x) { var y = x.d.slice(0, 4); if (ys.indexOf(y) < 0) ys.push(y); });
    if (DIA.y == null || (DIA.y !== 'all' && ys.indexOf(DIA.y) < 0)) DIA.y = ys[0] || 'all';
    el.innerHTML = '<div class="dia-top"><div class="dia-row"><button class="st-back" data-statsback="1">‹ Atrás</button><input id="diaQ" class="dia-q" type="search" autocomplete="off" placeholder="Busca: cume, vía, compañeiro, nota…" value="' + esc(DIA.q) + '"></div>' +
      '<div class="dia-chips"><select id="diaY" class="st-yr on" aria-label="Ano">' + [['all', 'Todos os anos']].concat(ys.map(function (y) { return [y, y]; })).map(function (y) { return '<option value="' + y[0] + '"' + (DIA.y === y[0] ? ' selected' : '') + '>' + y[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="dia-chips">' + DTYPES.map(function (t) { return '<button class="chip' + (DIA.t === t[0] ? ' on' : '') + '" data-dt="' + t[0] + '">' + (t[0] !== 'all' ? '<i class="dia-dot" style="background:' + DCOL[+t[0]] + '"></i>' : '') + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div id="diaL"></div>';
    el._R = R; diaList();
  }
  function diaList() {
    var el = $('#v-diari'), R = el._R, q = norm(DIA.q || '');
    var out = [], nD = 0, nI = 0;
    R.days.forEach(function (x) {
      if (DIA.y !== 'all' && x.d.slice(0, 4) !== DIA.y) return;
      var it = x.it.filter(function (i) { return (DIA.t === 'all' || String(i.o) === DIA.t) && (!q || norm(i.n + ' ' + i.m + ' ' + i.c).indexOf(q) >= 0); });
      if (!it.length) return;
      nD++; nI += it.length;
      var dt = new Date(x.d + 'T12:00:00');
      out.push('<div class="dia-d"><div class="dia-h"><span><b>' + DOW[dt.getDay()] + '</b> ' + fmtDate(x.d) + '</span><small>' + it.length + '</small></div>' + it.map(function (i) {
        return '<button class="dia-i" ' + i.a + '><i class="dia-dot" style="background:' + DCOL[i.o] + '"></i><span class="dia-b"><span class="gs-n">' + esc(i.n) + '</span><span class="gs-m">' + esc(i.m) + (i.c ? '<br><small>' + esc(i.c) + '</small>' : '') + '</span></span></button>';
      }).join('') + '</div>');
    });
    $('#diaL').innerHTML = (nD ? '<div class="dia-sum">' + nD + ' días · ' + nI + ' entradas' + (q && DIA.y !== 'all' ? ' · <button class="h-link" data-dy="all">Buscar en todos os anos</button>' : '') + '</div>' : '') +
      (out.join('') || '<div class="empty">' + (q ? 'Nada con «' + esc(DIA.q) + '»' + (DIA.y !== 'all' ? ' neste ano. <button class="h-link" data-dy="all">Buscar en todos os anos</button>' : '') : 'Nada con estes filtros.') + '</div>') +
      (R.und && DIA.t !== '1' && DIA.t !== '3' && !q ? '<div class="detail">' + R.und + ' cumes feitos sen data non aparecen no diario.</div>' : '');
  }
  if (!$('#v-diari')) { var dsec = document.createElement('section'); dsec.id = 'v-diari'; dsec.className = 'view'; $('#v-stats').parentNode.appendChild(dsec); }
  $('#v-diari').addEventListener('change', function (e) { if (e.target.id === 'diaY') { DIA.y = e.target.value; renderDiari(); } });
  $('#v-diari').addEventListener('input', function (e) { if (e.target.id === 'diaQ') { DIA.q = e.target.value; diaList(); } });
  $('#v-diari').addEventListener('click', function (e) {
    var y = e.target.closest('[data-dy]'); if (y) { DIA.y = y.dataset.dy; renderDiari(); return; }
    var t = e.target.closest('[data-dt]'); if (t) { DIA.t = t.dataset.dt; renderDiari(); return; }
    var b = e.target.closest('.dia-i'); if (!b) return;
    if (b.dataset.gk) { var it = itemByKey(b.dataset.gk); if (it) openItem(it); }
    else if (b.dataset.gp) { var p = S.points.filter(function (x) { return x.id === b.dataset.gp; })[0]; if (p) openPoint(p); }
    else if (b.dataset.gr != null) { var r = S.routes[+b.dataset.gr]; if (r) openRoute(r); }
  });
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-diari]'); if (b) { e.stopPropagation(); showView('diari'); } });
  // ---------- cerca global: cims de totes les llistes, punts, vies i rutes ----------
  function gsRender(qs) {
    var q = norm(qs || ''), out = [];
    if (q.length < 2) { $('#gsR').innerHTML = '<div class="empty">Escribe polo menos 2 letras: un cume, un punto, unha vía, un compañeiro ou unha ruta.</div>'; return; }
    var hit = function (t) { return norm(t || '').indexOf(q) >= 0; }, LIM = 15;
    var row = function (attr, n, meta, ok) { return '<button class="gs-r" ' + attr + '><span class="gs-n">' + (ok ? '<i class="gs-ok">✓</i> ' : '') + esc(n) + '</span><span class="gs-m">' + meta + '</span></button>'; };
    var sec = function (t, L) { if (L.length) out.push('<div class="gs-h">' + t + ' <small>' + L.length + (L.length >= LIM ? '+' : '') + '</small></div>' + L.join('')); };
    var cims = [], seen = {};
    var addC = function (k, n, h, lab) { var tk = twinKeys(k)[0]; if (seen[tk] || cims.length >= LIM) return; seen[tk] = 1; cims.push(row('data-gk="' + esc(k) + '"', n, esc(lab) + (h ? ' · ' + fmtAlt(h) : ''), isDone(k))); };
    if (lsOn('feec')) F.forEach(function (f) { if (hit(f.n)) addC('f:' + f.id, f.n, f.h, '100 Cims'); });
    if (lsOn('uiaa') || lsOn('cat')) U.forEach(function (u) { if (hit(u.n)) addC('u:' + u.id, u.n, u.h, '3000'); });
    if (lsOn('alps')) AL.forEach(function (a) { if (hit(a.n)) addC('a:' + a.id, a.n, a.h, '4000'); });
    if (lsOn('sos')) SOS.forEach(function (x) { if (hit(x.n) || hit(x.com)) addC(sosKey(x), x.n, x.h, 'Teito · ' + x.com); });
    sec('Cumes das listas', cims);
    var pts = [], vies = [];
    S.points.forEach(function (p) {
      if (!officialPoint(p) && pts.length < LIM && (hit(p.n) || hit(p.z) || hit(p.nt))) pts.push(row('data-gp="' + esc(p.id) + '"', p.n, esc([p.g, zoneName(p.z)].filter(Boolean).join(' · ')), false));
      (p.vs || []).forEach(function (v) {
        if (vies.length < LIM && (hit(v.v) || hit(v.c) || hit(v.nt))) vies.push(row('data-gp="' + esc(p.id) + '"', v.v || p.n, esc([p.n, v.gr, v.d ? fmtDate(v.d) : ''].filter(Boolean).join(' · ')) + (v.c && hit(v.c) ? '<br><small>' + esc(v.c) + '</small>' : ''), false));
      });
    });
    sec('Puntos', pts); sec('Vías e saídas', vies);
    var rts = [];
    S.routes.forEach(function (r, i) { if (rts.length < LIM && hit(r.n)) rts.push(row('data-gr="' + i + '"', r.n, [r.d ? fmtDate(r.d) : r.y || '', r.km ? r.km + ' km' : ''].filter(Boolean).join(' · '), false)); });
    sec('Rutas', rts);
    $('#gsR').innerHTML = out.join('') || '<div class="empty">Nada con «' + esc(qs) + '»</div>';
  }
  var gsLast = '';
  function openSearch() {
    openSheet('<h3>Busca</h3><input id="gsQ" class="gs-q" type="search" autocomplete="off" placeholder="Cume, punto, vía, compañeiro, ruta…" value="' + esc(gsLast) + '"><div id="gsR" class="gs-res"></div>');
    var inp = $('#gsQ'); gsRender(gsLast);
    inp.addEventListener('input', function () { gsLast = inp.value; gsRender(inp.value); });
    setTimeout(function () { try { inp.focus(); } catch (e) { } }, 250);
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('.gs-r'); if (!b) return;
      if (b.dataset.gk) { var it = itemByKey(b.dataset.gk); if (it) openItem(it); }
      else if (b.dataset.gp) { var p = S.points.filter(function (x) { return x.id === b.dataset.gp; })[0]; if (p) openPoint(p); }
      else if (b.dataset.gr != null) { var r = S.routes[+b.dataset.gr]; if (r) openRoute(r); }
    };
  }
  (function () { var b = $('#gsBtn'); if (b) b.addEventListener('click', openSearch); })();
  // «Últims cims»: tocar un cim n'obre la fitxa
  document.addEventListener('click', function (e) {
    var li = e.target.closest && e.target.closest('.recent li[data-rk]'); if (!li) return;
    var k = li.dataset.rk;
    if (k.slice(0, 2) === 'p:') { var pt = S.points.filter(function (x) { return x.id === k.slice(2); })[0]; if (pt) openPoint(pt); return; }
    var it = itemByKey(k); if (it) openItem(it);
  });
  function openItem(it) {
    var d = isDone(it.key), rec = S.done[it.key] || {};
    var kv = '<b>Altitude</b><span>' + fmtAlt(it.alt) + '</span>';
    if (it.kind === 'feec') {
      kv += '<b>Comarcas</b><span>' + esc(it.ref.r) + '</span><b>Tipo</b><span>' + (it.ref.e ? 'Esencial' : 'Non esencial') + '</span>';
      if (sostreOf[it.ref.id]) kv += '<b>Teito de</b><span>' + esc(sostreOf[it.ref.id].join(', ')) + '</span>';
    } else if (it.kind === 'uiaa') {
      kv += '<b>Zona</b><span>' + esc(zl(it.ref.z)) + '</span><b>Lista UIAA</b><span>' + (it.ref.k === 'P' ? 'Principal' : it.ref.k === 'S' ? 'Secundari' : 'Non (só lista catalá)') + (it.ref.num && it.ref.num !== '—' ? ' · nº ' + esc(it.ref.num) : '') + '</span><b>Tresmil catalán</b><span>' + (it.ref.ca ? 'Si' : 'Non') + '</span>';
    } else if (it.kind === 'alps') {
      kv += '<b>Macizo</b><span>' + esc(it.ref.z) + '</span><b>País</b><span>' + esc(it.ref.co) + '</span><b>Lista UIAA</b><span>' + (it.ref.k === 'P' ? 'Principal' : 'Secundari') + (/^\d+$/.test(it.ref.num) ? ' · nº ' + it.ref.num : '') + '</span>' + (it.ref.la == null ? '<b>Coordenadas</b><span>Non dispoñibles</span>' : '');
    } else if (it.kind === 'cat') {
      kv += '<b>Zona</b><span>' + esc(zl(it.ref.z)) + '</span><b>Estado</b><span>' + esc(it.ref.est) + '</span><b>Lista UIAA</b><span>' + esc(it.ref.k) + '</span>';
    } else {
      kv += '<b>Comarca</b><span>' + esc(it.ref.com) + '</span><b>Serra / zona</b><span>' + esc(it.ref.z || '') + '</span><b>100 Cims</b><span>' + (it.f ? (it.f.e ? 'Esencial' : 'Non esencial') : 'Non está') + '</span>';
    }
    var links = '';
    if (it.kind === 'feec' || (it.kind === 'sostre' && it.f)) { var ff = it.kind === 'feec' ? it.ref : it.f; links += '<a class="btn lnk" href="https://www.feec.cat/activitats/100-cims/cim/' + esc(ff.u) + '/" target="_blank">Ficha FEEC ↗</a>'; }
    if (it.ll) {
      links += '<button class="btn lnk" data-act="showmap" data-la="' + it.ll[0] + '" data-lo="' + it.ll[1] + '">Ver no mapa</button>';
      links += '<a class="btn lnk" href="https://www.google.com/maps/search/?api=1&query=' + it.ll[0] + ',' + it.ll[1] + '" target="_blank">Google Maps ↗</a>';
    } else {
      links += '<a class="btn lnk" href="https://www.google.com/search?q=' + encodeURIComponent(it.name + ' ' + fmtAlt(it.alt)) + '" target="_blank">Buscar na web ↗</a>';
    }
    var photoF = it.kind === 'feec' ? it.ref : (it.kind === 'sostre' ? it.f : null);
    var pk = phKeyFor(it);
    var photo = pk ? '<div class="photo ph-load" data-pk="' + esc(pk) + '" data-fb="' + esc(photoF && photoF.img || '') + '"><img alt="" decoding="async"><span>' + (photoF ? 'Foto: FEEC' : 'Foto: Wikipedia / Wikimedia Commons') + '</span></div>'
      : photoF && photoF.img ? '<div class="photo"><img src="' + esc(photoF.img) + '" alt="" decoding="async" fetchpriority="high" onerror="this.parentNode.style.display=\'none\'"><span>Foto: FEEC</span></div>' : '';
    var A = d ? ascList(rec) : [];
    var h = (SHEET_BACK ? '<button class="sh-back" data-act="back">‹ Volver á lista</button>' : '') + photo + '<h3>' + esc(it.name) + '</h3><div class="sub">' + it.badges.map(function (b) { return '<span class="badge ' + b[1] + '" style="margin:0 4px 0 0">' + esc(b[0]) + '</span>'; }).join('') + '</div>' +
      '<div class="kv">' + kv + '</div>' +
      '<div class="tri"><button data-act="st-pend" class="' + (!d && !isWant(it.key) ? 'on n' : '') + '">Pendente</button><button data-act="st-vull" class="' + (isWant(it.key) ? 'on w' : '') + '">★ Quero facer</button><button data-act="st-fet" class="' + (d ? 'on f' : '') + '">✓ Feito</button></div>' +
      (!d ? '<button class="lnk-s" data-act="nodate">Marcar como feito, sen data</button>' : '') +
      (isWant(it.key) ? '<div class="field"><label>Data prevista <small>· opcional</small></label><input type="date" id="wDate" value="' + esc((S.want[it.key] || {}).d || '') + '"></div>' : '') +
      (d ? '<div class="field"><label>' + (A.length === 1 ? '1 ascensión' : A.length + ' ascensións') + ' <small>· data baleira = sen data</small></label><div class="asc-list">' +
          A.map(function (x, i) {
            var lv = x.vid && visitOf(x.vid), lr = !lv && x.vid && routeOf(x.vid);
            return '<div class="asc-w"><div class="asc"><span class="asc-n">' + (i + 1) + '</span><input type="date" data-ai="' + i + '" value="' + esc(x.d || '') + '"' + (lv ? ' disabled title="A data vén da saída"' : lr ? ' disabled title="A data vén da ruta"' : '') + '>' +
              '<span class="asc-sp"></span><button class="asc-del" data-act="adel" data-ai="' + i + '" aria-label="Borrar a ascensión">×</button></div>' +
              (lv ? '<button class="asc-via" data-act="gotovs" data-pid="' + esc(lv.p.id) + '">↳ ' + esc([lv.v.v, lv.p.n].filter(function (z, j, ar) { return z && ar.indexOf(z) === j; }).join(' · ')) + (lv.v.gr ? ' · ' + esc(lv.v.gr) : '') + ' <small>Ver a saída ›</small></button>' : '') +
              (lr ? '<button class="asc-via" data-act="gotort" data-rid="' + S.routes.indexOf(lr) + '">↳ ' + esc(lr.n) + (lr.t ? ' · ' + esc(lr.t) : '') + ' <small>Ver a ruta ›</small></button>' : '') +
              '<div class="asc-note" data-ni="' + i + '">' + ascNoteView(x.c, i) + '</div></div>';
          }).join('') + '</div><button class="btn asc-add" data-act="aadd">+ Engadir unha ascensión</button></div>' +
        '<div class="field"><label>Notas</label><textarea id="dNote" placeholder="Notas sobre o cume">' + esc(rec.nt || '') + '</textarea></div>' : '') +
      '<div class="btns">' + links + '</div>';
    openSheet(h); phHydrate();
    var sh = $('#sheet');
    sh.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'back') { var bk = SHEET_BACK; SHEET_BACK = null; if (bk) bk(); return; }
      if (b.dataset.act === 'st-fet' && !d) { setDone(it.key, true); openItem(it); toast('✓ Marcado como feito'); }
      if (b.dataset.act === 'st-pend') {
        if (d) { if (!confirm('Desmarcar como feito? Borraranse as ascensións deste cume.')) return; setDone(it.key, false); }
        setWant(it.key, false); refreshAll(); openItem(it);
      }
      if (b.dataset.act === 'st-vull') {
        if (d) { if (!confirm('Este cume está marcado como feito. Pasalo a «Quero facer» borra as súas ascensións. Continuar?')) return; setDone(it.key, false); }
        setWant(it.key, true); refreshAll(); openItem(it); toast('★ Quero facer');
      }
      if (b.dataset.act === 'nodate') { setDone(it.key, true, ''); openItem(it); toast('Marcado como feito, sen data'); }
      if (b.dataset.act === 'aadd') { var r0 = S.done[it.key]; r0.a = ascList(r0).slice(); r0.a.push({ d: today(), s: 'm' }); sortAsc(r0.a); syncFirst(r0); save(); refreshAll(); openItem(it); toast('Ascensión engadida (hoxe): cambia a data se fai falta'); }
      if (/^(anote|asave|acancel|adelnote)$/.test(b.dataset.act)) {
        var ni = +b.dataset.ai, box = $('#sheet .asc-note[data-ni="' + ni + '"]'), rr = S.done[it.key], cur = ascList(rr)[ni] || {};
        if (b.dataset.act === 'anote') {
          box.innerHTML = '<textarea rows="3" placeholder="Con quen foches, como foi, que lembrar…">' + esc(cur.c || '') + '</textarea>' +
            '<div class="an-btns"><button class="btn ok" data-act="asave" data-ai="' + ni + '">Gardar nota</button><button class="btn" data-act="acancel" data-ai="' + ni + '">Cancelar</button>' +
            (cur.c ? '<button class="btn an-x" data-act="adelnote" data-ai="' + ni + '">Borrar nota</button>' : '') + '</div>';
          box.querySelector('textarea').focus(); return;
        }
        if (b.dataset.act !== 'acancel') {
          var v = b.dataset.act === 'asave' ? box.querySelector('textarea').value.trim() : '';
          rr.a = ascList(rr).map(function (x) { return Object.assign({}, x); });
          if (v) rr.a[ni].c = v; else delete rr.a[ni].c;
          save(); cur = rr.a[ni];
          toast(v ? '✓ Nota gardada' : 'Nota borrada');
        }
        box.innerHTML = ascNoteView(cur.c, ni); return;
      }
      if (b.dataset.act === 'adel') {
        var r1 = S.done[it.key], a1 = ascList(r1).slice();
        if (a1.length === 1) { if (confirm('É a única ascensión. Desmarcar o cume como feito?')) { setDone(it.key, false); openItem(it); } return; }
        dropFromVisits(it.key, a1.splice(+b.dataset.ai, 1)); r1.a = a1; syncFirst(r1); save(); refreshAll(); openItem(it); toast('Ascensión borrada');
      }
      if (b.dataset.act === 'gotort') { var gr = S.routes[+b.dataset.rid]; if (gr) openRoute(gr); return; }
      if (b.dataset.act === 'gotovs') { var gp = S.points.filter(function (x) { return x.id === b.dataset.pid; })[0]; if (gp) openPoint(gp); }
      if (b.dataset.act === 'showmap') { closeSheet(); retSet(); showView('mapa'); setTimeout(function () { map.setView([+b.dataset.la, +b.dataset.lo], 14); }, 60); }
    };
    var wd = $('#wDate'); if (wd) wd.onchange = function () { setWant(it.key, true, wd.value); refreshAll(); };
    var dn = $('#dNote');
    $$('#sheet input[data-ai]').forEach(function (inp) {
      inp.onchange = function () { var r = S.done[it.key]; r.a = ascList(r).map(function (x) { return Object.assign({}, x); }); r.a[+inp.dataset.ai].d = inp.value; sortAsc(r.a); syncFirst(r); save(); refreshAll(); openItem(it); };
    });
    if (dn) dn.onchange = function () { S.done[it.key].nt = dn.value; save(); };
  }

  // ---------- PUNTS ----------
  var P = { q: '', g: '' };
  var GROUPS_DEFAULT = ['Cims', 'Escalades', 'Ferrades', 'Alpinisme', 'Projectes', 'Internacionals', 'Astúries', 'Galícia', 'Altres'];
  var GCOL = { Cims: '#4E9F6D', Escalades: '#D9822B', Ferrades: '#C0647A', Alpinisme: '#2E7CC0', Projectes: '#C9A227', Internacionals: '#7B66C9', Astúries: '#6E8B3D', Galícia: '#6E8B3D' };
  // grups: els de sempre (menys els esborrats) + els creats per tu (S.gadd) + els que fan servir punts o rutes
  function groups() {
    var g = {}, del = S.gdel || [];
    GROUPS_DEFAULT.forEach(function (x) { if (del.indexOf(x) < 0 || x === 'Altres') g[x] = 1; });
    (S.gadd || []).forEach(function (x) { g[x] = 1; });
    S.points.forEach(function (p) { if (p.g) g[p.g] = 1; });
    S.routes.forEach(function (r) { if (r.g && r.g !== 'Rutes') g[r.g] = 1; });
    var k = Object.keys(g), a = k.indexOf('Altres'); if (a >= 0) { k.splice(a, 1); k.push('Altres'); }
    return k;
  }
  function groupAdd(n) {
    n = String(n || '').trim().replace(/\s+/g, ' ');
    if (!n || n === 'Rutes') return '';
    var ex = groups().filter(function (g) { return norm(g) === norm(n); })[0]; if (ex) return ex;
    S.gadd = (S.gadd || []).concat([n]); S.gdel = (S.gdel || []).filter(function (x) { return x !== n; });
    save(); return n;
  }
  function groupDel(g) {
    if (g === 'Altres') return;
    S.points.forEach(function (p) { if (p.g === g) p.g = 'Altres'; });
    S.routes.forEach(function (r) { if (r.g === g) delete r.g; });
    S.gadd = (S.gadd || []).filter(function (x) { return x !== g; });
    if (GROUPS_DEFAULT.indexOf(g) >= 0 && (S.gdel || []).indexOf(g) < 0) S.gdel = (S.gdel || []).concat([g]);
    save(); refreshAll(); renderPoints();
  }
  function groupsSheet() {
    var cnt = function (g) { return S.points.filter(function (p) { return (p.g || 'Altres') === g; }).length + S.routes.filter(function (r) { return r.g === g; }).length; };
    openSheet('<h3>Grupos</h3><div class="sub">Os grupos de «Os meus puntos». Ao borrar un, os seus puntos pasan a «Altres» e as rutas a «Rutes».</div>' +
      '<div class="cat-l">' + groups().map(function (g) {
        return '<div class="cat-b grp-r">' + pgIcon(g) + '<span>' + esc(g) + ' <small>' + cnt(g) + '</small></span>' + (g === 'Altres' ? '' : '<button class="btn warn grp-x" data-gdel="' + esc(g) + '">Borrar</button>') + '</div>';
      }).join('') + '</div>' +
      '<div class="field"><label>Novo grupo</label><div class="two"><input id="gNew" maxlength="40" placeholder="Nome do grupo"><button class="btn pri" data-gadd="1">Engadir</button></div></div>');
    $('#sheet').onclick = function (e) {
      var d = e.target.closest('[data-gdel]');
      if (d) { var g = d.dataset.gdel, n = cnt(g); if (!confirm('Borrar o grupo «' + g + '»?' + (n ? ' Os seus ' + n + ' elementos pasarán a «Altres» / «Rutes».' : ''))) return; groupDel(g); groupsSheet(); toast('Grupo borrado'); return; }
      if (e.target.closest('[data-gadd]')) { var nm = groupAdd($('#gNew').value); if (!nm) { toast('Pon un nome'); return; } refreshAll(); renderPoints(); groupsSheet(); toast('Grupo «' + nm + '» creado'); }
    };
  }
  // Un punt és «oficial» si és un cim d'alguna llista activa: no surt a la llista de punts (ja surt a la seva llista)
  function officialPoint(p) {
    if (p.cl || climbGroup(p)) return false; // escalades, alpinisme i ferrades sempre es veuen a Punts
    if (lsOn('feec') && p.f && fById[p.f]) return true;
    if ((lsOn('uiaa') || lsOn('cat')) && p.u && uById[p.u]) return true;
    if (lsOn('alps') && p.a && aById[p.a]) return true;
    var nm = norm(p.n);
    if (lsOn('sos') && SOS.some(function (x) { return norm(x.n) === nm; })) return true;
    if (p.la == null) return false;
    var near = function (la, lo) { return la != null && Math.abs(la - p.la) < 0.002 && Math.abs(lo - p.lo) < 0.003 && dist(la, lo, p.la, p.lo) < 0.15; };
    if (lsOn('feec') && F.some(function (f) { return near(f.la, f.lo); })) return true;
    if ((lsOn('uiaa') || lsOn('cat')) && U.some(function (u) { return near(u.la, u.lo); })) return true;
    if (lsOn('alps') && AL.some(function (a) { return near(a.la, a.lo); })) return true;
    return false;
  }
  // Punts: seccions plegables per tipus (Cims, Alpinisme, Escalades, Ferrades…) i les rutes per anys
  var PG_ORDER = ['Cims', 'Alpinisme', 'Escalades', 'Ferrades', 'Projectes', 'Internacionals', 'Astúries', 'Galícia'];
  var PG_ICON = {
    Cims: '<path d="M2.5 19.5L9 8.5l3.6 6 2.4-3.5 6.5 8.5z"/>',
    Alpinisme: '<path d="M6 21L15.2 5.4"/><path d="M9.6 5.6c3.3-1.3 6.9-1 10.2.9"/><path d="M15.4 5.6l1.9 3.6"/>',
    Escalades: '<g transform="rotate(40 12 12)"><path d="M7.4 7.6V6.3c0-2.7 1.8-4.5 4.2-4.5 2.1 0 3.7 1.4 4.3 3.6l3 11.4c1 3.6-1 5.9-4.4 5.9h-2.2c-2.4 0-4.1-1.4-4.5-3.6"/><path d="M7.5 9.6l.2 3.2"/><rect x="6.2" y="12.6" width="3.2" height="5.6" rx="1"/><path d="M6.4 14.4h2.8M6.4 16.3h2.8"/></g>',
    Ferrades: '<path d="M3 16C3 10.2 6.8 5.8 12 5.8c4.7 0 8.1 3 9.3 7.6-2.9.2-4.6 1.9-6.6 2.6-2.8 1-6.1.4-11.7 0z"/><path d="M8 8.6v1.6M11.2 8v1.8M14.4 8.6v1.6"/><path d="M7.5 16.5c1.3 2.4 3.4 3.5 6 3.5M15.4 15.6c0 2-.6 3.4-1.9 4.4l1.4 2.4"/>',
    Projectes: '<path d="M5.5 21V3.8"/><path d="M5.5 4.2h11.5l-2.3 4.4 2.3 4.4H5.5"/>',
    Internacionals: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.3 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.3-3.8-8.5s1.2-6.1 3.8-8.5z"/>',
    Pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    Rutes: '<circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><path d="M7.5 18.5h6a3 3 0 0 0 0-6h-3a3 3 0 0 1 0-6h6"/>'
  };
  var PG_COL = { Cims: '#5E7F6B', Alpinisme: '#4F6D8A', Escalades: '#A86B45', Ferrades: '#8A5A6E', Projectes: '#9C823C', Internacionals: '#5D5C8A', Astúries: '#2E7D80', Galícia: '#3D5FA8', Rutes: '#A8653A' };
  function pgCol(g) { return PG_COL[g] || '#6E7672'; }
  function pgIcon(g) { var ic = PG_ICON[g] || (g === 'Astúries' || g === 'Galícia' ? PG_ICON.Pin : PG_ICON.Cims); return '<span class="pg-ic" style="color:' + pgCol(g) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ic + '</svg></span>'; }
  function pgOpen() { try { return JSON.parse(localStorage.getItem('cimsPuntsOpen')) || {}; } catch (e) { return {}; } }
  function pgSetOpen(o) { try { localStorage.setItem('cimsPuntsOpen', JSON.stringify(o)); } catch (e) { } }
  function pRow(p, col) {
    var sel = SEL && SEL['p:' + p.id];
    return '<li class="row' + (sel ? ' rsel' : '') + '" data-pid="' + esc(p.id) + '"><div class="chk" style="border-color:' + col + ';color:' + col + '">' + (SEL ? (sel ? '✓' : '') : '') + '</div>' +
      '<div class="body"><div class="nm">' + esc(p.n) + '</div><div class="meta">' + [p.d ? fmtDate(p.d) : '', p.la == null ? 'sen coordenadas' : '', p.nt ? esc(p.nt) : ''].filter(Boolean).join(' · ') + '</div></div>' +
      '<div class="alt">' + fmtAlt(p.h) + (p.ds && p.ds.length > 1 ? '<span class="xn">×' + p.ds.length + '</span>' : '') + '</div></li>';
  }
  function rRow(r, i, col, tag) {
    var sel = SEL && SEL['r:' + i];
    return '<li class="row rrow' + (sel ? ' rsel' : '') + '" data-rid="' + i + '"><div class="chk" style="border-color:' + col + ';color:' + col + '">' + (SEL ? (sel ? '✓' : '') : '') + '</div><div class="body"><div class="nm">' + esc(r.n) + '</div>' +
      '<div class="meta">' + [tag ? 'ruta' : '', r.d ? fmtDate(r.d) : (r.y || ''), r.km ? r.km + ' km' : '', r.up ? '+' + r.up + ' m' : ''].filter(Boolean).join(' · ') + '</div></div></li>';
  }
  function zoneName(z) { return String(z || '').replace(/\s*\(\?\)\s*$/, '').trim(); }
  function allZones() { var o = {}; S.points.forEach(function (p) { var z = zoneName(p.z); if (z) o[z] = 1; }); return Object.keys(o).sort(); }
  function renderPoints() {
    var vis = S.points.filter(function (p) { return !officialPoint(p); }), hidden = S.points.length - vis.length;
    var q = norm(P.q), O = pgOpen(), by = {}, rby = {};
    vis.forEach(function (p) { if (q && norm(p.n + ' ' + (p.nt || '') + ' ' + (p.g || '') + ' ' + (p.z || '') + ' ' + (p.vs || []).map(function (v) { return (v.v || '') + ' ' + (v.c || ''); }).join(' ')).indexOf(q) < 0) return; (by[p.g || 'Altres'] = by[p.g || 'Altres'] || []).push(p); });
    var routes = [];
    S.routes.forEach(function (r, i) {
      if (q && norm(r.n + ' ' + (r.g || '')).indexOf(q) < 0) return;
      var x = { r: r, i: i };
      if (r.g && r.g !== 'Rutes') { (rby[r.g] = rby[r.g] || []).push(x); by[r.g] = by[r.g] || []; } else routes.push(x);
    });
    var byDate = function (x, y) { var a = x.r.d || (x.r.y ? x.r.y + '-00' : ''), b = y.r.d || (y.r.y ? y.r.y + '-00' : ''); return a < b ? 1 : a > b ? -1 : 0; };
    routes.sort(byDate);
    var gs = Object.keys(by).sort(function (x, y) { var a = PG_ORDER.indexOf(x), b = PG_ORDER.indexOf(y); return (a < 0 ? 99 : a) - (b < 0 ? 99 : b) || (x < y ? -1 : 1); });
    var nP = gs.reduce(function (t, g) { return t + by[g].length + (rby[g] || []).length; }, 0);
    $('#pfilters').innerHTML = '';
    $('#pCount').innerHTML = (q ? nP + ' puntos e ' + routes.length + ' rutas atopadas' : vis.length + ' puntos · ' + S.routes.length + ' rutas') +
      (q ? '' : ' <button class="pg-all" data-pall="' + (gs.concat(['Rutes']).every(function (g) { return O[g]; }) ? '0">Pregar todo' : '1">Despregar todo') + '</button><button class="pg-all" data-pgrp="1">Grupos</button>') +
      (hidden && !q ? '<br><small>' + hidden + ' puntos que xa son cumes das túas listas non aparecen aquí.</small>' : '');
    function sec(g, n, sub, rowsFn) {
      var open = q ? true : !!O[g];
      return '<li class="pg' + (open ? ' open' : '') + '"><button class="pg-h" data-pg="' + esc(g) + '">' + pgIcon(g) + '<span class="pg-n">' + esc(g) + '</span><span class="pg-c">' + n + '</span>' + (sub ? '<span class="pg-s">' + sub + '</span>' : '') + '<span class="chev">▾</span></button>' +
        (open ? '<ul class="pg-b">' + rowsFn() + '</ul>' : '') + '</li>';
    }
    var h = gs.map(function (g) {
      var arr = by[g].slice().sort(function (a, b) { return norm(a.n) < norm(b.n) ? -1 : 1; }), rr = (rby[g] || []).sort(byDate), col = pgCol(g);
      return sec(g, arr.length + rr.length, '', function () {
        if (g === 'Escalades' && arr.some(function (p) { return p.z; })) {
          var zz = {}; arr.forEach(function (p) { var z = zoneName(p.z) || 'Sense zona'; (zz[z] = zz[z] || []).push(p); });
          return Object.keys(zz).sort(function (a, b) { return (a === 'Sense zona') - (b === 'Sense zona') || zz[b].length - zz[a].length || (a < b ? -1 : 1); }).map(function (z) {
            var zo = q || O['z:' + z]; // zones d'escalada plegables (plegades per defecte)
            return '<li class="pz-h' + (zo ? ' open' : '') + '" data-pg="z:' + esc(z) + '"><span>' + esc(z) + ' <small>' + zz[z].length + '</small></span><span class="chev">▾</span></li>' + (zo ? zz[z].map(function (p) { return pRow(p, col); }).join('') : '');
          }).join('') + (rr.length ? rr.map(function (x) { return rRow(x.r, x.i, col, false); }).join('') : '');
        }
        return arr.map(function (p) { return pRow(p, col); }).join('') + (rr.length ? rr.map(function (x) { return rRow(x.r, x.i, col, false); }).join('') : '');
      });
    }).join('');
    if (routes.length) h += sec('Rutes', routes.length, Math.round(routes.reduce(function (t, x) { return t + (+x.r.km || 0); }, 0)) + ' km', function () {
      var o = '';
      routes.forEach(function (x) {
        o += rRow(x.r, x.i, pgCol('Rutes'), false);
      });
      return o;
    });
    $('#plist').innerHTML = h || '<div class="empty">' + (q ? 'Nada con «' + esc(P.q) + '»' : 'Ningún punto') + '</div>';
    var rh = $('#rHead'); if (rh) rh.style.display = 'none';
    $('#rlist').innerHTML = '';
    selBar();
  }
  // ---- selecció múltiple a Punts (punts i rutes): mantenir premut un element per començar
  var SEL = null;
  function selBar() {
    var bar = $('#rSelBar'), n = SEL ? Object.keys(SEL).length : 0;
    document.body.classList.toggle('rsel-on', !!SEL);
    if (!SEL || view !== 'punts') { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'rSelBar'; document.body.appendChild(bar); }
    bar.innerHTML = '<button class="btn sb-x" data-rs="cancel" aria-label="Saír">✕</button><span><b>' + n + '</b> sel.</span><button class="btn" data-rs="all">Todos</button><button class="btn" data-rs="move"' + (n ? '' : ' disabled') + '>Mover</button><button class="btn warn" data-rs="del"' + (n ? '' : ' disabled') + '>Borrar</button>';
  }
  // canviar de categoria: punts (p.g) i rutes (r.g; «Rutes» = sense categoria)
  function catSheet(title, cur, withRutes, cb) {
    var gs = groups().filter(function (g) { return g !== 'Altres' || cur === 'Altres'; });
    if (withRutes) gs = gs.concat(['Rutes']);
    openSheet('<h3>' + esc(title) + '</h3><div class="sub">Escolle a categoría</div><div class="cat-l">' + gs.map(function (g) {
      return '<button class="cat-b' + (g === cur ? ' on' : '') + '" data-cat="' + esc(g) + '">' + pgIcon(g) + '<span>' + esc(g) + '</span>' + (g === cur ? '<b>✓</b>' : '') + '</button>';
    }).join('') + '</div><div class="field"><label>Ou crea un grupo novo</label><div class="two"><input id="catNew" maxlength="40" placeholder="Nome do grupo"><button class="btn pri" data-catnew="1">Crear e mover</button></div></div>');
    $('#sheet').onclick = function (e) {
      if (e.target.closest('[data-catnew]')) { var nm = groupAdd($('#catNew').value); if (!nm) { toast('Pon un nome'); return; } cb(nm); return; }
      var b = e.target.closest('[data-cat]'); if (b) cb(b.dataset.cat);
    };
  }
  function selKey(li) { return li.dataset.pid != null ? 'p:' + li.dataset.pid : 'r:' + li.dataset.rid; }
  function selToggle(li) {
    var k = selKey(li), on = !SEL[k];
    if (on) SEL[k] = 1; else delete SEL[k];
    li.classList.toggle('rsel', on);
    li.querySelector('.chk').textContent = on ? '✓' : '';
    selBar();
  }
  function selStart(li) {
    SEL = {};
    $$('#plist .row .chk, #rlist .row .chk').forEach(function (c) { c.textContent = ''; });
    selToggle(li);
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) { }
  }
  function selEnd() { SEL = null; $$('#v-punts .row.rsel').forEach(function (li) { li.classList.remove('rsel'); }); renderPoints(); }
  function delRoutes(list) {
    list.forEach(function (r) { (r.cm || []).forEach(function (k) { unlinkAsc(k, r.id); }); });
    S.routes = S.routes.filter(function (r) { return list.indexOf(r) < 0; });
    save(); refreshAll(); renderPoints();
  }
  function renameInline(o, re) {
    var h = $('#sheet h3'); if (!h) return;
    var w = document.createElement('div'); w.className = 'ren-w';
    w.innerHTML = '<input class="ren-i" maxlength="120" value="' + esc(o.n) + '"><button class="btn pri">Garda</button><button class="btn lnk">Cancela</button>';
    h.replaceWith(w);
    var i = w.querySelector('input'), bs = w.querySelectorAll('button');
    function ok() { var v = i.value.trim(); if (!v) { toast('O nome non pode estar baleiro'); return; } o.n = v; save(); refreshAll(); renderPoints(); if (map) drawMap(); re(o); toast('Nome cambiado'); }
    bs[0].onclick = ok; bs[1].onclick = function () { re(o); };
    i.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
    i.focus(); i.select();
  }
  function openRoute(r) {
    openSheet('<h3>' + esc(r.n) + '</h3><button class="cat-cur" data-act="cat">' + pgIcon(r.g || 'Rutes') + '<span>' + esc(r.g || 'Rutes') + '</span><small>Cambiar</small></button><div class="kv"><b>Data</b><span>' + (r.d ? fmtDate(r.d) : r.y || '—') + '</span><b>Distancia</b><span>' + (r.km ? r.km + ' km' : '—') + '</span><b>Desnivel</b><span>' + (r.up ? '+' + r.up + ' m' : '—') + '</span>' +
      (r.t ? '<b>Actividade</b><span>' + esc(r.t) + '</span>' : '') +
      (r.cm && r.cm.length ? '<b>Cumes</b><span>' + r.cm.map(function (k) { return '<button class="lnk-in" data-act="rcim" data-k="' + esc(k) + '">' + esc(nameOfKey(k)) + '</button>'; }).join(', ') + '</span>' : '') + '</div>' +
      '<div class="btns"><button class="btn ok" data-act="redit">Actividade e cumes</button>' + (r.c && r.c.length > 1 ? '<button class="btn pri" data-act="map">Ver no mapa</button>' : '') + '<button class="btn lnk" data-act="ren">Cambiar o nome</button><button class="btn warn" data-act="del">Borrar a ruta</button></div>');
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'ren') { renameInline(r, openRoute); return; }
      if (b.dataset.act === 'redit') { routeForm(r); return; }
      if (b.dataset.act === 'rcim') { var k = b.dataset.k; if (k.slice(0, 2) === 'p:') { var pp = S.points.filter(function (x) { return x.id === k.slice(2); })[0]; if (pp) openPoint(pp); } else { var it = itemByKey(k); if (it) openItem(it); } return; }
      if (b.dataset.act === 'map') { closeSheet(); retSet(); showView('mapa'); setTimeout(function () { map.fitBounds(r.c, { padding: [30, 30] }); }, 80); }
      if (b.dataset.act === 'cat') { catSheet(r.n, r.g || 'Rutes', true, function (g) { if (g === 'Rutes') delete r.g; else r.g = g; save(); refreshAll(); renderPoints(); openRoute(r); toast('Movido a ' + g); }); return; }
      if (b.dataset.act === 'del' && confirm('Queres borrar a ruta «' + r.n + '»?')) { delRoutes([r]); closeSheet(); toast('Ruta borrada'); }
    };
  }
  // ---- rutes (tracks): activitat i cims, com les sortides d'alpinisme
  var ROUTE_T = ['', 'Senderisme', 'Alpinisme', 'Escalada', 'Ferrata', 'Raquetes', 'Altres'];
  function routeOf(id) { if (!id) return null; for (var i = 0; i < S.routes.length; i++) if (S.routes[i].id === id) return S.routes[i]; return null; }
  function linkRoute(r, oldCm) {
    var nw = r.cm || [], pv = { id: 'r:' + r.id }, vv = { id: r.id, d: r.d || '' };
    (oldCm || []).forEach(function (k) { if (nw.indexOf(k) < 0) unlinkAsc(k, r.id); });
    nw.forEach(function (k) { linkAsc(k, pv, vv); });
  }
  function routeForm(r) {
    var cm = (r.cm || []).slice(), iso = /^\d{4}-\d\d-\d\d$/.test(r.d || '');
    openSheet('<h3>' + esc(r.n) + '</h3><div class="sub">' + (r.d ? fmtDate(r.d) : r.y || 'Sen data') + (r.km ? ' · ' + r.km + ' km' : '') + '</div>' +
      '<div class="field"><label>Actividade</label><select id="rT">' + ROUTE_T.concat(r.t && ROUTE_T.indexOf(r.t) < 0 ? [r.t] : []).map(function (o) { return '<option value="' + esc(o) + '"' + (o === (r.t || '') ? ' selected' : '') + '>' + (o ? esc(o) : '—') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Cumes da ruta <small>· contan como ascensión' + (iso ? ' do ' + fmtDate(r.d) : '') + '</small></label><div id="rCm"></div><input id="rCs" type="search" placeholder="Engadir un cume: escribe o seu nome…"><div id="rCr" class="vcr"></div></div>' +
      (iso ? '' : '<div class="sub">Esta ruta non ten data exacta: a ascensión gardarase sen data.</div>') +
      '<div class="btns"><button class="btn pri" data-a="save">Gardar</button><button class="btn" data-a="cancel">Cancelar</button></div>');
    function render() {
      var sg = iso ? cimsDoneOn(r.d).filter(function (k) { return cm.every(function (c) { return twinKeys(c).indexOf(k) < 0; }); }) : [];
      $('#rCm').innerHTML = (cm.length ? '<div class="vchips">' + cm.map(function (k) { return '<span class="vchip">' + esc(nameOfKey(k)) + '<button type="button" data-a="cmx" data-k="' + esc(k) + '" aria-label="Quitar">×</button></span>'; }).join('') + '</div>' : '') +
        (sg.length ? '<div class="vsug">Feitos este día: ' + sg.map(function (k) { return '<button type="button" class="vchip add" data-a="cmadd" data-k="' + esc(k) + '">＋ ' + esc(nameOfKey(k)) + '</button>'; }).join('') + '</div>' : '');
    }
    render();
    $('#rCs').oninput = function () {
      var L = cimSearch(this.value, 8).filter(function (x) { return cm.every(function (c) { return twinKeys(c).indexOf(x.k) < 0; }); });
      $('#rCr').innerHTML = L.map(function (x) { return '<button type="button" data-a="cmadd" data-k="' + esc(x.k) + '"><span>' + esc(x.n) + '</span><small>' + esc(x.lab) + (x.h ? ' · ' + fmtAlt(x.h) : '') + '</small></button>'; }).join('');
    };
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'cmadd') { if (cm.indexOf(b.dataset.k) < 0) cm.push(b.dataset.k); $('#rCs').value = ''; $('#rCr').innerHTML = ''; render(); return; }
      if (a === 'cmx') { cm = cm.filter(function (k) { return k !== b.dataset.k; }); render(); return; }
      if (a === 'cancel') { openRoute(r); return; }
      if (a === 'save') {
        var old = (r.cm || []).slice(), t = $('#rT').value;
        if (t) r.t = t; else delete r.t;
        if (cm.length) { r.cm = cm.slice(); r.id = r.id || uid(); } else delete r.cm;
        if (r.id) linkRoute(r, old);
        save(); refreshAll(); checkMedals(false); openRoute(r); toast('Ruta gardada');
      }
    };
  }
  // Sortides d'un punt d'escalada/alpinisme/ferrada (p.vs): data, via, grau, tipus, companys, notes i fites
  var VS_TIPUS = ['Via llarga', 'Esportiva / escola', 'Cresta', 'Alpinisme', 'Ferrata', 'Bloc', 'Altres'];
  var VS_ETIQ = ['', 'Fita', 'Progressió', 'Lliçó', 'Retirada'];
  function climbGroup(p) { return ['Escalades', 'Alpinisme', 'Ferrades'].indexOf(p.g) >= 0; }
  // on és una sortida: el punt; si no té coordenades, el primer cim de la sortida que en tingui
  function visitLL(p, v) {
    if (p.la != null && p.la !== '') return { la: +p.la, lo: +p.lo };
    var c = ((v && v.cm) || []).concat(p.ck || []).map(function (k) { return cimLL(k); }).filter(Boolean)[0];
    return c ? { la: c.la, lo: c.lo } : null;
  }
  function vsHtml(p) {
    var V = p.vs || [], inc = ptIncl(p).sort(function (x, y) { return (y.v.d || '') < (x.v.d || '') ? -1 : 1; });
    var incH = inc.length && climbGroup(p) ? '<div class="vs"><div class="vs-top"><h4>Incluído en saídas · ' + inc.length + '</h4></div>' + inc.map(function (x) { return '<div class="vs-i"><div class="vs-h"><span>' + (x.v.d ? fmtDate(x.v.d) : '') + '</span><span class="vs-t">' + esc(x.v.v || x.p.n) + '</span></div><div class="vs-m">' + esc(x.p.n) + (x.v.c ? ' · ' + esc(x.v.c) : '') + '</div></div>'; }).join('') + '</div>' : '';
    if (!V.length && !climbGroup(p)) return incH;
    var L = V.map(function (v, i) { return [v, i]; }).sort(function (a, b) { var x = a[0].d || '', y = b[0].d || ''; return x < y ? 1 : x > y ? -1 : 0; });
    return '<div class="vs"><div class="vs-top"><h4>Saídas' + (V.length ? ' · ' + V.length : '') + '</h4><button class="btn ok vs-add" data-act="vsadd">＋ Engadir saída</button></div>' + L.map(function (x) {
      var v = x[0];
      var t1 = [v.s ? esc(v.s) : '', v.v ? esc(v.v) : '', v.gr ? '<b>' + esc(v.gr) + '</b>' : ''].filter(Boolean).join(' · ') || '—';
      var t2 = [v.t ? esc(v.t) : '', v.c ? esc(v.c) : ''].filter(Boolean).join(' · ');
      return '<div class="vs-i" role="button" tabindex="0" data-act="vsed" data-vi="' + x[1] + '"><div class="vs-h"><span>' + (v.d ? fmtDate(v.d) : '') + '</span><span class="vs-t">' + t1 + '</span></div>' +
        (t2 ? '<div class="vs-m">' + t2 + '</div>' : '') + (v.cm && v.cm.length ? '<div class="vs-cm">⛰ ' + v.cm.map(function (k) { return esc(nameOfKey(k)); }).join(' · ') + '</div>' : '') + (v.nt ? '<div class="vs-n">' + esc(v.nt) + '</div>' : '') +
        (v.fi || []).map(function (f) { return '<div class="vs-f">★ ' + esc(f) + '</div>'; }).join('') +
        '</div>';
    }).join('') + (V.length ? '' : '<div class="empty">Aínda non hai ningunha saída.</div>') + '</div>' + incH;
  }
  // dates del punt = les de les sortides (+ les que ja tenia abans de tenir-ne cap)
  function vsDates(p, removed) {
    var all = ptOwn(p);
    if (removed && !(p.vs || []).some(function (v) { return v.d === removed; })) all = all.filter(function (d) { return d !== removed; });
    (p.vs || []).forEach(function (v) { if (/^\d{4}-\d\d-\d\d$/.test(v.d || '') && all.indexOf(v.d) < 0) all.push(v.d); });
    all.sort(); p.d = all[0] || ''; if (all.length > 1) p.ds = all; else delete p.ds;
  }
  function cimSearch(qs, lim, exId) {
    var q = norm(qs || ''), out = [], seen = {};
    if (q.length < 2) return out;
    var add = function (k, n, h, lab) { var t = twinKeys(k)[0]; if (seen[t] || out.length >= lim) return; seen[t] = 1; out.push({ k: k, n: n, h: h, lab: lab }); };
    if (lsOn('feec')) F.forEach(function (f) { if (norm(f.n).indexOf(q) >= 0) add('f:' + f.id, f.n, f.h, '100 Cims'); });
    if (lsOn('uiaa') || lsOn('cat')) U.forEach(function (u) { if (norm(u.n).indexOf(q) >= 0) add('u:' + u.id, u.n, u.h, '3000'); });
    if (lsOn('alps')) AL.forEach(function (a) { if (norm(a.n).indexOf(q) >= 0) add('a:' + a.id, a.n, a.h, '4000'); });
    if (lsOn('sos')) SOS.forEach(function (x) { if (norm(x.n).indexOf(q) >= 0) add(sosKey(x), x.n, x.h, 'Sostre'); });
    S.points.forEach(function (x) { if (x.id !== exId && !officialPoint(x) && !climbGroup(x) && norm(x.n).indexOf(q) >= 0 && !(x.g !== 'Cims' && S.points.some(function (y) { return y.g === 'Cims' && y.id !== exId && norm(y.n) === norm(x.n); }))) add('p:' + x.id, x.n, x.h, 'Punto propio · ' + (x.g || 'Altres')); });
    return out;
  }
  // cims fets una data (per suggerir-los a la sortida d'aquell dia)
  function cimsDoneOn(d, exId) {
    var out = [], seen = {};
    if (!d) return out;
    if (exId) S.points.forEach(function (x) { if (x.id !== exId && !officialPoint(x) && !climbGroup(x) && ptOwn(x).indexOf(d) >= 0) out.push('p:' + x.id); });
    Object.keys(S.done).forEach(function (k) {
      var tk = twinKeys(k), c = tk[0]; if (seen[c] || !tk.some(listOnFor)) return;
      if (ascList(S.done[k]).some(function (x) { return x.d === d && !x.vid; })) { seen[c] = 1; out.push(k); }
    });
    return out;
  }
  function splitPeople(c) { return String(c || '').split(/\s*,\s*|\s+i\s+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function vsForm(p, idx) {
    var isNew = idx == null, v = isNew ? { d: today(), t: (p.vs && p.vs.length ? p.vs[p.vs.length - 1].t : (p.g === 'Ferrades' ? 'Ferrata' : p.g === 'Alpinisme' ? 'Alpinisme' : 'Via llarga')) } : p.vs[idx];
    var iso = !v.d || /^\d{4}-\d\d-\d\d$/.test(v.d);
    var ppl = {}, vias = {};
    S.points.forEach(function (q) { (q.vs || []).forEach(function (x) { splitPeople(x.c).forEach(function (n) { ppl[n] = (ppl[n] || 0) + 1; }); if (q === p && x.v) vias[x.v] = 1; }); });
    var opt = function (L, cur) { if (cur && L.indexOf(cur) < 0) L = L.concat([cur]); return L.map(function (o) { return '<option value="' + esc(o) + '"' + (o === (cur || '') ? ' selected' : '') + '>' + (o ? esc(o) : '—') + '</option>'; }).join(''); };
    var h = '<h3>' + (isNew ? 'Nova saída' : 'Editar saída') + '</h3><div class="sub">' + esc(p.n) + '</div>' +
      '<div class="field"><label>Data</label><input id="vD" type="' + (iso ? 'date' : 'text') + '" value="' + esc(v.d || '') + '"></div>' +
      '<div class="field"><label>Vía ou actividade</label><input id="vV" value="' + esc(v.v || '') + '" placeholder="Nome da vía"></div>' +
      '<div class="two"><div class="field"><label>Grao</label><input id="vG" value="' + esc(v.gr || '') + '" placeholder="V+, 6a…"></div>' +
      '<div class="field"><label>Tipo</label><select id="vT">' + opt(VS_TIPUS.slice(), v.t) + '</select></div></div>' +
      '<div class="field"><label>Compañeiros</label><input id="vC" value="' + esc(v.c || '') + '" placeholder="Separados por comas"></div>' +
      '<div class="field"><label>Cumes desta saída <small>· contan como ascensión do cume</small></label><div id="vCm"></div><input id="vCs" type="search" autocomplete="off" placeholder="Engadir un cume: escribe o seu nome…"><div id="vCr" class="vcr"></div></div>' +
      '<div class="field"><label>Notas</label><textarea id="vN" rows="4">' + esc(v.nt || '') + '</textarea></div>' +
      '<div class="btns"><button class="btn pri" data-a="save">Gardar</button><button class="btn" data-a="cancel">Cancelar</button>' + (isNew ? '' : '<button class="btn warn" data-a="del">Borrar</button>') + '</div>';
    openSheet(h);
    var cm = (v.cm || []).slice();
    if (isNew && !cm.length) cm = ((p.ck && p.ck.length) ? p.ck : ((p.vs || []).slice().reverse().filter(function (x) { return x.cm && x.cm.length; })[0] || {}).cm || []).slice();
    // ascensions d'un cim (les que no són d'una altra sortida) per triar quina és la d'aquesta sortida
    function ascOpts(k) {
      var out = [];
      if (k.slice(0, 2) === 'p:') { var q = S.points.filter(function (x) { return x.id === k.slice(2); })[0]; (q ? ptOwn(q) : []).forEach(function (d) { out.push({ d: d }); }); return out; }
      var seenD = {};
      twinKeys(k).forEach(function (kk) { if (S.done[kk]) ascList(S.done[kk]).forEach(function (x) { if (x.d && /^\d{4}-\d\d-\d\d$/.test(x.d) && (!x.vid || x.vid === v.id) && !seenD[x.d]) { seenD[x.d] = 1; out.push({ d: x.d, c: x.c }); } }); });
      return out.sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    }
    function cmRender() {
      var cur = $('#vD').value, ap = cm.map(function (k) {
        var L = ascOpts(k); if (!L.length) return '';
        return '<div class="vsug">' + esc(nameOfKey(k)) + ': ' + L.map(function (o) { return '<button type="button" class="vchip add' + (o.d === cur ? ' on' : '') + '" data-a="dpick" data-d="' + o.d + '">' + fmtDate(o.d) + (o.c ? ' · ' + esc(String(o.c).slice(0, 24)) : '') + '</button>'; }).join('') + '</div>';
      }).join('');
      var sg = cimsDoneOn($('#vD').value, p.id).filter(function (k) { return cm.every(function (c) { return twinKeys(c).indexOf(k) < 0; }); });
      $('#vCm').innerHTML = (cm.length ? '<div class="vchips">' + cm.map(function (k) { return '<span class="vchip">' + esc(nameOfKey(k)) + '<button type="button" data-a="cmx" data-k="' + esc(k) + '" aria-label="Quitar">×</button></span>'; }).join('') + '</div>' : '') + ap +
        (sg.length ? '<div class="vsug">Feitos este día: ' + sg.map(function (k) { return '<button type="button" class="vchip add" data-a="cmadd" data-k="' + esc(k) + '">＋ ' + esc(nameOfKey(k)) + '</button>'; }).join('') + '</div>' : '');
    }
    cmRender();
    $('#vD').onchange = cmRender;
    $('#vCs').oninput = function () {
      var L = cimSearch(this.value, 8, p.id).filter(function (x) { return cm.every(function (c) { return twinKeys(c).indexOf(x.k) < 0; }); });
      $('#vCr').innerHTML = L.map(function (x) { return '<button type="button" data-a="cmadd" data-k="' + esc(x.k) + '"><span>' + esc(x.n) + '</span><small>' + esc(x.lab) + (x.h ? ' · ' + fmtAlt(x.h) : '') + '</small></button>'; }).join('');
    };
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'cmadd') { if (cm.indexOf(b.dataset.k) < 0) cm.push(b.dataset.k); $('#vCs').value = ''; $('#vCr').innerHTML = ''; cmRender(); return; }
      if (a === 'dpick') { $('#vD').value = b.dataset.d; cmRender(); return; }
      if (a === 'cmx') { cm = cm.filter(function (k) { return k !== b.dataset.k; }); cmRender(); return; }
      if (a === 'cancel') { openPoint(p); return; }
      if (a === 'del') {
        if (!confirm('Queres borrar esta saída?')) return;
        (p.vs[idx].cm || []).forEach(function (k) { unlinkAsc(k, p.vs[idx].id); });
        var old = p.vs[idx].d; p.vs.splice(idx, 1); if (!p.vs.length) delete p.vs; vsDates(p, old);
        save(); refreshAll(); openPoint(p); toast('Saída borrada'); return;
      }
      if (a === 'save') {
        var r = { d: $('#vD').value.trim(), v: $('#vV').value.trim(), gr: $('#vG').value.trim(), t: $('#vT').value, c: $('#vC').value.trim(), nt: $('#vN').value.trim() };
        if (!r.d && !r.v) { toast('Pon polo menos a data ou a vía'); return; }
        var n = isNew ? {} : Object.assign({}, v), oldD = isNew ? null : v.d;
        Object.keys(r).forEach(function (k) { if (r[k]) n[k] = r[k]; else delete n[k]; });
        var oldCm = isNew ? [] : (v.cm || []);
        if (cm.length) { n.cm = cm.slice(); n.id = n.id || uid(); if (!p.ck || !p.ck.length) p.ck = cm.slice(); ckCoords(p); } else delete n.cm;
        p.vs = p.vs || [];
        if (isNew) p.vs.push(n); else p.vs[idx] = n;
        p.vs.sort(function (x, y) { return (x.d || '') < (y.d || '') ? -1 : (x.d || '') > (y.d || '') ? 1 : 0; });
        vsDates(p, oldD !== r.d ? oldD : null);
        syncVisit(p, n, oldCm);
        save(); refreshAll(); checkMedals(false); openPoint(p); toast(isNew ? 'Saída engadida' : 'Saída gardada');
      }
    };
  }
  // punts propis que no són d'escalada/alpinisme: llista d'ascensions (dates) amb «amb qui» per a cadascuna (p.ac[data])
  function ptSetDates(p, all) { all = all.filter(function (d, i, a) { return d && a.indexOf(d) === i; }).sort(); p.d = all[0] || ''; if (all.length > 1) p.ds = all; else delete p.ds; }
  function ptAscDates(p) { var a = ptOwn(p); ptIncl(p).forEach(function (x) { if (x.v.d && a.indexOf(x.v.d) < 0) a.push(x.v.d); }); return a.sort(); }
  function ptAscHtml(p) {
    if (climbGroup(p)) return '';
    var D = ptAscDates(p), own = ptOwn(p), ac = p.ac || {}, iv = {};
    ptIncl(p).forEach(function (x) { if (x.v.d) iv[x.v.d] = x; });
    // mateix aspecte que les ascensions dels cims de les llistes
    return '<div class="field pasc"><label>' + (D.length === 1 ? '1 ascensión' : D.length + ' ascensións') + ' <small>· data baleira = sen data</small></label><div class="asc-list">' + D.map(function (d, i) {
      var lv = iv[d];
      return '<div class="asc-w"><div class="asc"><span class="asc-n">' + (i + 1) + '</span>' +
        (/^\d{4}-\d\d-\d\d$/.test(d) ? '<input type="date" data-pdi="' + i + '" value="' + esc(d) + '"' + (lv ? ' disabled title="A data vén da saída"' : '') + '>' : '<span class="pasc-d">' + esc(d) + '</span>') +
        '<span class="asc-sp"></span>' + (own.indexOf(d) >= 0 ? '<button class="asc-del" data-act="pdel" data-pi="' + i + '" aria-label="Borrar a ascensión">×</button>' : '') + '</div>' +
        (lv ? '<button class="asc-via" data-act="pgovs" data-pid="' + esc(lv.p.id) + '">↳ ' + esc([lv.v.v, lv.p.n].filter(function (z, k, ar) { return z && ar.indexOf(z) === k; }).join(' · ')) + (lv.v.gr ? ' · ' + esc(lv.v.gr) : '') + ' <small>Ver a saída ›</small></button>' : '') +
        '<div class="asc-note" data-pni="' + i + '">' + (ac[d] ? '<button class="an-view" data-act="pnote" data-pi="' + i + '"><span class="an-t">' + esc(ac[d]) + '</span><span class="an-ed">Editar</span></button>'
          : '<button class="an-add" data-act="pnote" data-pi="' + i + '">＋ Engadir nota (con quen, como foi…)</button>') + '</div></div>';
    }).join('') + '</div><button class="btn asc-add" data-act="padd">+ Engadir unha ascensión</button></div>';
  }
  function openPoint(p) {
    setTimeout(function () {
      $$('#sheet input[data-pdi]').forEach(function (inp) {
        inp.onchange = function () {
          var D = ptAscDates(p), old = D[+inp.dataset.pdi], nw = inp.value; if (!nw || nw === old) return;
          var O2 = ptOwn(p), oi = O2.indexOf(old); if (oi < 0) return; O2[oi] = nw; ptSetDates(p, O2);
          if (p.ac && p.ac[old]) { p.ac[nw] = p.ac[nw] ? p.ac[nw] + ' · ' + p.ac[old] : p.ac[old]; delete p.ac[old]; }
          save(); refreshAll(); openPoint(p);
        };
      });
    }, 0);
    var h = '<h3>' + esc(p.n) + '</h3><button class="cat-cur" data-act="cat">' + pgIcon(p.g || 'Altres') + '<span>' + esc(p.g || 'Altres') + '</span><small>Cambiar</small></button><div class="kv">' +
      '<b>Altitude</b><span>' + (fmtAlt(p.h) || '—') + '</span>' + (!climbGroup(p) ? '' : p.vs && p.vs.length ? '<b>Xornadas</b><span>' + ptDates(p).length + (p.d ? ' · primeira ' + fmtDate(p.d) : '') + '</span>' : p.ds && p.ds.length > 1 ? '<b>Ascensións</b><span>' + p.ds.length + ' veces</span><b>Datas</b><span>' + p.ds.map(fmtDate).join('<br>') + '</span>' : '<b>Data</b><span>' + (fmtDate(p.d) || '—') + '</span>') +
      '<b>Coordenadas</b><span>' + (p.la != null ? p.la.toFixed(5) + ', ' + p.lo.toFixed(5) : '—') + '</span>' +
      (p.f && fById[p.f] ? '<b>100 Cims</b><span>' + esc(fById[p.f].n) + '</span>' : '') +
      (p.u && uById[p.u] ? '<b>Tresmil</b><span>' + esc(uById[p.u].n) + '</span>' : '') +
      (p.a && aById[p.a] ? '<b>4000</b><span>' + esc(aById[p.a].n) + '</span>' : '') +
      (p.ck && p.ck.length ? '<b>Cume</b><span>' + p.ck.map(function (k) { return esc(nameOfKey(k)); }).join(', ') + '</span>' : p.cc ? '<b>Cume</b><span>Amósase no mapa como cume feito</span>' : '') +
      (p.z ? '<b>Zona</b><span>' + esc(p.z) + '</span>' : '') +
      (p.nt ? '<b>Notas</b><span>' + esc(p.nt) + '</span>' : '') + '</div>' + ptAscHtml(p) + vsHtml(p) + plainAscHtml(p) + '<div class="btns">' +
      '<button class="btn pri" data-act="edit">Editar</button><button class="btn lnk" data-act="ren">Cambiar o nome</button>' +
      (p.la != null ? '<button class="btn lnk" data-act="map">Ver no mapa</button><a class="btn lnk" target="_blank" href="https://www.google.com/maps/search/?api=1&query=' + p.la + ',' + p.lo + '">Google Maps ↗</a>' : '') +
      '<button class="btn warn" data-act="del">Borrar</button></div>';
    openSheet(h);
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'edit') pointForm(p);
      if (b.dataset.act === 'vsadd') vsForm(p, null);
      if (b.dataset.act === 'vsed') vsForm(p, +b.dataset.vi);
      if (b.dataset.act === 'pnote') {
        var D0 = ptAscDates(p), d0 = D0[+b.dataset.pi], box = $('#sheet .asc-note[data-pni="' + b.dataset.pi + '"]');
        var c0 = (p.ac || {})[d0] || '';
        box.innerHTML = '<textarea id="pnT" rows="3" placeholder="Con quen foches, como foi, que lembrar…">' + esc(c0) + '</textarea>' +
          '<div class="an-btns"><button class="btn ok" data-act="pnsave" data-pi="' + b.dataset.pi + '">Gardar nota</button><button class="btn" data-act="pncancel">Cancelar</button>' +
          (c0 ? '<button class="btn an-x" data-act="pndel" data-pi="' + b.dataset.pi + '">Borrar nota</button>' : '') + '</div>';
        $('#pnT').focus(); return;
      }
      if (b.dataset.act === 'pnsave') {
        var d1 = ptAscDates(p)[+b.dataset.pi], tv = $('#pnT').value.trim();
        p.ac = p.ac || {}; if (tv) p.ac[d1] = tv; else delete p.ac[d1]; if (!Object.keys(p.ac).length) delete p.ac;
        save(); refreshAll(); openPoint(p); toast('Gardado'); return;
      }
      if (b.dataset.act === 'pncancel') { openPoint(p); return; }
      if (b.dataset.act === 'pndel') { var d4 = ptAscDates(p)[+b.dataset.pi]; if (p.ac) { delete p.ac[d4]; if (!Object.keys(p.ac).length) delete p.ac; } save(); refreshAll(); openPoint(p); toast('Nota borrada'); return; }
      if (b.dataset.act === 'pgovs') { var gp2 = S.points.filter(function (x) { return x.id === b.dataset.pid; })[0]; if (gp2) openPoint(gp2); return; }
      if (b.dataset.act === 'pdel') {
        var D2 = ptAscDates(p), d2 = D2[+b.dataset.pi];
        if (!confirm('Borrar a ascensión' + (d2 ? ' do ' + fmtDate(d2) : '') + '?')) return;
        ptSetDates(p, ptOwn(p).filter(function (x) { return x !== d2; })); if (p.ac) { delete p.ac[d2]; if (!Object.keys(p.ac).length) delete p.ac; }
        save(); refreshAll(); openPoint(p); return;
      }
      if (b.dataset.act === 'padd') {
        var td = today(), D3 = ptOwn(p); if (D3.indexOf(td) < 0) D3.push(td);
        ptSetDates(p, D3); save(); refreshAll(); openPoint(p); toast('Ascensión engadida (hoxe): cambia a data se fai falta'); return;
      }
      if (b.dataset.act === 'asc2vs') {
        // una ascensió normal passa a ser una sortida d'aquest punt (amb els cims del punt que es van fer aquell dia)
        var d = b.dataset.d, ks = (p.ck || []).filter(function (k) { return k.slice(0, 2) !== 'p:' && twinKeys(k).some(function (kk) { return S.done[kk] && ascList(S.done[kk]).some(function (x) { return x.d === d && !x.vid; }); }); });
        var cc = ''; ks.forEach(function (k) { twinKeys(k).forEach(function (kk) { if (S.done[kk] && !cc) ascList(S.done[kk]).forEach(function (x) { if (x.d === d && !x.vid && x.c && !cc) cc = x.c; }); }); });
        var nv = { d: d, t: vsDefT(p), cm: ks, id: uid() }; if (cc) nv.c = cc;
        p.vs = (p.vs || []).concat([nv]).sort(function (x, y) { return (x.d || '') < (y.d || '') ? -1 : (x.d || '') > (y.d || '') ? 1 : 0; });
        vsDates(p, null); syncVisit(p, nv, []);
        save(); refreshAll(); openPoint(p); toast('Pasada a saída do ' + fmtDate(d)); return;
      }
      if (b.dataset.act === 'ascopen') {
        var it = itemByKey(b.dataset.k); if (!it) return;
        openItem(it);
        // es ressalta l'ascensió triada dins la llista del cim
        var A = ascList(S.done[it.key] || {}), dd = b.dataset.d || '', ix = -1;
        A.forEach(function (x, i) { if (ix < 0 && (x.d || '') === dd && !x.vid) ix = i; });
        var w = ix >= 0 && $$('#sheet .asc-w')[ix];
        if (w) { w.classList.add('asc-hl'); setTimeout(function () { w.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 250); }
        return;
      }
      if (b.dataset.act === 'vsmap') {
        var ll = visitLL(p, p.vs[+b.dataset.vi]); if (!ll) return;
        var g = p.g || 'Altres';
        if (mapOpts.pg !== 'all') { mapOpts.pg = mapOpts.pg || {}; mapOpts.pg[g] = true; saveMapOpts(); }
        closeSheet(); retSet(); showView('mapa');
        setTimeout(function () { if (typeof drawMap === 'function') drawMap(); map.setView([ll.la, ll.lo], 15); }, 80);
      }
      if (b.dataset.act === 'ren') renameInline(p, openPoint);
      if (b.dataset.act === 'cat') catSheet(p.n, p.g, false, function (g) { p.g = g; save(); refreshAll(); renderPoints(); openPoint(p); toast('Movido a ' + g); });
      if (b.dataset.act === 'map') { closeSheet(); retSet(); showView('mapa'); setTimeout(function () { map.setView([p.la, p.lo], 15); }, 60); }
      if (b.dataset.act === 'del' && confirm('Queres borrar «' + p.n + '»?')) { unlinkPoint(p); S.points = S.points.filter(function (x) { return x !== p; }); save(); refreshAll(); closeSheet(); toast('Punto borrado'); }
    };
  }
  // coordenades d'un cim de les llistes
  function cimLL(k) {
    var t = k.slice(0, 2), id = k.slice(2), o = t === 'f:' ? fById[id] : t === 'u:' ? uById[id] : t === 'a:' ? aById[id] : t === 'p:' ? S.points.filter(function (x) { return x.id === id; })[0] : null;
    return o && o.la != null ? { la: o.la, lo: o.lo, h: o.h } : null;
  }
  // ascensions «normals» (sense sortida associada) dels cims d'un punt d'escalada/alpinisme
  function plainAscHtml(p) {
    if (!p.ck || !p.ck.length) return '';
    var L = [];
    p.ck.forEach(function (k) {
      if (k.slice(0, 2) === 'p:') return;
      var seen = {};
      twinKeys(k).forEach(function (kk) { if (S.done[kk]) ascList(S.done[kk]).forEach(function (x) { var id = (x.d || '') + '|' + (x.c || ''); if (!x.vid && !seen[id]) { seen[id] = 1; L.push({ k: k, x: x }); } }); });
    });
    if (!L.length) return '';
    L.sort(function (a, b) { return (a.x.d || '') < (b.x.d || '') ? 1 : -1; });
    var many = p.ck.filter(function (k) { return k.slice(0, 2) !== 'p:'; }).length > 1;
    return '<details class="vs vs-alt"><summary><h4>Outras ascensións' + (many ? '' : ' a ' + esc(nameOfKey(p.ck[0]))) + ' · ' + L.length + '</h4><span class="chev">▾</span></summary>' + L.map(function (o) {
      var x = o.x;
      return '<div class="vs-i" role="button" tabindex="0" data-act="ascopen" data-k="' + esc(o.k) + '" data-d="' + esc(x.d || '') + '"><div class="vs-h"><span>' + (x.d ? fmtDate(x.d) : 'Sen data') + '</span><span class="vs-t">' + (many ? esc(nameOfKey(o.k)) : '') + '</span></div>' +
        (x.c ? '<div class="vs-m">' + esc(x.c) + '</div>' : '') +
        (x.d ? '<button type="button" class="vs-mv" data-act="asc2vs" data-d="' + esc(x.d) + '">↑ Pasar a saída</button>' : '') + '</div>';
    }).join('') + '</details>';
  }
  // un punt enllaçat a un cim sense coordenades/altitud agafa les del cim
  function ckCoords(p) {
    if (!p.ck || !p.ck.length) return;
    // el cim amb el mateix nom que el punt; si no n'hi ha, el més alt
    var C = p.ck.map(function (k) { var o = cimLL(k); if (o) o.n = norm(nameOfKey(k)); return o; }).filter(Boolean); if (!C.length) return;
    var nm = norm(p.n || ''), ll = C.filter(function (o) { return o.n === nm; })[0] || C.filter(function (o) { return o.n && nm.indexOf(o.n) >= 0; })[0] || C.sort(function (a, b) { return (+b.h || 0) - (+a.h || 0); })[0];
    if (p.la == null || p.la === '' || p.lo == null || p.lo === '' || isNaN(+p.la)) { p.la = ll.la; p.lo = ll.lo; }
    if ((p.h == null || p.h === '') && ll.h) p.h = ll.h;
  }
  function vsDefT(p) { return p.g === 'Ferrades' ? 'Ferrata' : p.g === 'Alpinisme' ? 'Alpinisme' : 'Via llarga'; }
  // punt d'escalada/alpinisme enllaçat a un cim: cada data del punt és una sortida i les sortides sense cims hi queden enllaçades
  function linkPointCims(p) {
    if (!climbGroup(p) || !p.ck || !p.ck.length) return;
    var V = p.vs || [], have = {};
    V.forEach(function (v) { if (v.d) have[v.d] = 1; });
    ptOwn(p).forEach(function (d) { if (/^\d{4}-\d\d-\d\d$/.test(d) && !have[d]) { have[d] = 1; V.push({ d: d, t: vsDefT(p) }); } });
    V.forEach(function (v) {
      if (v.cm && v.cm.length) return;
      v.cm = p.ck.slice(); v.id = v.id || uid(); syncVisit(p, v, []);
      if (!v.c) v.cm.forEach(function (k) { twinKeys(k).forEach(function (kk) { if (S.done[kk] && !v.c) ascList(S.done[kk]).forEach(function (x) { if (x.vid === v.id && x.c && !v.c) v.c = x.c; }); }); });
    });
    if (V.length) p.vs = V.sort(function (x, y) { return (x.d || '') < (y.d || '') ? -1 : (x.d || '') > (y.d || '') ? 1 : 0; });
  }
  var draft = null, pickMode = false;
  function pointForm(p, preset) {
    var isNew = !p;
    var v = draft || Object.assign({ n: '', g: 'Cims', h: '', d: today(), la: '', lo: '', nt: '' }, p || {}, preset || {});
    draft = null;
    var opts = groups().map(function (g) { return '<option' + (v.g === g ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('');
    var h = '<h3>' + (isNew ? 'Novo punto' : 'Editar punto') + '</h3>' +
      '<div class="field"><label>Nome *</label><input id="fN" value="' + esc(v.n) + '" placeholder="Nome do cume ou lugar"></div>' +
      '<div class="two"><div class="field"><label>Grupo</label><select id="fG">' + opts + '</select></div>' +
      '<div class="field"><label>Altitude (m)</label><input id="fH" type="number" inputmode="numeric" value="' + esc(v.h == null ? '' : v.h) + '"></div></div>' +
      '<div class="field" id="fCkW"><label>Cume que sobe <small>· opcional</small></label><div id="fCk"></div><input id="fCs" type="search" placeholder="Busca o cume: Aneto, Pedraforca…"><div id="fCr" class="vcr"></div></div>' +
      '<div class="field" id="fCcW"><label style="display:flex;gap:8px;align-items:center;font-weight:600"><input id="fCc" type="checkbox" style="width:auto;margin:0"' + (v.cc ? ' checked' : '') + '> Amosar como cume feito no mapa <small style="font-weight:400;opacity:.7">· só para o mapa; non conta en ningunha lista nin medalla</small></label></div>' +
      '<div class="field" id="fDW"><label>Data</label><div class="two"><input id="fD" type="date" value="' + esc(v.d || '') + '"><button class="btn" data-act="nodate">Sen data</button></div></div>' +
      '<div class="two"><div class="field"><label>Latitud</label><input id="fLa" type="number" step="any" inputmode="decimal" value="' + esc(v.la == null ? '' : v.la) + '"></div>' +
      '<div class="field"><label>Longitud</label><input id="fLo" type="number" step="any" inputmode="decimal" value="' + esc(v.lo == null ? '' : v.lo) + '"></div></div>' +
      '<div class="btns" style="margin-top:0"><button class="btn lnk" data-act="gps">◎ A miña ubicación</button><button class="btn lnk" data-act="pick">Escoller no mapa</button></div>' +
      '<div class="field"><label>Zona</label><input id="fZ" value="' + esc(v.z || '') + '" placeholder="Montserrat, Pirineo…"></div>' +
      '<div class="field"><label>Notas</label><textarea id="fNt">' + esc(v.nt || '') + '</textarea></div>' +
      '<div class="btns"><button class="btn pri" data-act="save">Gardar</button><button class="btn" data-act="cancel">Cancelar</button></div>';
    openSheet(h);
    var ck = (v.ck || []).slice();
    function ckRender() {
      $('#fCkW').style.display = climbGroup({ g: $('#fG').value }) ? '' : 'none';
      $('#fCcW').style.display = climbGroup({ g: $('#fG').value }) && !ck.length ? '' : 'none'; // si ja puja un cim de llista, aquest ja surt al mapa
      $('#fDW').style.display = climbGroup({ g: $('#fG').value }) && p && p.vs && p.vs.length ? 'none' : ''; // les dates d'aquests punts són les de les sortides
      $('#fCk').innerHTML = ck.length ? '<div class="vchips">' + ck.map(function (k) { return '<span class="vchip">' + esc(nameOfKey(k)) + '<button type="button" data-act="ckx" data-k="' + esc(k) + '" aria-label="Quitar">×</button></span>'; }).join('') + '</div>' : '';
    }
    ckRender();
    $('#fG').onchange = ckRender;
    $('#fCs').oninput = function () {
      var L = cimSearch(this.value, 8, p && p.id).filter(function (x) { return ck.every(function (c) { return twinKeys(c).indexOf(x.k) < 0; }); });
      $('#fCr').innerHTML = L.map(function (x) { return '<button type="button" data-act="ckadd" data-k="' + esc(x.k) + '"><span>' + esc(x.n) + '</span><small>' + esc(x.lab) + (x.h ? ' · ' + fmtAlt(x.h) : '') + '</small></button>'; }).join('');
    };
    function read() {
      return { ck: ck.slice(), n: $('#fN').value.trim(), g: $('#fG').value, h: $('#fH').value === '' ? null : +$('#fH').value, d: $('#fD').value,
        la: $('#fLa').value === '' ? null : +$('#fLa').value, lo: $('#fLo').value === '' ? null : +$('#fLo').value, nt: $('#fNt').value.trim(), z: $('#fZ').value.trim(), cc: $('#fCc').checked };
    }
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.dataset.act;
      if (a === 'cancel') closeSheet();
      if (a === 'ckadd') { if (ck.indexOf(b.dataset.k) < 0) ck.push(b.dataset.k); $('#fCs').value = ''; $('#fCr').innerHTML = ''; ckRender(); return; }
      if (a === 'ckx') { ck = ck.filter(function (k) { return k !== b.dataset.k; }); ckRender(); return; }
      if (a === 'nodate') $('#fD').value = '';
      if (a === 'gps') locate(function (la, lo) { $('#fLa').value = la.toFixed(6); $('#fLo').value = lo.toFixed(6); toast('Ubicación engadida'); });
      if (a === 'pick') { draft = read(); draft._p = p; pickMode = true; closeSheet(); showView('mapa'); toast('Toca o mapa onde queiras poñer o punto'); }
      if (a === 'save') {
        var r = read();
        if (!r.n) { toast('Hai que poñer un nome'); return; }
        if ((r.la == null) !== (r.lo == null) || (r.la != null && (Math.abs(r.la) > 90 || Math.abs(r.lo) > 180 || isNaN(r.la) || isNaN(r.lo)))) { toast('Coordenadas non válidas'); return; }
        if (!isNew && p.ds && p.ds.length > 1 && r.d !== p.d) { var aa = p.ds.filter(function (x) { return x !== p.d; }); if (r.d) aa.push(r.d); aa.sort(); r.ds = aa; r.d = aa[0] || ''; if (aa.length < 2) r.ds = undefined; }
        if (!r.z) delete r.z;
        if (!climbGroup(r) || !r.ck.length) delete r.ck;
        else ckCoords(r);
        if (!r.cc || !climbGroup(r) || r.ck) delete r.cc;
        var tgt = r;
        if (isNew) { r.id = uid(); S.points.unshift(r); } else { Object.assign(p, r); if (!p.ds) delete p.ds; if (!r.z) delete p.z; if (!r.ck) delete p.ck; if (!r.cc) delete p.cc; tgt = p; }
        linkPointCims(tgt);
        save(); refreshAll(); checkMedals(false); if (isNew) closeSheet(); else openPoint(p); toast(isNew ? 'Punto engadido' : 'Punto gardado');
      }
    };
  }

  // ---------- MAPA ----------
  var map = null, layers = {}, base = {}, meMarker = null, mapOpts = { base: 'topo', feec: 'tots', uiaa: 'tots', alps: 'tots', points: false, pg: {}, routes: true };
  try { var mo = JSON.parse(localStorage.getItem('cimsMapOpts')); if (mo) { ['feec', 'uiaa', 'alps', 'points', 'routes'].forEach(function (k) { if (k in mo) mapOpts[k] = mo[k]; }); if (mo.pg) mapOpts.pg = mo.pg; else if (mo.points) mapOpts.pg = 'all'; } } catch (e) { }
  function saveMapOpts() { try { localStorage.setItem('cimsMapOpts', JSON.stringify({ feec: mapOpts.feec, uiaa: mapOpts.uiaa, alps: mapOpts.alps, points: mapOpts.points, pg: mapOpts.pg, routes: mapOpts.routes })); } catch (e) { } }
  // Punts propis al mapa: es mostren per grup (Escalades, Ferrades, Alpinisme…), cada un per separat
  function pgOn(g) { var o = mapOpts.pg; return o === 'all' || (o && o[g] === true); }
  function pgGroups() {
    var c = {}; S.points.forEach(function (p) { if (p.la != null) { var g = p.g || 'Altres'; c[g] = (c[g] || 0) + 1; } });
    return Object.keys(c).sort(function (a, b) { var ia = PG_ORDER.indexOf(a), ib = PG_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1); }).map(function (g) { return [g, c[g]]; });
  }
  function onlyDone() { return ['feec', 'uiaa', 'alps'].filter(lsOn).every(function (k) { return mapOpts[k] === 'fets'; }); }
  function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: false, tapHold: IOS_TOUCH, preferCanvas: true, renderer: L.canvas({ tolerance: 14 }) }).setView([42.1, 1.6], 8); window.__cimsMap = map;
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    base.osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
    base.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, subdomains: 'abc', attribution: '© OpenStreetMap · © OpenTopoMap' });
    base.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri' });
    base[mapOpts.base].addTo(map);
    layers.feec = L.layerGroup().addTo(map); layers.uiaa = L.layerGroup().addTo(map); layers.alps = L.layerGroup().addTo(map); layers.points = L.layerGroup().addTo(map); layers.routes = L.layerGroup().addTo(map);
    map.on('contextmenu', function (e) { pointForm(null, { la: +e.latlng.lat.toFixed(6), lo: +e.latlng.lng.toFixed(6) }); });
    map.on('click', function (e) {
      if (!pickMode) return;
      pickMode = false;
      var d = draft; d.la = +e.latlng.lat.toFixed(6); d.lo = +e.latlng.lng.toFixed(6);
      var p = d._p; delete d._p; draft = d; pointForm(p || null);
    });
    // tocar qualsevol punt del mapa tanca el panell de capes/filtres
    $('#map').addEventListener('click', function () { $('#layerPanel').classList.add('hidden'); }, true);
    $('#map').addEventListener('click', function (e) {
      var b = e.target.closest('.pop-b'); if (!b) return;
      if (b.dataset.k) { var t0 = b.dataset.k.slice(0, 1), id0 = b.dataset.k.slice(2); var it = itemByKey(b.dataset.k); if (it) openItem(it); }
      if (b.dataset.r != null) { var rr = S.routes[+b.dataset.r]; if (rr) { map.closePopup(); openRoute(rr); } }
      if (b.dataset.p) { var p = S.points.filter(function (x) { return x.id === b.dataset.p; })[0]; if (p) openPoint(p); }
      if (b.dataset.dr != null) { var dr = S.routes[+b.dataset.dr]; if (dr && confirm('Queres borrar a ruta «' + dr.n + '»?')) { map.closePopup(); delRoutes([dr]); drawMap(); toast('Ruta borrada'); } }
      if (b.dataset.dp) { var dp = S.points.filter(function (x) { return x.id === b.dataset.dp; })[0]; if (dp && confirm('Queres borrar «' + dp.n + '»?')) { map.closePopup(); unlinkPoint(dp); S.points = S.points.filter(function (x) { return x !== dp; }); save(); refreshAll(); drawMap(); toast('Punto borrado'); } }
    });
    drawMap();
    setTimeout(function () { $('#mapHint').style.opacity = 0; }, 4000);
  }
  function drawMap() {
    if (!map) return;
    layers.feec.clearLayers(); layers.uiaa.clearLayers(); layers.alps.clearLayers();
    if (lsOn('alps') && mapOpts.alps !== 'cap') AL.forEach(function (a) {
      if (a.la == null) return;
      var d = isDone('a:' + a.id);
      if (mapOpts.alps === 'pend' && d) return;
      var w = isWant('a:' + a.id);
      if (mapOpts.alps === 'fets' && !d) return;
      if (mapOpts.alps === 'vull' && !w) return;
      L.circleMarker([a.la, a.lo], { radius: d ? 6 : w ? 8 : 5, color: '#7A3E1D', weight: 1.5, fillColor: d ? '#2F7A4B' : w ? '#D98A2B' : '#E08A5B', fillOpacity: .95 })
        .bindPopup('<div class="pop-n">' + esc(a.n) + '</div><div class="pop-m">' + fmtAlt(a.h) + ' · ' + esc(a.z) + (d ? ' · ✓ Feito' : w ? ' · ★ Quero facer' : '') + '</div><button class="pop-b" data-k="a:' + a.id + '">Detalle</button>')
        .addTo(layers.alps);
    }); layers.points.clearLayers(); layers.routes.clearLayers();
    if (lsOn('uiaa') && mapOpts.uiaa !== 'cap') U.forEach(function (u) {
      if (u.la == null) return;
      var d = isDone('u:' + u.id);
      if (mapOpts.uiaa === 'pend' && d) return;
      var w = isWant('u:' + u.id);
      if (mapOpts.uiaa === 'fets' && !d) return;
      if (mapOpts.uiaa === 'vull' && !w) return;
      L.circleMarker([u.la, u.lo], { radius: d ? 6 : w ? 8 : 5, color: '#1E3F66', weight: 1.5, fillColor: d ? '#2F7A4B' : w ? '#D98A2B' : '#5B8CC0', fillOpacity: .95 })
        .bindPopup('<div class="pop-n">' + esc(u.n) + '</div><div class="pop-m">' + fmtAlt(u.h) + ' · ' + esc(zl(u.z)) + (d ? ' · ✓ Feito' : w ? ' · ★ Quero facer' : '') + '</div><button class="pop-b" data-k="u:' + u.id + '">Detalle</button>')
        .addTo(layers.uiaa);
    });
    if (lsOn('feec') && mapOpts.feec !== 'cap') F.forEach(function (f) {
      var d = isDone('f:' + f.id);
      if (mapOpts.feec === 'pend' && d) return;
      var w = isWant('f:' + f.id);
      if (mapOpts.feec === 'fets' && !d) return;
      if (mapOpts.feec === 'vull' && !w) return;
      if (mapOpts.feec === 'esspend' && (d || !f.e)) return;
      var col = d ? '#2F7A4B' : w ? '#D98A2B' : f.e ? '#6B5BA8' : '#8E95A3';
      L.circleMarker([f.la, f.lo], { radius: d ? 7 : w ? 9 : 6, color: '#fff', weight: 1.5, fillColor: col, fillOpacity: .95 })
        .bindPopup('<div class="pop-n">' + esc(f.n) + '</div><div class="pop-m">' + fmtAlt(f.h) + ' · ' + (f.e ? 'Esencial' : 'Non esencial') + (d ? ' · ✓ Feito' : w ? ' · ★ Quero facer' : '') + '</div><button class="pop-b" data-k="f:' + f.id + '">Detalle</button>')
        .addTo(layers.feec);
    });
    var triOn = lsOn('feec') && (mapOpts.feec === 'tots' || mapOpts.feec === 'fets');
    S.points.forEach(function (p) {
      if (p.la == null) return;
      var tri = p.cc && climbGroup(p) && !(p.ck && p.ck.length);
      if (!(pgOn(p.g || 'Altres') || (tri && triOn))) return;
      var pop = '<div class="pop-n">' + esc(p.n) + '</div><div class="pop-m">' + esc(p.g || '') + (p.h ? ' · ' + fmtAlt(p.h) : '') + (tri ? ' · Cume feito' : '') + '</div><button class="pop-b" data-p="' + esc(p.id) + '">Detalle</button>' + (officialPoint(p) ? '' : ' <button class="pop-b pop-del" data-dp="' + esc(p.id) + '">Borra</button>');
      if (tri) { L.circleMarker([p.la, p.lo], { radius: 7, color: '#fff', weight: 1.5, fillColor: '#2F7A4B', fillOpacity: .95 }).bindPopup(pop).addTo(layers.points); return; }
      L.circleMarker([p.la, p.lo], { radius: 5, color: '#fff', weight: 1, fillColor: GCOL[p.g] || '#555', fillOpacity: .9 })
        .bindPopup('<div class="pop-n">' + esc(p.n) + '</div><div class="pop-m">' + esc(p.g || '') + (p.h ? ' · ' + fmtAlt(p.h) : '') + '</div><button class="pop-b" data-p="' + esc(p.id) + '">Detalle</button>' + (officialPoint(p) ? '' : ' <button class="pop-b pop-del" data-dp="' + esc(p.id) + '">Borra</button>'))
        .addTo(layers.points);
    });
    if (mapOpts.routes) S.routes.forEach(function (r) {
      if (r.c && r.c.length > 1) L.polyline(r.c, { color: '#E5173F', weight: 4, opacity: .92 }).bindPopup('<div class="pop-n">' + esc(r.n) + '</div><div class="pop-m">' + (r.km || '') + ' km' + (r.up ? ' · +' + r.up + ' m' : '') + (r.d ? ' · ' + fmtDate(r.d) : '') + '</div><button class="pop-b" data-r="' + S.routes.indexOf(r) + '">Detalle</button> <button class="pop-b pop-del" data-dr="' + S.routes.indexOf(r) + '">Borra</button>').addTo(layers.routes);
    });
  }
  var lpOpen = '';
  function renderLayerPanel() {
    var rad = function (n, k, l) { return '<label><input type="radio" name="' + n + '" value="' + k + '"' + (mapOpts[n] === k ? ' checked' : '') + '>' + l + '</label>'; };
    var R3 = [['tots', 'Todos'], ['fets', 'Feitos'], ['vull', '★ Quero facer'], ['pend', 'Pendentes'], ['cap', 'Agochar']];
    var FE = R3.slice(0, 4).concat([['esspend', 'Esenciais pendentes'], ['cap', 'Agochar']]);
    var BA = [['topo', 'Topográfico'], ['osm', 'OpenStreetMap'], ['sat', 'Satélite']];
    var lab = function (L, v) { var o = L.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : ''; };
    var sec = function (id, title, sum, body) {
      var op = lpOpen === id;
      return '<div class="lps' + (op ? ' open' : '') + '"><button class="lph" data-sec="' + id + '"><b>' + title + '</b><span class="lpsum">' + sum + '</span><i>' + (op ? '▴' : '▾') + '</i></button>' + (op ? '<div class="lpb">' + body + '</div>' : '') + '</div>';
    };
    var grp = pgGroups(), on = grp.filter(function (x) { return pgOn(x[0]); });
    var sumP = !on.length ? 'Ningún' : on.length === grp.length ? 'Todos' : on.map(function (x) { return x[0]; }).join(', ');
    var bodyP = '<div class="lpq"><button class="lpa" data-all="1">Todos</button><button class="lpa" data-all="0">Ningún</button></div>' + grp.map(function (x) { return '<label><input type="checkbox" class="lyG" data-g="' + esc(x[0]) + '"' + (pgOn(x[0]) ? ' checked' : '') + '><span class="lyg-d" style="background:' + (GCOL[x[0]] || '#555') + '"></span>' + esc(x[0]) + ' <small>' + x[1] + '</small></label>'; }).join('');
    $('#layerPanel').innerHTML = '<label class="ly-only"><input type="checkbox" id="lyDone"' + (onlyDone() ? ' checked' : '') + '>Só os cumes feitos</label>' +
      (lsOn('feec') ? sec('feec', '100 Cims', lab(FE, mapOpts.feec), FE.map(function (o) { return rad('feec', o[0], o[1]); }).join('')) : '') +
      (lsOn('uiaa') ? sec('uiaa', '3000 Pirineo', lab(R3, mapOpts.uiaa), R3.map(function (o) { return rad('uiaa', o[0], o[1]); }).join('')) : '') +
      (lsOn('alps') ? sec('alps', '4000 Alps', lab(R3, mapOpts.alps), R3.map(function (o) { return rad('alps', o[0], o[1]); }).join('')) : '') +
      sec('pts', 'Os meus puntos', esc(sumP), bodyP) +
      '<label class="lprt"><input type="checkbox" id="lyR"' + (mapOpts.routes ? ' checked' : '') + '>Rutas</label>' +
      sec('base', 'Mapa base', lab(BA, mapOpts.base), BA.map(function (o) { return rad('base', o[0], o[1]); }).join(''));
  }
  function locate(cb) {
    if (!navigator.geolocation) { toast('Ubicación non dispoñible'); return; }
    toast('Buscando a ubicación…');
    navigator.geolocation.getCurrentPosition(function (pos) { cb(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy); },
      function (err) { toast(err.code === 1 ? 'Hai que dar permiso de ubicación á app' : 'Non se puido obter a ubicación'); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }
  function nearMe() {
    locate(function (la, lo) {
      if (meMarker) meMarker.remove();
      meMarker = L.marker([la, lo], { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
      map.setView([la, lo], 12);
      var arr = F.filter(function (f) { return !isDone('f:' + f.id); }).map(function (f) { return [dist(la, lo, f.la, f.lo), f]; })
        .sort(function (a, b) { return a[0] - b[0]; }).slice(0, 12);
      openSheet('<h3>Cumes pendentes preto</h3><div class="sub">Dos 100 Cims, por distancia en liña recta</div><ul class="near">' + arr.map(function (x) {
        return '<li data-f="' + x[1].id + '"><span><b>' + esc(x[1].n) + '</b>' + (x[1].e ? ' <span class="badge b-ess">Esencial</span>' : '') + '<br><small style="color:var(--mute)">' + fmtAlt(x[1].h) + ' · ' + esc(x[1].c) + '</small></span><span style="white-space:nowrap;font-weight:600">' + x[0].toFixed(1) + ' km</span></li>';
      }).join('') + '</ul>');
      $('#sheet').onclick = function (e) { var li = e.target.closest('[data-f]'); if (li) openItem(itemFeec(fById[li.dataset.f])); };
    });
  }

  // ---------- Dropbox (còpia automàtica) ----------
  // Flux OAuth "code + PKCE" sense redirecció: Dropbox mostra un codi que l'usuari enganxa a l'app.
  // Les dades de connexió es desen a part i NO van dins de la còpia de seguretat.
  var DBX_KEY = 'cimsDropbox.v1';
  var DBX_FILE = '/cims-copia.json';
  var DBX_XLSX = '/Cims_seguiment.xlsx';
  var DBX_KMZ = '/Cims.kmz';
  function sig(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + '.' + str.length; }
  var dbx = (function () { try { return JSON.parse(localStorage.getItem(DBX_KEY)) || {}; } catch (e) { return {}; } })();
  function dbxSave() { try { localStorage.setItem(DBX_KEY, JSON.stringify(dbx)); } catch (e) { } }
  function dbxOn() { return !!(dbx.appKey && dbx.refresh); }
  function b64url(bytes) { var s = ''; bytes.forEach(function (b) { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function randomVerifier() { var a = new Uint8Array(48); crypto.getRandomValues(a); return b64url(a); }
  function challengeFor(v) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (h) { return b64url(new Uint8Array(h)); }); }
  function form(o) { return Object.keys(o).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&'); }
  function tokenReq(params) {
    return fetch('https://api.dropboxapi.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(params) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.error || ('HTTP ' + r.status)); return j; }); });
  }
  function dbxAccess() {
    if (dbx.access && dbx.exp && Date.now() < dbx.exp - 60000) return Promise.resolve(dbx.access);
    return tokenReq({ grant_type: 'refresh_token', refresh_token: dbx.refresh, client_id: dbx.appKey }).then(function (j) {
      dbx.access = j.access_token; dbx.exp = Date.now() + (j.expires_in || 14400) * 1000; dbxSave(); return dbx.access;
    });
  }
  // missatge llegible d'un error de Dropbox (sense tallar)
  function dbxErr(r, t, what) {
    var m = t || '';
    try { var j = JSON.parse(t); m = (j.user_message && j.user_message.text) || j.error_summary || (j.error && j.error['.tag']) || t; } catch (e) { }
    m = String(m).replace(/^Error in call to API function "[^"]*":\s*/, '');
    var sc = /required scope '([^']+)'/.exec(m);
    if (sc) m = 'á túa app de Dropbox fáltalle o permiso «' + sc[1] + '». Vai a dropbox.com/developers/apps → a túa app → pestana Permissions, marca «' + sc[1] + '» (e «files.content.read»), preme Submit, e aquí fai «Dropbox: desconectar» e volve conectar.';
    return new Error((what ? what + ' · ' : '') + 'Dropbox ' + r.status + ': ' + m);
  }
  // pujada: primer amb capçaleres normals; si Dropbox la rebutja (400), es torna a provar amb el format «cors-hack»
  // (arguments a la URL i Content-Type text/plain), que evita capçaleres que alguns WebView modifiquen
  function dbxUpload(path, data, what) {
    var arg = JSON.stringify({ path: path, mode: 'overwrite', mute: true }).replace(/[\u007f-\uffff]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); });
    var body = function () { return data instanceof Blob ? data : new Blob([data]); };
    var plain = function (tok) {
      return fetch('https://content.dropboxapi.com/2/files/upload', { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': arg }, body: body() });
    };
    var hack = function (tok) {
      return fetch('https://content.dropboxapi.com/2/files/upload?' + form({ arg: arg, authorization: 'Bearer ' + tok }), { method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=dropbox-cors-hack' }, body: body() });
    };
    var fail = function (r) { return r.text().then(function (t) { throw dbxErr(r, t, what); }); };
    return dbxAccess().then(function (tok) {
      if (dbx.hack) return hack(tok).then(function (r) { return r.ok ? r.json() : fail(r); });
      return plain(tok).then(function (r) {
        if (r.ok) return r.json();
        if (r.status === 401) { dbx.access = ''; dbx.exp = 0; return dbxAccess().then(function (t2) { return plain(t2); }).then(function (r2) { return r2.ok ? r2.json() : fail(r2); }); }
        if (r.status === 400) return hack(tok).then(function (r2) { if (r2.ok) { dbx.hack = true; dbxSave(); return r2.json(); } return fail(r2); });
        return fail(r);
      });
    });
  }
  function dbxDelete(path) {
    return dbxAccess().then(function (tok) {
      return fetch('https://api.dropboxapi.com/2/files/delete_v2', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path }) });
    }).then(function (r) { if (!r.ok && r.status !== 409) throw new Error('Dropbox ' + r.status); }).catch(function () { });
  }
  function dbxDownload(path) {
    return dbxAccess().then(function (tok) {
      return fetch('https://content.dropboxapi.com/2/files/download', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tok, 'Dropbox-API-Arg': JSON.stringify({ path: path }) } });
    }).then(function (r) { if (!r.ok) throw new Error(r.status === 409 ? 'Aínda non hai ningunha copia en Dropbox' : 'Dropbox ' + r.status); return r.text(); });
  }
  var cloudTimer = null, cloudBusy = false;
  function cloudBackup(manual) {
    if (!dbxOn()) return Promise.resolve();
    if (cloudBusy) return Promise.resolve();
    clearTimeout(cloudTimer); cloudTimer = null;
    var text = JSON.stringify(S), sg = sig(text);
    if (!manual && dbx.sig === sg && dbx.kmzv === 1) { dbx.pending = false; dbxSave(); return Promise.resolve(); }  // res no ha canviat: no es puja res
    cloudBusy = true;
    var extra = [];  // l'Excel i el KMZ són un extra: si fallen, la còpia (.json) es dona igualment per feta
    return dbxUpload(DBX_FILE, new Blob([text], { type: 'application/octet-stream' }), 'Copia')
      .then(function () { dbx.last = Date.now(); dbx.sig = sg; dbx.kmzv = 1; dbx.pending = false; dbx.err = ''; dbxSave(); })
      .then(function () { return window.buildXlsx ? window.buildXlsx(S).then(function (bin) { return dbxUpload(DBX_XLSX, bin, 'Excel'); }).catch(function (e) { extra.push(String(e.message || e)); }) : null; })
      .then(function () { return window.buildKmz ? window.buildKmz(S).then(function (bin) { return dbxUpload(DBX_KMZ, bin, 'KMZ'); }).catch(function (e) { extra.push(String(e.message || e)); }) : null; })
      .then(function () { return dbx.cleaned ? null : dbxDelete('/historial').then(function () { dbx.cleaned = true; }); })
      .then(function () { dbx.err = extra.join(' · '); dbxSave(); if (manual) toast(extra.length ? 'Copia gardada en Dropbox (pero ' + extra.join(' · ') + ')' : 'Copia gardada en Dropbox'); })
      .catch(function (e) { dbx.pending = true; dbx.err = String(e.message || e); dbxSave(); if (manual) toast('Non se puido gardar en Dropbox: ' + dbx.err); })
      .then(function () { cloudBusy = false; });
  }
  window.__cloudSchedule = function () {
    if (!dbxOn()) return;
    dbx.pending = true; dbxSave();
    clearTimeout(cloudTimer); cloudTimer = setTimeout(function () { cloudBackup(false); }, 20000);
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && dbxOn()) cloudBackup(false); });
  function fmtStamp(t) { if (!t) return 'nunca'; var d = new Date(t); return d.toLocaleDateString('ca-ES') + ' ' + d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }); }
  function dbxConnectSheet() {
    var verifier = randomVerifier();
    openSheet('<h3>Conectar Dropbox</h3><div class="sub">Só hai que facelo unha vez.</div>' +
      '<div class="field"><label>1 · App key da túa app de Dropbox</label><input id="dbxKey" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(dbx.appKey || '') + '" placeholder="p. ex. abcd1234efgh567"></div>' +
      '<div class="btns" style="margin-top:0"><button class="btn lnk" data-d="auth">2 · Abrir Dropbox e autorizar</button></div>' +
      '<div class="field"><label>3 · Pega aquí o código que che amosa Dropbox</label><input id="dbxCode" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="btns"><button class="btn pri" data-d="ok">Conectar</button><button class="btn" data-d="cancel">Cancelar</button></div>');
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      var key = $('#dbxKey').value.trim();
      if (b.dataset.d === 'cancel') { closeSheet(); return; }
      if (!key) { toast('Primeiro pon a App key'); return; }
      if (b.dataset.d === 'auth') {
        challengeFor(verifier).then(function (ch) {
          var url = 'https://www.dropbox.com/oauth2/authorize?' + form({ client_id: key, response_type: 'code', code_challenge: ch, code_challenge_method: 'S256', token_access_type: 'offline' });
          var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
        });
      }
      if (b.dataset.d === 'ok') {
        var code = $('#dbxCode').value.trim();
        if (!code) { toast('Falta o código'); return; }
        toast('Conectando…');
        tokenReq({ grant_type: 'authorization_code', code: code, code_verifier: verifier, client_id: key }).then(function (j) {
          dbx = { appKey: key, refresh: j.refresh_token, access: j.access_token, exp: Date.now() + (j.expires_in || 14400) * 1000, last: 0, pending: true, cleaned: true };
          dbxSave(); closeSheet();
          return cloudBackup(true);
        }).catch(function (err) { toast('Non se puido conectar: ' + (err.message || err)); });
      }
    };
  }
  function cloudOnStart() {
    if (dbxOn() && (dbx.pending || !dbx.last || Date.now() - dbx.last > 12 * 3600 * 1000)) setTimeout(function () { cloudBackup(false); }, 3000);
  }

  // ---------- IMPORTAR HISTORIAL (arxiu d'exportació de Garmin o Strava) ----------
  // Llegeix el ZIP sencer d'exportació, detecta els cims de cada activitat i els deixa «per revisar».
  var INB_KEY = 'cimsInbox.v1';
  var inbox = (function () { try { return JSON.parse(localStorage.getItem(INB_KEY)) || []; } catch (e) { return []; } })();
  function inbSave() { try { localStorage.setItem(INB_KEY, JSON.stringify(inbox)); } catch (e) { toast('Non se puido gardar a lista por revisar (demasiado grande)'); } }
  function cimCands() {
    return F.map(function (f) { return { key: 'f:' + f.id, n: f.n, h: f.h, la: f.la, lo: f.lo, l: f.e ? '100 Cims · essencial' : '100 Cims' }; })
      .concat(U.filter(function (u) { return u.la != null; }).map(function (u) { return { key: 'u:' + u.id, n: u.n, h: u.h, la: u.la, lo: u.lo, l: '3000 · ' + zl(u.z) }; }))
      .concat(lsOn('alps') ? AL.filter(function (a) { return a.la != null; }).map(function (a) { return { key: 'a:' + a.id, n: a.n, h: a.h, la: a.la, lo: a.lo, l: '4000 · ' + a.z }; }) : []);
  }
  function cimInfo(k) {
    if (k.slice(0, 2) === 'f:') { var f = fById[k.slice(2)]; return f && { n: f.n, h: f.h, l: f.e ? '100 Cims · essencial' : '100 Cims' }; }
    if (k.slice(0, 2) === 'a:') { var a = aById[k.slice(2)]; return a && { n: a.n, h: a.h, l: '4000 · ' + a.z }; }
    var u = uById[k.slice(2)]; return u && { n: u.n, h: u.h, l: '3000 · ' + zl(u.z) };
  }
  function refreshBadge() { var b = $('#menuBtn'); if (b) b.classList.toggle('dot', inbox.length > 0); }
  // identificador d'una activitat: hora d'inici (així la mateixa sortida de Garmin i de Strava no es compta dos cops)
  function actId(t) {
    for (var i = 0; i < t.pts.length; i++) if (t.pts[i][3]) return 'a:' + t.pts[i][3].toISOString().slice(0, 16);
    return 'a:' + (t.name || '') + ':' + t.pts.length;
  }
  function parseCsv(text) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  var imp = { busy: false, cancel: false };
  function impStatus(msg, frac) {
    imp.msg = msg; imp.frac = frac;
    var el = $('#impProg'); if (el) el.textContent = msg;
    var b = $('#impBar'); if (b) b.style.width = Math.round((frac || 0) * 100) + '%';
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  async function importArchive(file) {
    if (imp.busy) return;
    imp.busy = true; imp.cancel = false;
    imp.msg = 'Abrindo o arquivo…'; imp.frac = 0; importSheet();
    var cands = cimCands(), names = {}, garmin = [], items = [], found = 0, read = 0, failed = 0, nAct = 0;
    try {
      impStatus('Abrindo o arquivo…', 0);
      var isZip = /\.zip$/i.test(file.name);
      if (!isZip) items.push({ blob: file, e: null, path: file.name });
      else {
        var top = await Tracks.zipList(file);
        var isAct = function (n) { return /\.(fit|gpx|tcx|kml)(\.gz)?$/i.test(n) && !/wellness|monitor|sleep|metrics|hrv/i.test(n); };
        for (var i = 0; i < top.length; i++) {
          var e = top[i];
          if (isAct(e.name)) items.push({ blob: file, e: e, path: e.name });
          else if (/(^|\/)activities\.csv$/i.test(e.name)) {
            var rows = parseCsv(await (await Tracks.zipEntry(file, e)).text()), h = rows[0] || [];
            var fi = h.findIndex(function (x) { return /^filename$|nombre de archivo|nom du fichier/i.test(x.trim()); });
            var ni = h.findIndex(function (x) { return /^activity name$|nombre de la actividad|nom de l.activit/i.test(x.trim()); });
            if (fi >= 0 && ni >= 0) rows.slice(1).forEach(function (r) { if (r[fi]) names[r[fi].trim().toLowerCase()] = r[ni]; });
          } else if (/summarizedActivities\.json$/i.test(e.name)) {
            try {
              var js = JSON.parse(await (await Tracks.zipEntry(file, e)).text());
              (Array.isArray(js) ? js : [js]).forEach(function (o) { (o.summarizedActivitiesExport || []).forEach(function (a) { if (a.beginTimestamp && a.name) garmin.push([a.beginTimestamp, a.name]); }); });
            } catch (er) { }
          }
        }
        // Garmin desa les activitats dins de ZIP interns (UploadedFiles_…zip)
        var inner = top.filter(function (e) { return /\.zip$/i.test(e.name); });
        for (var j = 0; j < inner.length && !imp.cancel; j++) {
          impStatus('Abrindo ' + inner[j].name.split('/').pop() + '…', 0);
          try {
            var ib = await Tracks.zipEntry(file, inner[j]), il = await Tracks.zipList(ib);
            il.forEach(function (e) { if (isAct(e.name)) items.push({ blob: ib, e: e, path: e.name }); });
          } catch (er) { }
        }
      }
      if (!items.length) throw new Error('Non se atopou ningunha actividade (ficheiros .fit, .gpx ou .tcx) dentro do arquivo');
      var seen = {};
      inbox.forEach(function (a) { seen[a.aid] = 1; });
      for (var k = 0; k < items.length && !imp.cancel; k++) {
        var it = items[k];
        impStatus('Analizando ' + (k + 1) + ' de ' + items.length + ' actividades · ' + found + ' con cumes', k / items.length);
        await tick();
        try {
          if (it.e && /\.fit$/i.test(it.path) && it.e.us < 500) continue;
          var buf = it.e ? await (await Tracks.zipEntry(it.blob, it.e)).arrayBuffer() : await it.blob.arrayBuffer();
          var t = await Tracks.parseBuffer(it.path, buf);
          read++;
          if (!t.pts || t.pts.length < 2) continue;
          Tracks.summary(t); nAct++;
          var id = actId(t); if (seen[id]) continue; seen[id] = 1;
          var hits = Tracks.detect(t, cands, 80).filter(function (h) { return !hasActivity(h.key, id); });
          if (!hits.length) continue;
          var nm = names[it.path.toLowerCase()] || '';
          if (!nm && garmin.length && t.pts[0][3]) { var t0 = t.pts[0][3].getTime(); garmin.forEach(function (g) { if (Math.abs(g[0] - t0) < 180000) nm = g[1]; }); }
          if (!nm && t.name && !/^\d+$/.test(t.name) && !/\.(fit|gpx|tcx)/i.test(t.name)) nm = t.name;
          if (!nm) nm = 'Saída do ' + fmtDate(t.date);
          var simp = simplify(t.pts, 40); if (simp.length > 400) simp = simp.filter(function (p, i) { return i % Math.ceil(simp.length / 400) === 0 || i === simp.length - 1; });
          inbox.push({ aid: id, n: nm, d: t.date, km: t.km, up: t.up, poly: Tracks.encodePolyline(simp), hits: hits.map(function (h) { return { k: h.key, dist: h.dist, w: h.when ? h.when.toTimeString().slice(0, 5) : '' }; }) });
          found++;
          if (found % 10 === 0) inbSave();
        } catch (er) { failed++; }
      }
      inbox.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
      inbSave(); refreshBadge();
      var msg = (imp.cancel ? 'Parado. ' : '') + nAct + ' actividades con GPS revisadas, ' + found + ' con cumes' + (failed ? ' (' + failed + ' ficheiros non se puideron ler)' : '') + '.';
      impStatus(msg, 1);
      toast(msg);
      if (found) inboxSheet();
    } catch (e) {
      impStatus('Error: ' + (e.message || e), 0); toast('Error: ' + (e.message || e));
    }
    imp.busy = false;
    if (sheetOpen && $('#impSheet')) importSheet();
  }
  function pickArchive() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.className = 'hidden';
    inp.onchange = function () { var f = inp.files[0]; inp.remove(); if (f) importArchive(f); };
    document.body.appendChild(inp); inp.click();
  }
  function importSheet() {
    openSheet('<div id="impSheet"></div><h3>Importar historial</h3><div class="sub">Todas as túas saídas dunha vez, a partir do arquivo que che deixan descargar Garmin ou Strava.</div>' +
      (imp.busy || imp.msg ? '<div class="imp-prog"><div class="track"><div class="fill" id="impBar" style="width:' + Math.round((imp.frac || 0) * 100) + '%;background:#7B66C9"></div></div><div class="detail" id="impProg">' + esc(imp.msg || '') + '</div></div>' : '') +
      (imp.busy ? '<div class="btns"><button class="btn warn" data-i="stop">Parar</button></div><div class="detail">Deixa a app aberta e a pantalla acesa mentres traballa. Cun historial longo pode tardar uns minutos.</div>'
        : '<div class="btns"><button class="btn pri" data-i="pick">Escoller o ficheiro ZIP</button>' + (inbox.length ? '<button class="btn ok" data-i="rev">Revisar (' + inbox.length + ')</button>' : '') + '</div>' +
          '<h4 class="st-h">Como conseguir o arquivo</h4>' +
          '<div class="detail"><b>Garmin:</b> en garmin.com, inicia sesión e vai a <i>Conta → Xestión de datos → Exportar os teus datos</i>. Pasado un tempo (minutos ou ata uns días) chégache un correo coa ligazón para descargar o ZIP.</div>' +
          '<div class="detail"><b>Strava:</b> en strava.com, <i>Configuración → A miña conta → Dar de baixa ou eliminar a conta → Solicitar arquivo</i>. Chégache por correo unha ligazón ao ZIP.</div>' +
          '<div class="detail">Escolle o ZIP tal como o descargas, sen descomprimilo. Podes importar os dous: a mesma saída non se conta dúas veces. Tamén podes volver importar un arquivo máis novo: só aparecerán as actividades novas.</div>'));
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      if (b.dataset.i === 'pick') pickArchive();
      if (b.dataset.i === 'stop') { imp.cancel = true; impStatus('Parando…', imp.frac); }
      if (b.dataset.i === 'rev') inboxSheet();
    };
  }
  // Safata: activitats amb cims detectats, per confirmar
  function inboxSheet() {
    var list = inbox.slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    var count = {}, rows = '';
    list.forEach(function (a) {
      rows += '<div class="stv-act"><div class="stv-ah"><b>' + esc(a.n) + '</b><span>' + fmtDate(a.d) + ' · ' + a.km + ' km' + (a.up ? ' · +' + a.up + ' m' : '') + '</span></div>' +
        a.hits.map(function (h, hi) {
          var it = cimInfo(h.k); if (!it) return '';
          var r = S.done[h.k];
          count[h.k] = (count[h.k] || (r ? ascList(r).filter(function (x) { return x.d; }).length : 0)) + 1;
          var st = !r && count[h.k] === 1 ? 'nou' : 'ascensión nº ' + count[h.k];
          return '<label class="trk-row"><input type="checkbox" data-a="' + esc(a.aid) + '" data-h="' + hi + '" checked><span class="body"><span class="nm">' + esc(it.n) + ' <small>' + fmtAlt(it.h) + '</small></span>' +
            '<span class="meta">' + esc(it.l) + ' · a ' + h.dist + ' m' + (h.w ? ' · ' + h.w : '') + '</span></span><span class="badge ' + (st === 'nou' ? 'b-ess' : 'b-s') + '">' + st + '</span></label>';
        }).join('') + '</div>';
    });
    openSheet('<h3>Cumes por revisar</h3><div class="sub">' + list.length + ' actividade' + (list.length === 1 ? '' : 's') + ' con cumes. Desmarca o que non subises de verdade.</div>' +
      (list.length ? '<div class="btns"><button class="btn" data-v="all">Marcar todo</button><button class="btn" data-v="none">Desmarcar todo</button></div>' + rows +
        '<label class="trk-row"><input type="checkbox" id="impRoutes" checked><span class="body"><span class="nm">Gardar estas actividades como rutas</span><span class="meta">Traza simplificada, vese no mapa, no Excel e no KMZ</span></span></label>' +
        '<div class="btns"><button class="btn ok" data-v="apply">Aplicar os marcados</button><button class="btn" data-v="discard">Descartar todo</button></div>' +
        '<div class="detail">Cada cume marcado suma unha ascensión coa data da actividade: se o Puigmal sae en 5 actividades, quedará subido 5 veces. Repasa os cumes moi xuntos (agullas, gendarmes): pasar preto nin sempre quere dicir telos subido.</div>'
        : '<div class="empty">Non hai nada pendente de revisar.</div>'));
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-v]'); if (!b) return;
      if (b.dataset.v === 'all' || b.dataset.v === 'none') $$('#sheet input[data-a]').forEach(function (c) { c.checked = b.dataset.v === 'all'; });
      if (b.dataset.v === 'discard' && confirm('Descartar todas as actividades pendentes de revisar?')) { inbox = []; inbSave(); refreshBadge(); inboxSheet(); }
      if (b.dataset.v === 'apply') {
        var keepRoutes = $('#impRoutes').checked, n = 0, used = {};
        $$('#sheet input[data-a]').forEach(function (cb) {
          if (!cb.checked) return;
          var a = list.filter(function (x) { return String(x.aid) === cb.dataset.a; })[0], h = a.hits[+cb.dataset.h];
          used[a.aid] = a;
          if (addAscent(h.k, { d: a.d, s: 'arxiu', id: a.aid, n: a.n })) n++;
        });
        if (keepRoutes) Object.keys(used).forEach(function (id) {
          var a = used[id]; if (S.routes.some(function (r) { return String(r.sid) === String(a.aid); })) return;
          S.routes.push({ n: a.n, km: a.km, up: a.up || null, d: a.d, y: (a.d || '').slice(0, 4), sid: a.aid, c: Tracks.decodePolyline(a.poly) });
        });
        inbox = []; inbSave(); refreshBadge();
        save(); refreshAll(); closeSheet(); toast(n + ' ascensi' + (n === 1 ? 'ón engadida' : 'ons engadidas'));
        checkMedals(false);
      }
    };
  }

  // ---------- IMPORTAR CIMS I RUTES (fitxer .json preparat a l'ordinador) ----------
  // {type:'cims-import', ascents:[{k,d,id,n}], routes:[{n,km,up,d,y,sid,c}]}
  // Regles: la mateixa data no es compta dos cops; si un cim té alguna ascensió amb data, s'esborren les que no en tenen;
  // els cims sense data que no surten al fitxer es queden igual; rutes repetides (mateix id o mateix dia i distància) no s'afegeixen.
  function mergeImport(j) {
    var nA = 0, nSame = 0, nR = 0, nX = 0, cims = {};
    (j.ascents || []).forEach(function (x) {
      if (!x.k || !x.d || !cimInfo(x.k)) { nX++; return; }
      cims[x.k] = 1;
      var rec = S.done[x.k];
      if (!rec) { S.done[x.k] = { d: x.d, a: [{ d: x.d, s: x.s || 'strava', id: x.id || undefined, n: x.n }] }; nA++; return; }
      var a = ascList(rec).map(function (y) { return Object.assign({}, y); });
      var same = a.filter(function (y) { return y.d === x.d; })[0];
      if (same) { if (!same.id && x.id) { same.id = x.id; same.n = x.n; same.s = x.s || 'strava'; } nSame++; }
      else { a.push({ d: x.d, s: x.s || 'strava', id: x.id || undefined, n: x.n }); nA++; }
      rec.a = a;
    });
    var nU = 0;
    Object.keys(S.done).forEach(function (k) {
      var r = S.done[k], a = ascList(r);
      if (a.some(function (y) { return y.d; }) && a.some(function (y) { return !y.d; })) { r.a = a.filter(function (y) { return y.d; }); nU++; }
      if (r.a) { sortAsc(r.a); syncFirst(r); }
    });
    S.routes = S.routes || [];
    (j.routes || []).forEach(function (x) {
      if (S.routes.some(function (r) { return (r.sid && String(r.sid) === String(x.sid)) || (r.d && r.d === x.d && Math.abs((r.km || 0) - (x.km || 0)) <= Math.max(0.5, 0.15 * (x.km || 0))); })) return;
      S.routes.push(x); nR++;
    });
    var nP = 0, nPd = 0, nPo = 0, nPn = 0;
    (j.points || []).forEach(function (x) {
      if (x.ik) {
        // escalades / alpinisme / ferrades: sobreescriu el punt que ja hi era (mateix id i nom esperat) o el ja importat; si no n'hi ha, el crea
        var tg = S.points.filter(function (p) { return p.ik === x.ik; })[0] ||
          (x.ex ? S.points.filter(function (p) { return p.id === x.ex && (norm(p.n) === norm(x.exn || p.n) || (p.la != null && x.la != null && dist(p.la, p.lo, x.la, x.lo) < 1)); })[0] : null) ||
          (x.ex ? S.points.filter(function (p) { return !p.ik && (norm(p.n) === norm(x.exn || '-') || norm(p.n) === norm(x.n)) && (p.la == null || x.la == null || dist(p.la, p.lo, x.la, x.lo) < 2) && ['Escalades', 'Alpinisme', 'Ferrades', 'Internacionals'].indexOf(p.g) >= 0; })[0] : null);
        var isNewP = !tg;
        if (isNewP) { tg = { id: 'ie' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), g: x.g || 'Escalades', n: x.n, h: null, la: null, lo: null, d: '', nt: '', f: null }; S.points.push(tg); }
        tg.ik = x.ik; tg.cl = 1; tg.n = x.n;
        if (x.la != null && x.lo != null) { tg.la = x.la; tg.lo = x.lo; }
        if (x.h != null) tg.h = x.h;
        if (x.z) tg.z = x.z; else delete tg.z;
        if (x.nt && !tg.nt) tg.nt = x.nt;
        if (x.vs && x.vs.length) {
          tg.vs = x.vs;
          var dd = []; x.vs.forEach(function (v) { if (v.d && /^\d{4}-\d\d-\d\d$/.test(v.d) && dd.indexOf(v.d) < 0) dd.push(v.d); }); dd.sort();
          tg.d = dd[0] || ''; if (dd.length > 1) tg.ds = dd; else delete tg.ds;
        } else if (x.vs) { delete tg.vs; }
        if (isNewP) nPn++; else nPo++;
        return;
      }
      var ex = S.points.filter(function (p) { return p.id === x.id && norm(p.n) === norm(x.n); })[0] ||
        S.points.filter(function (p) { return norm(p.n) === norm(x.n) && (x.la == null || p.la == null || (Math.abs(p.la - x.la) < 0.003 && Math.abs(p.lo - x.lo) < 0.004)); })[0];
      if (!ex && !x.upd) ex = S.points.filter(function (p) { return p.la != null && x.la != null && Math.abs(p.la - x.la) < 0.0008 && Math.abs(p.lo - x.lo) < 0.001; })[0];
      if (ex) {
        var ch = false;
        var all = ptOwn(ex), n0 = all.length; (x.ds || (x.d ? [x.d] : [])).forEach(function (d) { if (all.indexOf(d) < 0) all.push(d); }); all.sort();
        if (all.length !== n0 || (!ex.d && all.length)) { ex.d = all[0]; if (all.length > 1) ex.ds = all; ch = true; }
        if (x.nt && !x.upd && !ex.nt) { ex.nt = x.nt; ch = true; }
        if (ch) nPd++;
        return;
      }
      if (x.upd) return;
      var np = Object.assign({}, x); delete np.upd; S.points.push(np); nP++;
    });
    var nAn = importAscNotes(j.ascNotes), nPh = importPtAlt(j.ptAlt); nPd += importPtDates(j.ptDates);
    return { nA: nA, nSame: nSame, nU: nU, nR: nR, nX: nX, nP: nP, nPd: nPd, nPo: nPo, nPn: nPn, nAn: nAn, nPh: nPh, nC: Object.keys(cims).length };
  }
  function pickImportJson() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.className = 'hidden';
    inp.onchange = function () {
      var f = inp.files[0]; inp.remove(); if (!f) return;
      f.text().then(function (t) {
        var j = JSON.parse(t);
        if (!j || j.type !== 'cims-import') throw new Error('Este ficheiro non é de importación de cumes');
        if (!confirm('Importar ' + (j.ascents || []).length + ' ascensións, ' + ((j.ascNotes || []).length || (j.ptDates || []).length ? 'notas, datas e altitudes pendentes, ' : '') + (j.routes || []).length + ' rutas' + ((j.points || []).length ? ' i ' + j.points.length + ' puntos' : '') + (j.src ? ' (' + j.src + ')' : '') + '?\n\nAs ascensións con data substituirán as marcas sen data do mesmo cume.' + ((j.points || []).some(function (x) { return x.ik; }) ? '\nOs puntos de escalada, alpinismo e vías ferratas que xa están substitúense polos datos do ficheiro.' : ''))) return;
        try { autoBkSave(true); } catch (e) { }
        var r = mergeImport(j);
        save(); refreshAll(); checkMedals(false);
        openSheet('<h3>Importación feita</h3><div class="kv"><b>Ascensións novas</b><span>' + r.nA + '</span><b>Xa estaban (mesmo día)</b><span>' + r.nSame + '</span><b>Cumes afectados</b><span>' + r.nC + '</span><b>Marcas sen data borradas</b><span>' + r.nU + '</span><b>Rutas novas</b><span>' + r.nR + '</span>' + (r.nP ? '<b>Puntos novos</b><span>' + r.nP + '</span>' : '') + (r.nPo ? '<b>Puntos actualizados</b><span>' + r.nPo + '</span>' : '') + (r.nPn ? '<b>Puntos novos (escalada)</b><span>' + r.nPn + '</span>' : '') + (r.nPd ? '<b>Puntos con data nova</b><span>' + r.nPd + '</span>' : '') + (r.nAn ? '<b>Notas engadidas</b><span>' + r.nAn + '</span>' : '') + (r.nPh ? '<b>Altitudes engadidas</b><span>' + r.nPh + '</span>' : '') + (r.nX ? '<b>Non recoñecidas</b><span>' + r.nX + '</span>' : '') + '</div>' +
          '<div class="detail">Fíxose unha copia automática antes de importar. Se volves importar o mesmo ficheiro non se duplica nada.</div><div class="btns"><button class="btn pri" onclick="document.getElementById(\'scrim\').click()">De acordo</button></div>');
      }).catch(function (e) { toast('Non se puido importar: ' + (e.message || e)); });
    };
    document.body.appendChild(inp); inp.click();
  }

  // ---------- ACTUALITZACIONS DE L'APP ----------
  // L'app descarrega del teu repositori de GitHub la versió nova del contingut (aquesta part web) i la fa servir
  // a la propera arrencada. Els teus dades no es toquen.
  var OTA_KEY = 'cimsOta.v1';
  var ota = (function () { try { return JSON.parse(localStorage.getItem(OTA_KEY)) || {}; } catch (e) { return {}; } })();
  if (ota.auto == null) ota.auto = true;
  function otaSave() { try { localStorage.setItem(OTA_KEY, JSON.stringify(ota)); } catch (e) { } }
  var otaRes = null, otaManual = false, curVer = null;
  function loadVersion() {
    return fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { curVer = j; return j; }).catch(function () { return null; });
  }
  function otaCheck(manual) {
    if (!NATIVE || !NATIVE.otaCheck) { webUpdateCheck(manual); return; }
    if (!ota.repo) { if (manual) otaSheet(); return; }
    otaManual = !!manual; otaRes = { state: 'checking' }; ota.last = Date.now(); otaSave();
    if (manual) otaSheet();
    NATIVE.otaCheck(ota.repo, ota.br || 'main', ota.tok || '');
    phSync(manual);
  }
  window.__otaDone = function (json) {
    try { otaRes = JSON.parse(json); } catch (e) { otaRes = { state: 'error', msg: 'resposta non válida' }; }
    if (otaRes.state === 'updated') toast('Hai unha versión nova da app (' + fmtVer(otaRes.v) + ')', 'Reiniciar', function () { NATIVE.otaRestart(); });
    else if (otaManual && otaRes.state === 'uptodate') toast('A app xa está ao día');
    else if (otaManual && otaRes.state === 'error') toast('Non se puido comprobar: ' + (otaRes.msg || ''));
    if (sheetOpen && $('#otaSheet')) otaSheet();
  };
  // ---- versió web (PWA): el service worker (sw.js) baixa la versió nova i l'app avisa ----
  var swReg = null, swApplying = false, swLast = 0, webReady = false;
  function webApply() {
    if (!swReg || !swReg.waiting) { location.reload(); return; }
    swApplying = true; flushSave();
    swReg.waiting.postMessage('skipWaiting');
  }
  function webOnReady() {
    webReady = true;
    toast('Hai unha versión nova da app', 'Actualizar', webApply);
    if (sheetOpen && $('#otaSheet')) otaSheet();
  }
  function webWatch(reg) {
    swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) webOnReady();
    reg.addEventListener('updatefound', function () {
      var w = reg.installing; if (!w) return;
      w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) webOnReady(); });
    });
  }
  function webSWStart() {
    if (NATIVE || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (swApplying) location.reload(); });
    navigator.serviceWorker.register('sw.js').then(webWatch).catch(function () { });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && swReg && Date.now() - swLast > 30 * 60 * 1000) { swLast = Date.now(); swReg.update().catch(function () { }); }
    });
    if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist().catch(function () { }); } catch (e) { } }
  }
  function webUpdateCheck(manual) {
    if (!swReg) { if (manual) toast('Agora non se pode comprobar (fai falta conexión e ter a app instalada)'); return; }
    swLast = Date.now();
    swReg.update().then(function () {
      if (swReg.waiting) { if (manual) webOnReady(); }
      else if (swReg.installing) { if (manual) toast('Descargando a versión nova…'); }
      else if (manual) toast('A app xa está ao día');
    }).catch(function () { if (manual) toast('Non se puido comprobar (sen conexión?)'); });
    if (manual) phSync(true);
  }
  function webSheet() {
    var v = curVer ? 'Versión ' + fmtVer(curVer.v) + (curVer.name ? ' · ' + esc(curVer.name) : '') : '';
    var p = phStatus();
    openSheet('<div id="otaSheet"></div><h3>Actualizacións da app</h3><div class="sub">' + v + '</div>' +
      (curVer && curVer.notes ? '<div class="detail">' + esc(curVer.notes) + '</div>' : '') +
      '<div class="detail">' + (webReady ? 'Hai unha versión nova descargada.' : 'As versións novas descárganse soas. Aplícanse ao volver abrir a app ou con «Actualizar agora».') + '</div>' +
      '<div class="detail"><b>Fotos:</b> ' + Object.keys(window.PHK || {}).length + ' cumes con foto' + (p.t ? ' · comprobado ' + fmtStamp(p.t) : '') + (p.err ? '<br>⚠ ' + esc(p.err) : '') + (phBusy ? '<br>Descargando…' : '') + '</div>' +
      '<div class="btns"><button class="btn pri" data-o="wcheck">Comprobar agora</button>' + (webReady ? '<button class="btn ok" data-o="wapply">Actualizar agora</button>' : '') + '<button class="btn" data-o="fotos">Volver descargar as fotos</button></div>');
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-o]'); if (!b) return;
      if (b.dataset.o === 'wcheck') webUpdateCheck(true);
      if (b.dataset.o === 'wapply') webApply();
      if (b.dataset.o === 'fotos') { phSync(true, true); setTimeout(otaSheet, 50); }
    };
  }
  function otaSheet() {
    if (!NATIVE) { webSheet(); return; }
    var st = otaRes ? ({ checking: 'Comprobando…', uptodate: 'Xa tes a última versión (no repositorio está a ' + (otaRes.v ? fmtVer(otaRes.v) : '?') + ').', updated: 'Versión nova descargada (' + fmtVer(otaRes.v) + '). Usarase cando volvas abrir a app, ou agora mesmo se reinicias.', bad: otaRes.msg, error: 'Error: ' + (otaRes.msg || '') })[otaRes.state] || '' : '';
    var v = curVer ? 'Versión ' + fmtVer(curVer.v) + (curVer.name ? ' · ' + esc(curVer.name) : '') : '';
    openSheet('<div id="otaSheet"></div><h3>Actualizacións da app</h3><div class="sub">' + v + '</div>' +
      (curVer && curVer.notes ? '<div class="detail">' + esc(curVer.notes) + '</div>' : '') +
      '<div class="field"><label>Repositorio de GitHub (usuario/nome)</label><input id="otaRepo" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="p. ex. jordi/cims-app" value="' + esc(ota.repo || '') + '"></div>' +
      '<div class="two"><div class="field"><label>Rama</label><input id="otaBr" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(ota.br || 'main') + '"></div>' +
      '<div class="field"><label>Token (só se é privado)</label><input id="otaTok" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(ota.tok || '') + '"></div></div>' +
      '<label class="trk-row"><input type="checkbox" id="otaAuto"' + (ota.auto ? ' checked' : '') + '><span class="body"><span class="nm">Comprobar soa ao abrir a app</span><span class="meta">Como moito unha vez cada hora; descarga só o que cambiou</span></span></label>' +
      (st ? '<div class="detail" id="otaSt">' + esc(st) + '</div>' : '') +
      (function () { var p = phStatus(); return '<div class="detail"><b>Fotos:</b> ' + Object.keys(window.PHK || {}).length + ' cumes con foto no móbil' + (p.t ? ' · comprobado ' + fmtStamp(p.t) : '') + (p.err ? '<br>⚠ ' + esc(p.err) : '') + (phBusy ? '<br>Descargando…' : '') + '</div>'; })() +
      '<div class="btns"><button class="btn pri" data-o="check">Gardar e comprobar agora</button><button class="btn" data-o="fotos">Volver descargar as fotos</button>' + (otaRes && otaRes.state === 'updated' ? '<button class="btn ok" data-o="restart">Reiniciar agora</button>' : '') + '</div>' +
      '<div class="detail">Se unha versión nova non arrinca ben, a app volve soa á anterior.</div>');
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-o]'); if (!b) return;
      if (b.dataset.o === 'check') {
        ota.repo = $('#otaRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
        ota.br = $('#otaBr').value.trim() || 'main'; ota.tok = $('#otaTok').value.trim(); ota.auto = $('#otaAuto').checked; otaSave();
        if (!/^[\w.-]+\/[\w.-]+$/.test(ota.repo)) { toast('Escribe o repositorio como usuario/nome'); return; }
        otaCheck(true);
      }
      if (b.dataset.o === 'restart') NATIVE.otaRestart();
      if (b.dataset.o === 'fotos') { phSync(true, true); setTimeout(otaSheet, 50); }
    };
  }
  function otaOnStart() {
    if (NATIVE && NATIVE.bootOk) { try { NATIVE.bootOk(); } catch (e) { } }
    loadVersion().then(function (j) {
      if (!j) return;
      var seen = 0; try { seen = +localStorage.getItem('cimsSeenVersion') || 0; } catch (e) { }
      if (seen && j.v > seen) toast('App actualizada á versión ' + fmtVer(j.v) + (j.notes ? ': ' + j.notes : ''));
      try { localStorage.setItem('cimsSeenVersion', j.v); } catch (e) { }
    });
    if (!NATIVE) setTimeout(webSWStart, 3000);
    if (NATIVE && ota.auto && ota.repo && Date.now() - (ota.last || 0) > 3600 * 1000) setTimeout(function () { otaCheck(false); }, 6000);
    else if ((!NATIVE || ota.repo) && (!Object.keys(window.PHK || {}).length || Date.now() - (phStatus().t || 0) > 3600 * 1000)) setTimeout(function () { phSync(false); }, 4000);
  }

  // ---------- llistes que es fan servir ----------
  function listsSheet() {
    openSheet('<h3>Listas que usas</h3><div class="sub">Só aparecen as listas, o mapa, o resumo e os fitos das que marques. Os cumes feitos das que desmarques non se borran.</div>' +
      LISTS.map(function (l) { return '<label class="trk-row"><input type="checkbox" data-ls="' + l[0] + '"' + (lsOn(l[0]) ? ' checked' : '') + '><span class="body"><span class="nm">' + esc(l[1]) + '</span><span class="meta">' + esc(l[2]) + '</span></span></label>'; }).join('') +
      '<div class="btns"><button class="btn pri" data-l="ok">Feito</button></div>');
    $('#sheet').onchange = function (e) {
      var c = e.target.closest('[data-ls]'); if (!c) return;
      var next = Object.assign({}, S.lists || {}); next[c.dataset.ls] = c.checked;
      if (!LISTS.some(function (l) { return next[l[0]] !== false; })) { c.checked = true; toast('Hai que deixar polo menos unha lista'); return; }
      S.lists = next; save(); refreshAll();
    };
    $('#sheet').onclick = function (e) { if (e.target.closest('[data-l=ok]')) closeSheet(); };
  }

  // ---------- menú / dades ----------
  function saveFile(name, mime, text) {
    if (NATIVE && NATIVE.saveFile) { NATIVE.saveFile(name, mime, text); return; }
    webSave(name, mime, new Blob([text], { type: mime }));
  }
  // al navegador: a l'iPhone s'obre el full de compartir (Desar a Fitxers, AirDrop, Dropbox...); si no, baixada normal
  function webSave(name, mime, blob) {
    function dl() { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); }
    if (IOS_TOUCH && navigator.canShare && window.File) {
      try {
        var f = new File([blob], name, { type: mime });
        if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(function (e) { if (!e || e.name !== 'AbortError') dl(); }); return; }
      } catch (e) { }
    }
    dl();
  }
  function b64(bytes) { var s = '', CH = 0x8000; for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); return btoa(s); }
  function saveFileBin(name, mime, bytes) {
    if (NATIVE && NATIVE.saveFileB64) { NATIVE.saveFileB64(name, mime, b64(bytes)); return; }
    webSave(name, mime, new Blob([bytes], { type: mime }));
  }
  function csvDone() {
    var rows = [['Llista', 'Cim', 'Altitud', 'Data', 'Notes', 'Ascensions', 'Datas das ascensións']];
    var ascCols = function (r) { var a = ascList(r); return [a.length, a.map(function (x) { return x.d ? fmtDate(x.d) : 'sen data'; }).join(' · ')]; };
    F.forEach(function (f) { var r = S.done['f:' + f.id]; if (r) rows.push(['100 Cims' + (f.e ? ' (essencial)' : ''), f.n, f.h, r.d || '', r.nt || ''].concat(ascCols(r))); });
    U.forEach(function (u) { var r = S.done['u:' + u.id]; if (r) rows.push(['3000 ' + (u.k === 'P' ? 'UIAA principal' : u.k === 'S' ? 'UIAA secundari' : 'català'), u.n, u.h, r.d || '', r.nt || ''].concat(ascCols(r))); });
    AL.forEach(function (a) { var r = S.done['a:' + a.id]; if (r) rows.push(['4000 Alps ' + (a.k === 'P' ? 'principal' : 'secundari'), a.n, a.h, r.d || '', r.nt || ''].concat(ascCols(r))); });
    SOS.forEach(function (s) { if (!s.f) { var r = S.done['s:' + s.id]; if (r) rows.push(['Sostre comarcal (' + s.com + ')', s.n, s.h, r.d || '', r.nt || ''].concat(ascCols(r))); } });
    S.points.forEach(function (p) { rows.push(['Punt: ' + (p.g || ''), p.n, p.h == null ? '' : p.h, p.d || '', p.nt || '']); });
    return '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';'); }).join('\n');
  }
  function themePref() { try { return localStorage.getItem('cimsTheme') || 'auto'; } catch (e) { return 'auto'; } }
  function themeName() { return { auto: 'automática', light: 'clara', dark: 'escura' }[themePref()]; }
  function setTheme(t) {
    try { if (t === 'auto') localStorage.removeItem('cimsTheme'); else localStorage.setItem('cimsTheme', t); } catch (e) { }
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    var dk = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var mt = document.querySelector('meta[name=theme-color]'); if (mt) mt.setAttribute('content', dk ? '#1B2B26' : '#2D5A4A');
  }
  if (window.matchMedia) try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (themePref() === 'auto') { refreshAll(); } }); } catch (e) { }
  var SHEET_UP = null; // pantalla d'un nivell amunt (el botó enrere hi torna abans de tancar la fulla)
  function subMenu(title, items) {
    openSheet('<button class="sh-back" data-m="menu">‹ Atrás</button><h3>' + title + '</h3>' +
      items.map(function (x) { return '<button class="menu-item" data-m="' + x[0] + '">' + x[1] + '<small>' + x[2] + '</small></button>'; }).join(''));
    $('#sheet').onclick = menuClick; SHEET_UP = openMenu;
  }
  // còpies automàtiques: en tancar l'app (passa a segon pla) es desa una instantània local; es guarden les 5 últimes
  var AUTOBK = 'cimsAutoBk.v1';
  // Les còpies automàtiques es guarden a IndexedDB (sense el límit de 5 MB). Si no està disponible, a localStorage com abans.
  var IDBP = null, bkList = null, bkIdb = null;
  function idb() {
    if (!IDBP) IDBP = new Promise(function (res, rej) {
      try { var r = indexedDB.open('cims', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; } catch (e) { rej(e); }
    });
    return IDBP;
  }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res, rej) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; }); }); }
  function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); }; }); }); }
  function autoBkLS() { try { return JSON.parse(localStorage.getItem(AUTOBK)) || []; } catch (e) { return []; } }
  var bkReady = idbGet('autoBk').then(function (L) {
    var old = autoBkLS();
    bkList = (L && L.length) ? L : old; bkIdb = true;
    if (old.length) return idbSet('autoBk', bkList).then(function () { try { localStorage.removeItem(AUTOBK); } catch (e) { } });
  }).catch(function () { bkIdb = false; bkList = null; });
  function autoBk() { return bkIdb ? (bkList || []) : autoBkLS(); }
  var AUTOCFG = 'cimsAutoCfg', AUTO_OPTS = [['close', 'Cada vez que se pecha a app'], ['day', 'Unha vez ao día'], ['week', 'Unha vez á semana'], ['month', 'Unha vez ao mes']];
  var AUTO_MS = { close: 0, day: 864e5, week: 6048e5, month: 2592e6 };
  function autoCfg() { try { var c = localStorage.getItem(AUTOCFG); return AUTO_MS[c] != null ? c : 'close'; } catch (e) { return 'close'; } }
  // ---- còpies en una carpeta del mòbil, fora de l'app (només amb l'APK nou: si no hi és, no fa res)
  var BK_KEEP = 10;
  function natBk() { return !!(NATIVE && NATIVE.writeBackup && NATIVE.backupFolder); }
  function bkFolder() { try { return natBk() ? (NATIVE.backupFolder() || '') : ''; } catch (e) { return ''; } }
  function bkFiles() { try { return JSON.parse(NATIVE.listBackups() || '[]').filter(function (f) { return /\.json$/i.test(f.n); }).sort(function (a, b) { return b.n < a.n ? -1 : 1; }); } catch (e) { return []; } }
  function bkFolderWrite(txt, t) {
    if (!bkFolder()) return false;
    var d = new Date(t || Date.now()), nm = 'cims-auto-' + ymd(d) + '_' + pad2(d.getHours()) + pad2(d.getMinutes()) + '.json', ok = false;
    try { ok = NATIVE.writeBackup(nm, txt); } catch (e) { }
    if (ok) bkFiles().filter(function (f) { return /^cims-auto-/.test(f.n); }).slice(BK_KEEP).forEach(function (f) { try { NATIVE.deleteBackup(f.n); } catch (e) { } });
    return ok;
  }
  window.__bkFolderDone = function (n) {
    var c = JSON.parse(JSON.stringify(S)); delete c._ts;
    toast(bkFolderWrite(JSON.stringify(c)) ? 'Copias no cartafol «' + n + '»' : 'Cartafol escollido, pero non se puido escribir nel');
    if (sheetOpen && $('#bkFolder')) autoSheet();
  };
  function autoBkSave(force) {
    try {
      var c = JSON.parse(JSON.stringify(S)); delete c._ts;
      var txt = JSON.stringify(c), sg = sig(txt), t = Date.now(), nd = Object.keys(S.done).length;
      if (!S.done || (!nd && !(S.points || []).length)) return; // no desar còpies buides
      var put = function () {
        var L = autoBk().slice();
        if (!force && L.length && (L[0].sg === sg || t - L[0].t < AUTO_MS[autoCfg()])) return;
        L.unshift({ t: t, sg: sg, n: nd, j: txt }); L = L.slice(0, 5);
        bkFolderWrite(txt, t);
        if (bkIdb) { bkList = L; idbSet('autoBk', L).catch(function () { }); return; }
        while (L.length) { try { localStorage.setItem(AUTOBK, JSON.stringify(L)); break; } catch (e) { L.pop(); } }
      };
      if (bkIdb === null) bkReady.then(put); else put();
    } catch (e) { }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) autoBkSave(); });
  window.addEventListener('pagehide', function () { autoBkSave(); });
  function bkFolderHtml() {
    var h = '<h4 class="st-h" id="bkFolder">Cartafol do móbil (fóra da app)</h4>';
    if (!natBk()) return h + '<div class="detail">Para gardar as copias tamén nun cartafol do móbil (p. ex. «Backup Cims app» na raíz), que non se borra se desinstalas a app, hai que instalar a versión nova da app (APK).</div>';
    var f = bkFolder();
    if (!f) return h + '<div class="detail">Escolle un cartafol do móbil (por exemplo a raíz da memoria). Crearase «Backup Cims app» e cada copia automática gardarase tamén alí. Gárdanse as ' + BK_KEEP + ' últimas.</div><button class="menu-item" data-m="bkpick">Escoller cartafol…<small>Só hai que facelo unha vez</small></button>';
    var L = bkFiles();
    return h + '<button class="menu-item" data-m="bkpick">Cartafol: ' + esc(f) + '<small>Toca para cambiala</small></button><button class="menu-item" data-m="bknow">Facer unha copia agora<small>No cartafol «' + esc(f) + '»</small></button>' +
      (L.length ? L.slice(0, 15).map(function (x) { return '<button class="menu-item" data-m="bkf:' + esc(x.n) + '">' + esc(x.n) + '<small>' + (x.s ? Math.round(x.s / 1024) + ' KB · ' : '') + 'toca para restaurala</small></button>'; }).join('') : '<div class="empty">Aínda non hai ningunha copia no cartafol.</div>');
  }
  function autoSheet() {
    var L = autoBk(), cfg = autoCfg();
    openSheet('<button class="sh-back" data-m="menu">‹ Atrás</button><h3>Copias automáticas</h3><div class="sub">Ao pechar a app (ou deixala en segundo plano) gárdase unha copia no móbil, se hai cambios e se xa toca segundo a frecuencia escollida. Gárdanse as 5 últimas. Se tes Dropbox conectado, tamén se sube a copia ao pechar.</div>' +
      '<h4 class="st-h">Frecuencia</h4>' + AUTO_OPTS.map(function (o) { return '<button class="menu-item' + (cfg === o[0] ? ' sel' : '') + '" data-m="acfg:' + o[0] + '">' + (cfg === o[0] ? '✓ ' : '') + o[1] + '</button>'; }).join('') +
      '<h4 class="st-h">Copias gardadas</h4>' +
      (L.length ? L.map(function (x, i) { return '<button class="menu-item" data-m="autor' + i + '">' + fmtStamp(x.t) + '<small>' + x.n + ' cumes feitos · toca para restaurala</small></button>'; }).join('') : '<div class="empty">Aínda non hai ningunha copia.</div>') +
      '<div class="detail">Estas copias están dentro da app: se desinstalas a app perdéronse. Por iso tamén convén gardalas nun cartafol do móbil, en Dropbox ou exportar a copia .json de cando en vez.</div>' +
      bkFolderHtml());
    SHEET_UP = openMenu;
    $('#sheet').onclick = function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      if (b.dataset.m === 'menu') { openMenu(); return; }
      var ac = /^acfg:(\w+)$/.exec(b.dataset.m); if (ac) { try { localStorage.setItem(AUTOCFG, ac[1]); } catch (er) { } autoSheet(); toast('Frecuencia cambiada'); return; }
      if (b.dataset.m === 'bkpick') { NATIVE.pickBackupFolder(); return; }
      if (b.dataset.m === 'bknow') { var cc = JSON.parse(JSON.stringify(S)); delete cc._ts; toast(bkFolderWrite(JSON.stringify(cc)) ? 'Copia gardada no cartafol' : 'Non se puido gardar no cartafol'); autoSheet(); return; }
      var fr = /^bkf:(.+)$/.exec(b.dataset.m);
      if (fr) {
        var raw = null; try { raw = NATIVE.readBackup(fr[1]); } catch (er) { }
        var sx = null; try { sx = JSON.parse(raw); } catch (er) { }
        if (!sx || typeof sx.done !== 'object' || !Array.isArray(sx.points)) { toast('Este ficheiro non é unha copia válida'); return; }
        if (!confirm('Restaurar «' + fr[1] + '»? Substitúe os datos actuais (gárdase unha copia antes).')) return;
        autoBkSave(true); S = sx; S.routes = S.routes || []; save(); refreshAll(); closeSheet(); toast('Copia restaurada'); return;
      }
      var mm = /^autor(\d)$/.exec(b.dataset.m); if (!mm) return;
      var x = L[+mm[1]]; if (!x || !confirm('Restaurar a copia do ' + fmtStamp(x.t) + '? Substitúe os datos actuais (gárdase unha copia antes).')) return;
      try { autoBkSave(true); var s = JSON.parse(x.j); S = s; S.routes = S.routes || []; save(); refreshAll(); closeSheet(); toast('Copia restaurada'); } catch (er) { toast('Non se puido restaurar'); }
    };
  }
  function openImport() {
    subMenu('Importar', [['arx', 'Historial (Garmin ou Strava)' + (inbox.length ? ' · <b class="pill">' + inbox.length + ' por revisar</b>' : ''), 'O arquivo ZIP con todas as túas actividades: detecta os cumes de cada saída'], ['trk', 'Track (GPX, FIT, KML, KMZ)', 'Detecta os cumes por onde pasaches e márcaos coa data da saída'], ['imd', 'Ficheiro de importación (.json)', 'Engade ou actualiza escaladas, alpinismo e vías ferratas sen borrar o resto'], ['imp', 'Copia de seguridade (.json)', 'Substitúe os datos actuais polos do ficheiro']]
      .concat(dbxOn() ? [['dbxget', 'Dropbox: restaurar a última copia', 'Substitúe os datos do móbil polos de Dropbox']] : []));
  }
  function openExport() {
    subMenu('Exportar', (dbxOn()
      ? [['dbxnow', 'Dropbox: facer copia agora', 'Copia automática activada · última: ' + fmtStamp(dbx.last) + (dbx.err ? ' · error: ' + esc(dbx.err) : '')], ['dbxoff', 'Dropbox: desconectar', 'As copias que xa hai quedan en Dropbox']]
      : [['dbxcon', 'Conectar Dropbox', 'Copia automática (copia .json, Excel de seguimento e KMZ para Google Earth) cando cambias algo']])
      .concat([['kmz', 'Google Earth (KMZ)', 'Os teus puntos, cumes feitos, pendentes e rutas'], ['xlsx', 'Excel de seguimento', 'O mesmo Excel que se garda en Dropbox'], ['csv', 'Listado de feitos (CSV)', 'Para abrir con Excel'], ['exp', 'Copia de seguridade (.json)', 'Todo o progreso e os puntos']]));
  }
  function openMenu() {
    SHEET_UP = null; FROM_MENU = true;
    openSheet('<h3>Configuración</h3><div class="sub">O progreso gárdase no móbil automaticamente. Fai copias de cando en vez.</div>' +
      '<button class="menu-item" data-m="mimp">Importar' + (inbox.length ? ' · <b class="pill">' + inbox.length + ' por revisar</b>' : '') + '<small>Historial de Garmin ou Strava, tracks e copia de seguridade</small></button>' +
      '<button class="menu-item" data-m="mexp">Exportar<small>Dropbox, Google Earth, Excel, CSV e copia de seguridade</small></button>' +
      '<button class="menu-item" data-m="auto">Copias automáticas do móbil<small>Fanse soas ao pechar a app · ' + (autoBk().length ? autoBk().length + ' gardadas' : 'ningunha aínda') + '</small></button>' +
      '<button class="menu-item" data-m="theme">Aparencia: ' + themeName() + '<small>Automático (segue o móbil), claro ou escuro. Toca para cambialo.</small></button>' +
      '<button class="menu-item" data-m="lists">Listas que usas<small>' + LISTS.filter(function (l) { return lsOn(l[0]); }).map(function (l) { return l[1]; }).join(' · ') + '</small></button>' +
      '<button class="menu-item" data-m="zero">Comezar de cero<small>Todo sen marcar e sen puntos</small></button>' +
      '<button class="menu-item" data-m="ota">Actualizacións da app<small>' + (curVer ? 'Versión ' + fmtVer(curVer.v) + ' · ' : '') + (!NATIVE ? 'descárganse soas' : ota.repo ? 'desde ' + esc(ota.repo) : 'sen configurar') + '</small></button>' +
      '<button class="menu-item" data-m="about">Fontes das listas</button>');
    $('#sheet').onclick = menuClick; MENU_SHOWN = true;
  }
  function menuClick(e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      var m = b.dataset.m;
      if (m === 'menu') { openMenu(); return; }
      if (m === 'mimp') { openImport(); return; }
      if (m === 'mexp') { openExport(); return; }
      if (m === 'auto') { autoSheet(); return; }
      if (m === 'dbxcon') dbxConnectSheet();
      if (m === 'dbxnow') { toast('Gardando en Dropbox…'); cloudBackup(true).then(function () { if (sheetOpen) openExport(); }); }
      if (m === 'dbxoff' && confirm('Desconectar Dropbox? As copias que xa hai quedan en Dropbox.')) { dbx = {}; dbxSave(); openExport(); toast('Dropbox desconectado'); }
      if (m === 'dbxget') {
        dbxDownload(DBX_FILE).then(function (txt) {
          var s = JSON.parse(txt);
          if (!s || typeof s.done !== 'object' || !Array.isArray(s.points)) throw new Error('A copia de Dropbox non é válida');
          if (!confirm('Substituír os datos do móbil pola copia de Dropbox?')) return;
          S = s; S.routes = S.routes || []; save(); refreshAll(); closeSheet(); toast('Copia de Dropbox restaurada');
        }).catch(function (e) { toast(String(e.message || e)); });
      }
      if (m === 'theme') { var cur = themePref(), nx = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto'; setTheme(nx); openMenu(); renderFites && view === 'fites' && renderFites(); renderResum(); }
      if (m === 'lists') listsSheet();
      if (m === 'arx') { if (inbox.length && !imp.busy) inboxSheet(); else importSheet(); }
      if (m === 'ota') { loadVersion().then(otaSheet); }
      if (m === 'trk') { closeSheet(); $('#trackIn').click(); }
      if (m === 'kmz') { closeSheet(); toast('Xerando o KMZ…'); window.buildKmz(S).then(function (b) { saveFileBin('Cims-' + today() + '.kmz', 'application/vnd.google-earth.kmz', b); }).catch(function (e) { toast('Error: ' + e.message); }); }
      if (m === 'xlsx') { closeSheet(); toast('Xerando o Excel…'); window.buildXlsx(S).then(function (b) { saveFileBin('Cims_seguiment-' + today() + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', b); }).catch(function (e) { toast('Error: ' + e.message); }); }
      if (m === 'exp') saveFile('cims-copia-' + today() + '.json', 'application/json', JSON.stringify(S));
      if (m === 'csv') saveFile('cims-fets-' + today() + '.csv', 'text/csv', csvDone());
      if (m === 'imd') pickImportJson();
      if (m === 'imp') $('#fileIn').click();
      if (m === 'zero' && confirm('1/3 · Comezar de cero borrará TODOS os cumes marcados, as ascensións, os puntos e as rutas. Queres continuar?')
        && confirm('2/3 · Seguro? Se non tes unha copia de seguridade, non se poderá recuperar nada.')
        && confirm('3/3 · Última confirmación: borrar todo agora?')) { S = emptyState(); save(); refreshAll(); checkMedals(true); closeSheet(); toast('Todo borrado. Comezas de cero'); }
      if (m === 'about') openSheet('<h3>Fontes</h3><div class="detail" style="font-size:14px;color:var(--ink)">' +
        '<p><b>100 Cims:</b> 522 cumes da FEEC (150 esenciais), datos de feec.cat. Para superar o reto fan falta 100 esenciais; despois contan todos os cumes para os retos 2×100, 3×100…</p>' +
        '<p><b>3000 do Pirineo:</b> listado Buyse «Los tresmiles del Pirineo» revisado: ' + N_P + ' principais e ' + N_S + ' secundarios, máis 1 tresmil catalán fóra da lista. Altitudes: SITAR; se non hai, ICGC; se non, IGN; e se non, Buyse.</p>' +
        '<p><b>3000 catalás:</b> lista de cumes de máis de 3000 metros de Cataluña, con altitudes do ICGC.</p>' +
        '<p><b>Teitos comarcais:</b> lista dos cumes máis altos de cada comarca.</p>' +
        '<p><b>Fotos:</b> embaixo de cada foto indícase a fonte. As dos 100 Cims son da FEEC (feec.cat) e pertencen aos seus autores; non se usan con fins comerciais. O resto de cumes (3000, 4000 e teitos) levan fotos da Wikipedia / Wikimedia Commons, coa licenza dos seus autores; os cumes sen foto fiable non levan ningunha.</p>' +
        '<p><b>Mapa de comarcas:</b> xeometrías do IGN (2024); Cataluña Norte a partir dos municipios do IGN francés (france-geojson) e Andorra de geoBoundaries.</p></div>');
  }
  $('#fileIn').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { var s = JSON.parse(r.result); if (!s || typeof s.done !== 'object' || !Array.isArray(s.points)) throw 0;
        if (!confirm('Substituír os datos actuais polos da copia?')) return;
        S = s; S.routes = S.routes || []; save(); refreshAll(); closeSheet(); toast('Copia importada');
      } catch (e) { toast('O ficheiro non é unha copia válida'); }
    };
    r.readAsText(f); this.value = '';
  });

  // ---------- FITES: medalles i estadístiques ----------
  function sosKey(x) { return x.f ? 'f:' + x.f : 's:' + x.id; }
  function sosKeys() { return SOS.filter(function (x) { return isDone(sosKey(x)); }).map(sosKey); }
  // data de la medalla de sostres: el dia que s'arriba a N comarques
  function sosAward(n) {
    var ds = SOS.filter(function (x) { return S.done[sosKey(x)]; }).map(function (x) { return S.done[sosKey(x)].d || ''; });
    ds.sort(function (p, q) { return !p ? 1 : !q ? -1 : p < q ? -1 : p > q ? 1 : 0; });
    return function () { return ds[n - 1] || today(); };
  }
  // data de la medalla de comarca: el dia que s'arriba a N cims de la comarca
  function comAward(c, n) {
    var ds = F.filter(function (f) { return f.c === c && S.done['f:' + f.id]; }).map(function (f) { return S.done['f:' + f.id].d || ''; });
    ds.sort(function (p, q) { return !p ? 1 : !q ? -1 : p < q ? -1 : p > q ? 1 : 0; });
    return function () { return ds[n - 1] || today(); };
  }
  // títols (els de la imatge) i subtítols de les medalles especials
  var MTITLE = {
    c50: ['Debutante', '50 cumes'], c100: ['Principiante experimentado', '100 cumes'], c150: ['Imparable', '150 cumes'], c200: ['Incombustible', '200 cumes'], c250: ['Rebezo', '250 cumes'],
    c300: ['Fóra de serie', '300 cumes'], c350: ['Quebraosos', '350 cumes'], c400: ['Xeógrafo experimentado', '400 cumes'], c450: ['Aventureiro extremo', '450 cumes'], c500: ['Só 22 cumes máis...', '500 cumes'],
    call: ['E agora... que?', 'todos os 522'], e100: ['A aventura continúa', '100 esenciais'], eall: ['Esenciais no peto', '150 esenciais'],
    u1: ['Bautismo no Pirineo', 'primeiro 3000'], up: ['Pirineísta', N_P + ' principais'], uall: ['Lenda do Pirineo', (N_P + N_S) + ' 3000'], cat: ['Cataluña aos teus pés', 'vigents'],
    a50: ['Primeiro 4000', 'dos Alpes'], ahalf: ['Veteranía alpina', 'metade dos 4000'], aall: ['Coroa alpina', 'todos os 4000'], agol: ['Larpeiro de altura', 'máis dun 4000 nun día'], dia3000: ['Larpeiro', 'máis dun 3000 nun día']
  };
  // medalles «més d'un en un mateix dia»
  function dayMedal(id, name, sub, ls, doneKeys, ic) {
    var byDay = {}; doneKeys().forEach(function (k) { ascList(S.done[k]).forEach(function (x) { if (x.d) (byDay[x.d] = byDay[x.d] || {})[k] = 1; }); });
    var gd = Object.keys(byDay).filter(function (d) { return Object.keys(byDay[d]).length > 1; }).sort(), gmax = Object.keys(byDay).reduce(function (m, d) { return Math.max(m, Object.keys(byDay[d]).length); }, 0);
    return { id: id, cat: 'Especials', ls: ls, name: name, sub: sub, cur: Math.min(gmax, 2), tot: 2, ic: ic, tier: 'gold', awardDate: function () { return gd[0] || today(); }, lim: 99,
      keys: function () { var o = {}; gd.forEach(function (d) { Object.keys(byDay[d]).forEach(function (k) { o[k] = 1; }); }); return Object.keys(o); } };
  }
  function medalDefs() {
    var st = stats(), out = [];
    var NF = F.length;
    var fDone = function (fn) { return F.filter(function (f) { return isDone('f:' + f.id) && (!fn || fn(f)); }).map(function (f) { return 'f:' + f.id; }); };
    var uDone = function (fn) { return U.filter(function (u) { return u.k !== 'X' && isDone('u:' + u.id) && (!fn || fn(u)); }).map(function (u) { return 'u:' + u.id; }); };
    var aDone = function () { return AL.filter(function (a) { return isDone('a:' + a.id); }).map(function (a) { return 'a:' + a.id; }); };
    var NA = AL.length, half = Math.ceil(NA / 2), at = st.ap + st.as;
    if (NA) {
      out.push({ id: 'a50', cat: '4000 Alps', ls: 'alps', name: 'Primeiro 4000', sub: 'dos Alpes', cur: at, tot: 1, ic: '❄️', tier: 'silver', keys: aDone, lim: 1 });
      out.push({ id: 'ahalf', cat: '4000 Alps', ls: 'alps', name: 'Metade dos 4000', sub: half + ' de ' + NA, cur: at, tot: half, ic: '⛏️', tier: 'gold', keys: aDone, lim: half });
      out.push({ id: 'aall', cat: '4000 Alps', ls: 'alps', name: 'Todos os 4000', sub: 'os ' + NA + ' dos Alpes', cur: at, tot: NA, ic: '👑', tier: 'gold', keys: aDone });
    }
    out.push({ id: 'e100', cat: '100 Cims', ls: 'feec', name: 'Reto 100 Cims', sub: '100 esenciais', cur: st.ess, tot: 100, ic: '🎖️', tier: 'gold', keys: function () { return fDone(function (f) { return f.e; }); }, lim: 100, top: 1 });
    out.push({ id: 'eall', cat: '100 Cims', ls: 'feec', name: '100% esenciais', sub: 'os ' + N_ESS + ' esenciais', cur: st.ess, tot: N_ESS, ic: '💎', tier: 'gold', keys: function () { return fDone(function (f) { return f.e; }); }, top: 2 });
    for (var n = 50; n <= NF; n += 50) out.push({ id: 'c' + n, cat: '100 Cims', ls: 'feec', name: n + ' cumes', sub: 'da lista FEEC', cur: st.tot, tot: n, ic: n % 100 === 0 ? '🏆' : '⛰️', tier: n % 100 === 0 ? 'gold' : 'silver', keys: function () { return fDone(); }, lim: n });
    if (NF % 50) out.push({ id: 'call', cat: '100 Cims', ls: 'feec', name: 'Todos os ' + NF, sub: 'a lista enteira', cur: st.tot, tot: NF, ic: '👑', tier: 'gold', keys: function () { return fDone(); } });
    Object.keys(st.byCom).sort(function (a, b) { return a.localeCompare(b, 'ca'); }).forEach(function (c) {
      var x = st.byCom[c];
      if (x.e) out.push({ id: 'ce:' + c, cat: 'Comarques', ls: 'feec', name: c, sub: 'essencials', cur: x.ed, tot: x.e, ic: '🥈', tier: 'silver', keys: function () { return fDone(function (f) { return f.c === c && f.e; }); } });
      out.push({ id: 'ca:' + c, cat: 'Comarques', ls: 'feec', name: c, sub: 'comarca enteira', cur: x.d, tot: x.n, ic: '🥇', tier: 'gold', keys: function () { return fDone(function (f) { return f.c === c; }); } });
    });
    // comarques: dues sèries (comarques amb tots els essencials / comarques senceres), cadascuna al 25, 50, 75 i 100%
    (function () {
      var cn = Object.keys(st.byCom), ser = [
        { id: 'ces', name: 'Comarcas cos esenciais', ok: function (x) { return x.e && x.ed >= x.e; }, elig: function (x) { return x.e > 0; }, prog: function (x) { return x.ed + '/' + x.e; }, fr: function (x) { return x.ed / x.e; }, need: function (f) { return f.e; }, ic: '🥈' },
        { id: 'cco', name: 'Comarcas enteiras', ok: function (x) { return x.n && x.d >= x.n; }, elig: function (x) { return x.n > 0; }, prog: function (x) { return x.d + '/' + x.n; }, fr: function (x) { return x.d / x.n; }, need: function () { return true; }, ic: '🥇' }
      ];
      ser.forEach(function (sr) {
        var el = cn.filter(function (c) { return sr.elig(st.byCom[c]); }), nd = el.filter(function (c) { return sr.ok(st.byCom[c]); }).length, N = el.length;
        if (!N) return;
        // data en què es completa cada comarca: la del darrer cim necessari (primera vegada)
        var cd = el.filter(function (c) { return sr.ok(st.byCom[c]); }).map(function (c) {
          var d = ''; F.forEach(function (f) { if (f.c !== c || !sr.need(f)) return; var r = S.done['f:' + f.id], x = r && r.d || ''; if (!x) d = d || ''; else if (x > d) d = x; }); return d;
        }).sort(function (p, q) { return !p ? 1 : !q ? -1 : p < q ? -1 : p > q ? 1 : 0; });
        var byT = {}; [25, 50, 75, 100].forEach(function (p) { byT[Math.ceil(N * p / 100)] = p; });
        Object.keys(byT).forEach(function (t) {
          var p = byT[t], tt = +t;
          out.push({ id: sr.id + p, cat: 'Comarques', ls: 'feec', name: sr.name, sub: p + '% · ' + tt + ' de ' + N, pct: p, comSeries: sr.name, cur: nd, tot: tt, ic: sr.ic, tier: p >= 75 ? 'gold' : 'silver', awardDate: function () { return cd[tt - 1] || today(); },
            keys: function () { return []; },
            list: function () {
              var ok = el.filter(function (c) { return sr.ok(st.byCom[c]); }), pe = el.filter(function (c) { return !sr.ok(st.byCom[c]); }).sort(function (u, v) { return sr.fr(st.byCom[v]) - sr.fr(st.byCom[u]); });
              return { ok: ok.map(function (c, i) { return { n: c, r: sr.prog(st.byCom[c]) }; }), pend: pe.map(function (c) { return { n: c, r: sr.prog(st.byCom[c]) }; }) };
            } });
        });
      });
    })();
    Object.keys(st.byZone).forEach(function (z) {
      var x = st.byZone[z];
      if (x.p) out.push({ id: 'zp:' + z, cat: 'Sectores 3000', ls: 'uiaa', name: zl(z), sub: 'principals', cur: x.pd, tot: x.p, ic: '🥈', tier: 'silver', keys: function () { return uDone(function (u) { return u.z === z && u.k === 'P'; }); } });
      var top = U.filter(function (u) { return u.z === z && u.k !== 'X'; }).sort(function (a, b) { return b.h - a.h; })[0];
      if (top) out.push({ id: 'zt:' + z, cat: 'Sectores 3000', ls: 'uiaa', name: top.n.replace(/\s*\(.*\)/, ''), sub: fmtAlt(top.h), cur: isDone('u:' + top.id) ? 1 : 0, tot: 1, ic: '⛰️', tier: 'gold', top: top, keys: function () { return isDone('u:' + top.id) ? ['u:' + top.id] : []; } });
      if (x.s) out.push({ id: 'za:' + z, cat: 'Sectores 3000', ls: 'uiaa', name: zl(z), sub: 'sector enteiro', cur: x.pd + x.sd, tot: x.p + x.s, ic: '🥇', tier: 'gold', keys: function () { return uDone(function (u) { return u.z === z; }); } });
    });
    out.push({ id: 'u1', cat: 'Especials', ls: 'uiaa', name: 'Bautismo no Pirineo', sub: 'do Pirineo', cur: st.p + st.s, tot: 1, ic: '❄️', tier: 'silver', keys: function () { return uDone(); }, lim: 1 });
    out.push({ id: 'up', cat: 'Especials', ls: 'uiaa', name: 'Pirineísta', sub: N_P + ' tresmiles', cur: st.p, tot: N_P, ic: '🏔️', tier: 'gold', keys: function () { return uDone(function (u) { return u.k === 'P'; }); } });
    out.push({ id: 'uall', cat: 'Especials', ls: 'uiaa', name: 'Lenda do Pirineo', sub: (N_P + N_S) + ' do Pirineo', cur: st.p + st.s, tot: N_P + N_S, ic: '👑', tier: 'gold', keys: function () { return uDone(); } });
    out.push({ id: 'cat', cat: 'Especials', ls: 'cat', name: 'Tresmiles catalás', sub: CAT_VIG.length + ' vixentes', cur: st.cat, tot: CAT_VIG.length, ic: '🏴', tier: 'gold', keys: function () { return CAT_VIG.filter(function (c) { return isDone('u:' + c.ref); }).map(function (c) { return 'u:' + c.ref; }); } });
    out.push(dayMedal('dia3000', 'Larpeiro', 'máis dun 3000 nun día', 'uiaa', uDone, '🔥'));
    out.push(dayMedal('dia100', 'Máis dun cume nun día', 'lista 100 Cims FEEC', 'feec', fDone, '🔥'));
    out.push(dayMedal('agol', 'Larpeiro de altura', 'máis dun 4000 nun día', 'alps', aDone, '🔥'));
    out.push({ id: 'sos', cat: 'Sostres', ls: 'sos', name: 'Todos os teitos', sub: SOS.length + ' teitos', cur: st.sos, tot: SOS.length, ic: '🗻', tier: 'gold', awardDate: sosAward(SOS.length), keys: sosKeys });
    [25, 50, 75].forEach(function (p) {
      var tt = Math.ceil(SOS.length * p / 100);
      out.push({ id: 'sos' + p, cat: 'Sostres', ls: 'sos', name: p + '% dos teitos', sub: tt + ' de ' + SOS.length + ' comarcas', cur: st.sos, tot: tt, ic: '🗻', tier: p === 75 ? 'gold' : 'silver', awardDate: sosAward(tt), keys: sosKeys });
    });
    out.forEach(function (m) {
      var t = MTITLE[m.id]; if (t) m.name = t[0];
      m.badge = badgeOf(m); if (t) m.badge.name = t[0];
      var sb = subOf(m); if (sb) { m.sub = sb; m.badge.sub = sb; }
    });
    return out;
  }
  // subtítol curt de cada medalla (el que surt sota el nom): la xifra que cal assolir
  function subOf(m) {
    var id = m.id, p = id.split(':')[0], n = m.tot;
    if (/^c\d+$/.test(id) || id === 'call') return n + ' cumes';
    if (id === 'e100') return '100 esenciais';
    if (id === 'eall') return n + ' esenciais';
    if (p === 'ce') return n + (n === 1 ? ' esencial' : ' esenciais');
    if (p === 'ca') return n + (n === 1 ? ' cume' : ' cumes');
    if (p === 'zp') return n + ' principais';
    if (p === 'za') return n + ' tresmiles';
    if (id === 'u1') return '1 tresmil';
    if (id === 'up') return n + ' principais';
    if (id === 'uall') return n + ' tresmiles';
    if (id === 'cat') return n + ' vixentes';
    if (id === 'a50') return '1 catromil';
    if (id === 'ahalf' || id === 'aall') return n + ' catromiles';
    if (id === 'agol') return 'Máis dun 4000';
    if (id === 'dia3000') return 'Máis dun 3000';
    if (id === 'dia100') return 'Cumes da lista';
    if (id === 'sos' || /^sos\d+$/.test(id)) return n + ' comarcas';
    return '';
  }
  function badgeOf(m) {
    var id = m.id, p = id.split(':')[0], z = id.slice(3), zn = z.split(' · ');
    var B = { key: id, name: m.name, sub: m.sub, kind: 'green' };
    if (id === 'e100') { B.name = 'Reto 100'; B.sub = '100 esenciais'; B.ring = 2; }
    else if (id === 'eall') { B.name = '100% esenciais'; B.sub = N_ESS + ' esenciais'; B.ring = 4; }
    else if (/^c\d+$/.test(id)) { B.name = id.slice(1) + ' cumes'; B.sub = '100 Cims FEEC'; B.kind = +id.slice(1) % 100 ? 'green' : 'flowers'; }
    else if (id === 'call') { B.name = 'Todos ' + F.length; B.sub = '100 Cims FEEC'; B.ring = 2; }
    else if (m.comSeries) { B.name = m.comSeries; B.sub = m.sub; B.kind = 'flowers'; if (m.pct === 100) B.ring = 2; }
    else if (p === 'ce' || p === 'ca') { B.name = z; B.sub = p === 'ce' ? 'essencials' : 'comarca enteira'; B.kind = hashK(z) ? 'flowers' : 'green'; }
    else if (p === 'zp' || p === 'za') { B.name = zl(z); B.sub = p === 'zp' ? 'principals' : 'sector enteiro'; B.kind = 'snow'; }
    else if (p === 'zt') { B.name = m.top.n.replace(/\s*\(.*\)/, ''); B.sub = fmtAlt(m.top.h); B.kind = 'snow'; }
    else if (id === 'a50') { B.name = 'Primeiro 4000'; B.sub = 'dos Alpes'; B.kind = 'alps'; }
    else if (id === 'dia3000') { B.name = 'Larpeiro'; B.sub = 'máis dun 3000 nun día'; B.kind = 'snow'; }
    else if (id === 'dia100') { B.name = 'Máis dun cume nun día'; B.sub = '100 Cims FEEC'; B.kind = 'green'; }
    else if (id === 'agol') { B.name = 'Larpeiro de altura'; B.sub = 'máis dun 4000 nun día'; B.kind = 'alps'; }
    else if (id === 'ahalf') { B.name = 'Metade 4000'; B.sub = m.sub; B.kind = 'alps'; }
    else if (id === 'aall') { B.name = 'Todos os 4000'; B.sub = AL.length + ' catromiles'; B.kind = 'alps'; B.ring = 2; }
    else if (id === 'u1') { B.name = 'Bautismo no Pirineo'; B.sub = 'do Pirineo'; B.kind = 'snow'; }
    else if (id === 'up') { B.name = 'Pirineísta'; B.sub = N_P + ' do Pirineo'; B.kind = 'snow'; }
    else if (id === 'uall') { B.name = 'Lenda do Pirineo'; B.sub = (N_P + N_S) + ' do Pirineo'; B.kind = 'snow'; B.ring = 2; }
    else if (id === 'cat') { B.name = '3000 catalás'; B.sub = CAT_VIG.length + ' vixentes'; B.kind = 'snow'; }
    else if (id === 'sos') { B.name = '100% teitos'; B.sub = SOS.length + ' comarcas'; B.ring = 2; }
    else if (/^sos\d+$/.test(id)) { B.name = id.slice(3) + '% teitos'; B.sub = m.sub; }
    return B;
  }
  function hashK(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h & 3) === 0; }
  window.__medalList = function () { return medalDefs().map(function (m) { return { id: m.id, cat: m.cat, name: m.badge.name, sub: m.badge.sub, mname: m.name, tot: m.tot, tier: m.tier, ls: m.ls }; }); };
  function checkMedals(silent) {
    var defs = medalDefs(), first = !S.medals, changed = false, fresh = [];
    if (first) { S.medals = {}; silent = true; }
    var ids = {}; defs.forEach(function (m) { ids[m.id] = 1; });
    Object.keys(S.medals).forEach(function (k) { if (!ids[k]) { delete S.medals[k]; changed = true; } });
    defs.forEach(function (m) {
      var ok = m.cur >= m.tot;
      if (ok && !S.medals[m.id]) { S.medals[m.id] = m.awardDate ? m.awardDate() : today(); changed = true; fresh.push(m); }
      if (!ok && S.medals[m.id]) { delete S.medals[m.id]; changed = true; }
    });
    if (changed || first) save();
    fresh = fresh.filter(function (m) { return lsOn(m.ls); });
    if (!silent && fresh.length) celebrate(fresh);
    if (changed && view === 'fites') renderFites();
  }
  function celebrate(list) {
    var el = $('#celebrate'), conf = '';
    var cols = ['#F6C445', '#8FD3A8', '#A9C8F0', '#F2A7B5', '#C9B6F2', '#F7B98B'];
    for (var i = 0; i < 40; i++) conf += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * .8).toFixed(2) + 's;animation-duration:' + (1.8 + Math.random() * 1.4).toFixed(2) + 's"></i>';
    var m = list[list.length - 1];
    el.innerHTML = '<div class="confetti">' + conf + '</div><div class="cel-card">' +
      '<div class="cel-ic">' + MedalIcon(m, { size: 104, done: true }) + '</div><div class="cel-t">Nova medalla!</div>' +
      '<div class="cel-n">' + esc(m.name) + '</div><div class="cel-s">' + esc(m.sub) + ' · ' + m.tot + '/' + m.tot + '</div>' +
      (list.length > 1 ? '<div class="cel-more">I ' + (list.length - 1) + ' medalla' + (list.length > 2 ? 's' : '') + ' máis: ' + list.slice(0, -1).map(function (x) { return esc(x.name); }).join(', ') + '</div>' : '') +
      '<button class="btn ok" id="celOk">Xenial!</button> <button class="btn" id="celSee">Ver fitos</button></div>';
    el.classList.remove('hidden');
    $('#celOk').onclick = function () { el.classList.add('hidden'); };
    $('#celSee').onclick = function () { el.classList.add('hidden'); closeSheet(); showView('fites'); };
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 120]); } catch (e) { }
  }

  // mapa de comarques (SVG), es construeix un sol cop
  var comMap = null;
  function buildComMap() {
    var C = window.COMARQUES || [], mnX = 1e9, mxX = -1e9, mnY = 1e9, mxY = -1e9, k = Math.cos(41.7 * Math.PI / 180);
    function each(geom, fn) { (geom[1] === 'Polygon' ? [geom[2]] : geom[2]).forEach(function (poly) { poly.forEach(function (ring) { fn(ring); }); }); }
    C.forEach(function (g) { each(g, function (r) { r.forEach(function (p) { var x = p[0] * k, y = -p[1]; if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y; }); }); });
    var W = 1000, sc = W / (mxX - mnX), H = Math.round((mxY - mnY) * sc);
    var paths = C.map(function (g) {
      var d = '';
      each(g, function (r) { d += 'M' + r.map(function (p) { return ((p[0] * k - mnX) * sc).toFixed(1) + ',' + ((-p[1] - mnY) * sc).toFixed(1); }).join('L') + 'Z'; });
      return { n: g[0], d: d };
    });
    comMap = { W: W, H: H, paths: paths };
  }
  function heat(fr) { // 0 -> gris lila clar, 1 -> verd
    var a = [236, 232, 245], b = [61, 157, 99];
    if (fr == null) return '#D3D3D3';
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * fr); }).join(',') + ')';
  }
  var fitesCat = '', fitesAll = false, openMedal = null, fitesDoneOpen = false;
  function sosInfo(k) { if (k.slice(0, 2) !== 's:') return null; var x = SOS.filter(function (y) { return 's:' + y.id === k; })[0]; return x && { n: x.n, h: x.h }; }
  function nxmDots() {
    var c = $('#nxmCar'), d = document.querySelectorAll('.nxm-dots i'); if (!c || !d.length) return;
    c.addEventListener('scroll', function () { var i = Math.round(c.scrollLeft / c.clientWidth); d.forEach(function (x, j) { x.classList.toggle('on', i === j); }); }, { passive: true });
  }
  function renderFites() {
    var el = $('#v-fites'); if (!el) return;
    var st = stats(), defs = medalDefs().filter(function (m) { return lsOn(m.ls); }), med = S.medals || {};
    var got = defs.filter(function (m) { return med[m.id]; }).length;
    // --- medalles
    var cats = ['100 Cims', 'Comarques', 'Sectores 3000', '4000 Alps', 'Sostres', 'Especials'].filter(function (c) { return defs.some(function (m) { return m.cat === c; }); });
    if (cats.indexOf(fitesCat) < 0) fitesCat = cats[0] || '';
    var all = defs.filter(function (m) { return m.cat === fitesCat; });
    var on = all.filter(function (m) { return med[m.id]; }), off = all.filter(function (m) { return !med[m.id]; });
    on.sort(function (a, b) { return (med[b.id] || '') < (med[a.id] || '') ? -1 : 1; });
    off.sort(function (a, b) { return (a.top || 9) - (b.top || 9) || (fitesCat === '100 Cims' ? a.tot - b.tot : b.cur / b.tot - a.cur / a.tot || a.tot - b.tot); });
    var LIM = 6, hid = fitesAll ? 0 : Math.max(0, off.length - LIM);
    function tile(m) {
      var ok = !!med[m.id], fr = Math.min(1, m.cur / m.tot);
      return '<button class="medal' + (ok ? ' on ' + m.tier : '') + (openMedal === m.id ? ' sel' : '') + '" data-mid="' + esc(m.id) + '"><div class="m-ic">' + MedalIcon(m, { size: 58, done: ok, fr: fr }) + '</div><div class="m-n">' + esc(m.badge.name) + '</div><div class="m-s">' + esc(m.badge.sub) + '</div>' +
        (ok ? '<div class="m-d">' + fmtDate(med[m.id]) + '</div>' : '<div class="m-p"><i style="width:' + (fr * 100).toFixed(0) + '%"></i></div><div class="m-d">' + Math.min(m.cur, m.tot) + ' / ' + m.tot + '</div>') + '</button>';
    }
    function panel(m) {
      var im = window.MedalImg && window.MedalImg(m), big = im ? '<div class="m-big' + (med[m.id] ? '' : ' off') + '"><img src="' + esc(im) + '" alt=""></div>' : '';
      var rq = reqText(m);
      return panel0(m).replace('<div class="m-panel">', '<div class="m-panel">' + big + (rq ? '<div class="m-req">' + esc(rq) + '</div>' : ''));
    }
    // requisits per obtenir la medalla
    function reqText(m) {
      var id = m.id, p = id.split(':')[0], z = id.slice(3), zn = z.split(' · '), n = m.tot, NA2 = AL.length, zs = zl(z);
      var ART = {"Cerdanya Nord": "la", "Alt Camp": "l'", "Pallars Jussà": "el", "Baix Camp": "el", "Pallars Sobirà": "el", "Alt Urgell": "l'", "Terra Alta": "la", "Lluçanès": "el", "Ribera d'Ebre": "la", "Tarragonès": "el", "Alt Empordà": "l'", "Moianès": "el", "Baix Empordà": "el", "Osona": "", "Baix Ebre": "el", "Conflent": "el", "Pla de l'Estany": "el", "Vallès Occidental": "el", "Andorra": "", "Selva": "la", "Maresme": "el", "Segrià": "el", "Noguera": "la", "Bages": "el", "Montsià": "el", "Conca de Barberà": "la", "Alta Ribagorça": "l'", "Rosselló": "el", "Barcelonès": "el", "Pla d'Urgell": "el", "Priorat": "el", "Alt Penedès": "l'", "Segarra": "la", "Ripollès": "el", "Vallespir": "el", "Anoia": "l'", "Berguedà": "el", "Garrotxa": "la", "Val d'Aran": "", "Gironès": "el", "Vallès Oriental": "el", "Cerdanya": "la", "Baix Llobregat": "el", "Urgell": "l'", "Solsonès": "el", "Capcir": "el", "Garrigues": "les", "Baix Penedès": "el"};
      var del = function (c) { var a = ART[c]; return a === 'el' ? 'do ' + c : a === 'la' ? 'da ' + c : a === 'les' ? 'das ' + c : 'de ' + c; };
      if (id === 'a50') return 'Subir o teu primeiro 4000 dos Alpes.';
      if (id === 'agol') return 'Subir máis dun 4000 nun mesmo día.';
      if (id === 'dia3000') return 'Subir máis dun 3000 nun mesmo día.';
      if (id === 'dia100') return 'Facer máis dun cume da lista nun mesmo día.';
      if (id === 'ahalf') return 'Subir a metade dos catromiles da lista: ' + n + ' de ' + NA2 + '.';
      if (id === 'aall') return 'Subir todos os ' + NA2 + ' catromiles da lista dos Alpes.';
      if (id === 'e100') return 'Facer 100 dos ' + N_ESS + ' cumes esenciais da lista dos 100 cumes.';
      if (id === 'eall') return 'Facer todos os cumes esenciais.';
      if (/^c\d+$/.test(id)) return 'Facer ' + n + ' cumes da lista dos 100 cumes.';
      if (id === 'call') return 'Facer todos os ' + F.length + ' cumes da lista dos 100 cumes.';
      if (m.comSeries) { var es = id.indexOf('ces') === 0; return (m.pct === 100 ? 'Completar totes les ' + n + ' comarcas ' : 'Completar ' + n + ' comarcas (' + m.pct + '%) ') + (es ? 'con todos os seus cumes esenciais.' : 'facendo todos os seus cumes.'); }
      if (p === 'ce') return n === 1 ? 'Facer o único cume esencial ' + del(z) + '.' : 'Facer os ' + n + ' cumes esenciais ' + del(z) + '.';
      if (p === 'ca') return n === 1 ? 'Facer o único cume ' + del(z) + '.' : 'Facer os ' + n + ' cumes ' + del(z) + ', esenciais ou non.';
      if (p === 'zp') return n === 1 ? 'Subir o único 3000 principal do sector ' + zs + '.' : 'Subir os ' + n + ' 3000 principais do sector ' + zs + '.';
      if (p === 'zt') { var TN = { 'Z1': 'o Balaitús', 'Z2': 'o Vignemale', 'Z3': 'o Monte Perdido', 'Z4': 'a Munia', 'Z5': 'o Pic Long', 'Z6': 'o Gran Bachimala', 'Z7': 'o Posets', 'Z8': 'o Perdiguero', 'Z9': 'o Aneto', 'Z10': 'o Comaloforno', 'Z11': 'a Pica d’Estats' }; return 'Subir ' + (TN[zn[0]] || m.top.n) + ' (' + fmtAlt(m.top.h) + '), o máis alto do sector ' + zs + '.'; }
      if (p === 'za') return 'Subir todos os cumes de 3000 m do sector ' + zs + '.';
      if (id === 'u1') return 'Subir o teu primeiro 3000 do Pirineo.';
      if (id === 'up') return 'Subir os ' + N_P + ' 3000 principais do Pirineo.';
      if (id === 'uall') return 'Subir os ' + (N_P + N_S) + ' 3000 do Pirineo, principais e secundarios.';
      if (id === 'cat') return 'Subir os ' + n + ' 3000 vixentes de Cataluña.';
      if (id === 'sos') return 'Subir ao teito das ' + n + ' comarcas de Cataluña.';
      if (/^sos\d+$/.test(id)) return 'Subir ao teito de ' + n + ' comarcas (' + id.slice(3) + '%).';
      return '';
    }
    window.__medalReq = function (id) { var d = medalDefs().filter(function (x) { return x.id === id; })[0]; return d ? reqText(d) : ''; };
    function panel0(m) {
      function uniq(l) { var s = {}; return l.filter(function (k) { if (s[k]) return false; s[k] = 1; return true; }); }
      var isSos = m.ls === 'sos', comsOf = {};
      if (isSos) SOS.forEach(function (x) { (comsOf[sosKey(x)] = comsOf[sosKey(x)] || []).push(x.com); });
      if (m.list) {
        var Ls = m.list(), lr = function (x, p) { return '<li class="' + (p ? 'pend' : '') + '"><span class="ml-i">' + (p ? '·' : '✓') + '</span><span class="ml-n">' + esc(x.n) + '</span><span class="ml-d">' + esc(x.r) + '</span></li>'; };
        return '<div class="m-panel"><div class="m-ph">' + esc(m.name) + ' · ' + Ls.ok.length + (Ls.ok.length === 1 ? ' comarca feita' : ' comarcas feitas') + (med[m.id] ? '' : ' · faltan ' + Math.max(0, m.tot - m.cur)) + '</div><ol class="m-list">' +
          Ls.ok.map(function (x) { return lr(x, 0); }).join('') + (Ls.pend.length ? '<li class="m-sep">Pendentes · ' + Ls.pend.length + '</li>' + Ls.pend.map(function (x) { return lr(x, 1); }).join('') : '') + '</ol></div>';
      }
      var ks = uniq(m.keys ? m.keys() : []), pk = [];
      if (m.keys && (!m.lim || m.id === 'e100')) {
        var allk = []; FORCE_ALL = true; try { allk = uniq(m.keys()); } finally { FORCE_ALL = false; }
        pk = allk.filter(function (k) { return ks.indexOf(k) < 0; });
      }
      function mk(k) { var r = S.done[k], it = cimInfo(k) || sosInfo(k); return { k: k, n: it ? it.n : k, h: it ? it.h : null, d: r && r.d || '', c: r ? nAsc(k) : 0, coms: comsOf[k] || [] }; }
      var rows = ks.map(mk), prow = pk.map(mk);
      rows.sort(function (a, b) { return (a.d || '9999') < (b.d || '9999') ? -1 : (a.d || '9999') > (b.d || '9999') ? 1 : 0; });
      prow.sort(function (a, b) { return (b.h || 0) - (a.h || 0); });
      if (m.lim && med[m.id]) rows = rows.slice(0, m.lim);
      var nd = isSos ? rows.reduce(function (s, x) { return s + (x.coms.length || 1); }, 0) : rows.length, nm = function (x) { return esc(x.n) + (x.coms.length ? ' <small class="ml-c">' + esc(x.coms.join(' / ')) + '</small>' : ''); };
      return '<div class="m-panel"><div class="m-ph">' + esc(m.name) + ' · ' + (nd ? nd + (isSos ? (nd === 1 ? ' comarca feita' : ' comarcas feitas') : ' cume' + (nd === 1 ? ' feito' : 's feitos')) : 'aínda ningún cume') + (med[m.id] ? '' : ' · faltan ' + Math.max(0, m.tot - m.cur)) + '</div>' +
        (rows.length || prow.length ? '<ol class="m-list">' + rows.map(function (x, i) {
          return '<li data-ck="' + esc(x.k) + '"><span class="ml-i">' + (i + 1) + '</span><span class="ml-n">' + nm(x) + '</span><span class="ml-d">' + (x.c > 1 ? '<b>×' + x.c + '</b> ' : '') + (x.d ? fmtDate(x.d) : 'sen data') + '</span></li>';
        }).join('') + (prow.length ? '<li class="m-sep">Pendentes · ' + prow.length + '</li>' + prow.map(function (x) {
          return '<li class="pend" data-ck="' + esc(x.k) + '"><span class="ml-i">·</span><span class="ml-n">' + nm(x) + '</span><span class="ml-d">' + (x.h ? fmtAlt(x.h) : 'pendente') + '</span></li>';
        }).join('') : '') + '</ol>' : '') + '</div>';
    }
    // la fitxa desplegada s'insereix al final de la fila de 3 on hi ha la medalla tocada
    function grid(list) {
      var out = '', idx = -1;
      list.forEach(function (m, i) { if (m.id === openMedal) idx = i; });
      var after = idx < 0 ? -1 : Math.min(list.length - 1, Math.floor(idx / 3) * 3 + 2);
      list.forEach(function (m, i) { out += tile(m); if (i === after) out += panel(list[idx]); });
      return '<div class="medals">' + out + '</div>';
    }
    var nexts = defs.filter(function (m) { return !med[m.id]; }).map(function (m) { return { m: m, f: Math.min(1, m.cur / m.tot) }; })
      .sort(function (x, y) { return y.f - x.f || x.m.tot - y.m.tot; }).slice(0, 3);
    var nx = '';
    if (nexts.length) {
      nx = '<div class="nxm-car" id="nxmCar">' + nexts.map(function (x, i) {
        var nm = x.m;
        return '<div class="card nxm" data-mid="' + esc(nm.id) + '" data-mcat="' + esc(nm.cat) + '"><div class="nxm-ic">' + MedalIcon(nm, { size: 78, done: false, fr: x.f }) + '</div><div class="nxm-b"><div class="nxm-l">Próxima medalla' + (nexts.length > 1 ? ' · ' + (i + 1) + '/' + nexts.length : '') + '</div><div class="nxm-n">' + esc(nm.badge.name) + '</div><div class="nxm-s">' + esc(nm.badge.sub) + '</div></div>' +
          '<div class="nxm-bar"><b style="width:' + (x.f * 100).toFixed(0) + '%"></b></div><div class="nxm-f"><span>' + Math.min(nm.cur, nm.tot) + ' / ' + nm.tot + '</span><span>Fáltanche ' + Math.max(0, nm.tot - nm.cur) + '</span></div></div>';
      }).join('') + '</div>' + (nexts.length > 1 ? '<div class="nxm-dots">' + nexts.map(function (x, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '');
    }
    var mh = nx + '<div class="card"><h2>Medallas <small class="h-small">' + got + ' de ' + defs.length + '</small></h2>' +
      '<div class="chips" id="medCats">' + cats.map(function (c) {
        var n = defs.filter(function (m) { return m.cat === c; }), g = n.filter(function (m) { return med[m.id]; }).length;
        return '<button class="chip' + (c === fitesCat ? ' on' : '') + '" data-mc="' + esc(c) + '">' + (({ 'Comarques': 'Comarcas', 'Sectores 3000': 'Sectores 3000', 'Sostres': 'Teitos', 'Especials': 'Especiais' })[c] || esc(c)) + ' · ' + g + '/' + n.length + '</button>';
      }).join('') + '</div>' +
      (on.length ? '<div class="m-done' + (fitesDoneOpen ? ' open' : '') + '"><button class="m-done-h" data-mdone="1"><span>Conseguidas · ' + on.length + '</span><span class="chev">▾</span></button>' +
        '<div class="m-done-b"><div>' + grid(on) + '</div></div></div>' : '') +
      (off.length ? '<h4 class="st-h">Por conseguir</h4>' + grid(off.slice(0, off.length - hid)) : '<div class="empty">Todas conseguidas!</div>') +
      (hid ? '<button class="btn more-btn" data-mall="1">Amosalas todas (' + hid + ' máis)</button>' : '') + '</div>';
    // --- estadístiques
    var years = {}, nod = 0, dated = [], top = null, totAsc = 0, reps = [], lastA = null;
    function addRec(k, name, h, list) {
      var r = S.done[k]; if (!r) return;
      if (!top || h > top.h) top = { n: name, h: h };
      var A = ascList(r); totAsc += A.length; if (A.length > 1) reps.push({ n: name, c: A.length });
      A.forEach(function (x) {
        if (!x.d) return; var y = x.d.slice(0, 4); years[y] = years[y] || { f: 0, u: 0, a: 0 }; years[y][list]++;
        if (!lastA || x.d > lastA.d) lastA = { n: name, d: x.d };
      });
      if (!r.d) { nod++; return; }
      dated.push({ n: name, d: r.d, h: h });
    }
    F.forEach(function (f) { addRec('f:' + f.id, f.n, f.h, 'f'); });
    U.forEach(function (u) { addRec('u:' + u.id, u.n, u.h, 'u'); });
    AL.forEach(function (a) { addRec('a:' + a.id, a.n, a.h, 'a'); });
    dated.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    var ys = Object.keys(years).sort(), chart = '';
    if (ys.length) {
      var y0 = +ys[0], y1 = Math.max(+ys[ys.length - 1], new Date().getFullYear()), all = [];
      for (var y = Math.max(y0, y1 - 14); y <= y1; y++) all.push(String(y));
      var mx = Math.max.apply(null, all.map(function (y) { return years[y] ? years[y].f + years[y].u + years[y].a : 0; })) || 1;
      var bw = 300 / all.length, H = 120, T = 14;
      chart = '<svg class="ychart" viewBox="0 0 300 ' + (H + T + 20) + '"><g transform="translate(0,' + T + ')">' + all.map(function (y, i) {
        var v = years[y] || { f: 0, u: 0, a: 0 }, hf = v.f / mx * H, hu = v.u / mx * H, ha = v.a / mx * H, x = i * bw + bw * .15, w = bw * .7, tot = v.f + v.u + v.a;
        return '<rect x="' + x.toFixed(1) + '" y="' + (H - hf).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hf.toFixed(1) + '" rx="2" fill="#9FD5B2"/>' +
          '<rect x="' + x.toFixed(1) + '" y="' + (H - hf - hu).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hu.toFixed(1) + '" rx="2" fill="#A9C8F0"/>' +
          '<rect x="' + x.toFixed(1) + '" y="' + (H - hf - hu - ha).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + ha.toFixed(1) + '" rx="2" fill="#F2B880"/>' +
          (tot ? '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - hf - hu - ha - 3).toFixed(1) + '" text-anchor="middle" class="yv">' + tot + '</text>' : '') +
          '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H + 14) + '" text-anchor="middle" class="yl">' + (all.length > 8 ? "'" + y.slice(2) : y) + '</text>';
      }).join('') + '</g></svg><div class="legend"><span><i style="background:#9FD5B2"></i>100 Cims</span><span><i style="background:#A9C8F0"></i>3000 Pirineo</span>' + (lsOn('alps') ? '<span><i style="background:#F2B880"></i>4000</span>' : '') + '</div>';
    } else chart = '<div class="empty">Aínda non hai cumes con data. Engade datas aos cumes feitos ou importa un track.</div>';
    var sh = statsEntry();
    // --- mapa de comarques
    if (!comMap) buildComMap();
    var svg = '<svg class="cmap" viewBox="0 0 ' + comMap.W + ' ' + comMap.H + '">' + comMap.paths.map(function (p) {
      var x = st.byCom[p.n], fr = x && x.e ? x.ed / x.e : null;
      return '<path d="' + p.d + '" fill="' + heat(fr) + '" data-com="' + esc(p.n) + '"/>';
    }).join('') + '</svg>';
    var fora = Object.keys(st.byCom).filter(function (c) { return !comMap.paths.some(function (p) { return p.n === c; }); }).sort();
    var mp = '<div class="card"><h2>Mapa de esenciais por comarca</h2>' + svg +
      '<div class="scale"><span>0%</span><i></i><span>100%</span><b class="nocim"></b><span>sen esenciais</span></div>' +
      '<div class="detail" id="comInfo">Toca unha comarca para ver o detalle.</div>' +
      (fora.length ? '<div class="fora">' + fora.map(function (c) { var x = st.byCom[c]; return '<button class="chip" data-com="' + esc(c) + '">' + esc(c) + ' · ' + (x.e ? x.ed + '/' + x.e : x.d + '/' + x.n) + '</button>'; }).join('') + '</div>' : '') +
      '</div>';
    if (!lsOn('feec')) mp = '';
    el.innerHTML = mh + mp + sh; nxmDots();
    animateIn(el);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('#v-fites [data-mc]');
    if (t) { fitesCat = t.dataset.mc; fitesAll = false; openMedal = null; renderFites(); return; }
    if (e.target.closest('#v-fites [data-mdone]')) { fitesDoneOpen = !fitesDoneOpen; e.target.closest('.m-done').classList.toggle('open', fitesDoneOpen); return; }
    var mt = e.target.closest('#v-fites [data-mid]');
    if (mt && mt.dataset.mcat) { fitesCat = mt.dataset.mcat; fitesAll = false; openMedal = mt.dataset.mid; renderFites(); var pn0 = $('#v-fites .m-panel'); if (pn0) pn0.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (mt) {
      openMedal = openMedal === mt.dataset.mid ? null : mt.dataset.mid; renderFites();
      var pn = $('#v-fites .m-panel'); if (pn) { pn.classList.add('in'); var r = pn.getBoundingClientRect(); if (r.bottom > window.innerHeight - 70) pn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      return;
    }
    var ck = e.target.closest('#v-fites [data-ck]');
    if (ck) { var it = itemByKey(ck.dataset.ck); if (it) openItem(it); return; }
    if (e.target.closest('#v-fites [data-mall]')) { fitesAll = true; renderFites(); return; }
    var c = e.target.closest('#v-fites [data-com]');
    if (c) {
      var n = c.dataset.com, x = stats().byCom[n];
      $$('#v-fites path.sel').forEach(function (p) { p.classList.remove('sel'); });
      if (c.tagName === 'path') c.classList.add('sel');
      $('#comInfo').innerHTML = '<b>' + esc(n) + '</b>: ' + (x ? (x.e ? x.ed + ' de ' + x.e + ' esenciais · ' : '') + x.d + ' de ' + x.n + ' cumes da comarca' : 'ningún cume da lista con esta comarca principal') +
        (x ? ' <button class="chip" data-gocom="' + esc(n) + '">Ver lista</button>' : '');
    }
    var g = e.target.closest('#v-fites [data-gocom]');
    if (g) { retSet({ com: g.dataset.gocom }); LS.list = 'feec'; LS.grp = g.dataset.gocom; LS.estat = 'tots'; $$('#listSeg button').forEach(function (x) { x.classList.toggle('on', x.dataset.l === 'feec'); }); showView('llistes'); renderFilters(); renderList(); }
  });

  // ---------- ESTADÍSTIQUES per període (sense km ni desnivell) ----------
  var STP = 'ytd', STC = null;
  var MES_I = 'XFMAMXXASOND', MES_C = ['Xan', 'Feb', 'Mar', 'Abr', 'Mai', 'Xuñ', 'Xul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
  var MES_L = ['Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño', 'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'];
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function listOnFor(k) { var c = k[0]; return c === 'f' ? lsOn('feec') : c === 'u' ? (lsOn('uiaa') || lsOn('cat')) : c === 'a' ? lsOn('alps') : lsOn('sos'); }
  // un cim que és a dues llistes (p. ex. la Pica d'Estats) compta una sola vegada
  function statCims() {
    var seen = {}, out = [], undated = 0;
    Object.keys(S.done).forEach(function (k) {
      var tk = twinKeys(k); if (!tk.some(listOnFor)) return;
      var canon = tk[0]; if (seen[canon]) return; seen[canon] = 1;
      var info = cimInfo(canon) || sosInfo(canon) || cimInfo(k) || sosInfo(k); if (!info) return;
      var ds = [];
      tk.forEach(function (kk) { if (S.done[kk]) ascList(S.done[kk]).forEach(function (x) { if (x.d && ds.indexOf(x.d) < 0) ds.push(x.d); }); });
      ds.sort();
      if (!ds.length) { undated++; (out.und = out.und || []).push({ k: canon, n: info.n, h: info.h }); return; }
      out.push({ k: canon, keys: tk.filter(function (kk) { return S.done[kk]; }), n: info.n, h: info.h, ds: ds });
    });
    return { cims: out, undated: undated, und: out.und || [] };
  }
  function statPeriod(p) {
    var now = new Date(), cy = now.getFullYear(), t = ymd(now), r = { id: p };
    if (p === 'm1') {
      var s0 = new Date(now); s0.setDate(s0.getDate() - 29); var ps = new Date(s0); ps.setDate(ps.getDate() - 30); var pe = new Date(s0); pe.setDate(pe.getDate() - 1);
      r.a = ymd(s0); r.b = t; r.lab = 'Último mes'; r.kind = 'wk'; r.pa = ymd(ps); r.pb = ymd(pe); r.vs = 'os 30 días anteriores'; r.s0 = s0;
    } else if (p === 'm3') {
      r.a = ymd(new Date(cy, now.getMonth() - 2, 1)); r.b = t; r.lab = 'Últimos 3 meses'; r.kind = 'mo';
      r.pa = ymd(new Date(cy, now.getMonth() - 5, 1)); r.pb = ymd(new Date(cy, now.getMonth() - 2, 0)); r.vs = 'os 3 meses anteriores';
    } else if (p === 'ytd') {
      r.a = cy + '-01-01'; r.b = t; r.lab = 'Este ano · ' + cy; r.kind = 'yr12'; r.pa = (cy - 1) + '-01-01'; r.pb = (cy - 1) + '-' + t.slice(5); r.vs = 'o mesmo período de ' + (cy - 1); r.y = cy;
    } else if (p === 'custom') {
      var c0 = STC || {}, bb = c0.b || t, aa = c0.a || ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89));
      if (aa > bb) { var tmp = aa; aa = bb; bb = tmp; }
      var n = Math.round((new Date(bb + 'T12:00') - new Date(aa + 'T12:00')) / 864e5) + 1, pb0 = new Date(aa + 'T12:00'); pb0.setDate(pb0.getDate() - 1);
      var pa0 = new Date(pb0); pa0.setDate(pa0.getDate() - (n - 1));
      r.a = aa; r.b = bb; r.lab = fmtDate(aa) + ' – ' + fmtDate(bb); r.kind = 'cu'; r.n = n; r.pa = ymd(pa0); r.pb = ymd(pb0); r.vs = 'o período anterior (' + n + ' días)';
    } else if (p === 'all') {
      r.a = '0000-01-01'; r.b = '9999-12-31'; r.lab = 'Todos os anos'; r.kind = 'all';
    } else {
      var y = +p.slice(1); r.a = y + '-01-01'; r.b = y + '-12-31'; r.lab = (y === cy - 1 ? 'Ano pasado · ' : 'Ano ') + y; r.kind = 'yr12'; r.pa = (y - 1) + '-01-01'; r.pb = (y - 1) + '-12-31'; r.vs = String(y - 1); r.y = y;
    }
    return r;
  }
  function statCount(cims, a, b) {
    var n = 0, nous = 0;
    cims.forEach(function (c) {
      if (!c.ds.some(function (d) { return d >= a && d <= b; })) return;
      n++; if (c.ds[0] >= a && c.ds[0] <= b) nous++;
    });
    return { n: n, nous: nous, rep: n - nous };
  }
  function statBuckets(cims, r) {
    var bk = [], now = new Date(), i;
    if (r.kind === 'yr12') for (i = 0; i < 12; i++) bk.push({ l: MES_I[i], full: MES_L[i], a: r.y + '-' + pad2(i + 1) + '-01', b: r.y + '-' + pad2(i + 1) + '-31' });
    else if (r.kind === 'mo') for (i = 0; i < 3; i++) { var d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1), m = ymd(d).slice(0, 7); bk.push({ l: MES_L[d.getMonth()], full: MES_L[d.getMonth()], a: m + '-01', b: m + '-31' }); }
    else if (r.kind === 'cu') {
      var A0 = new Date(r.a + 'T12:00'), B0 = new Date(r.b + 'T12:00');
      if (r.n <= 70) { for (var s2 = new Date(A0); s2 <= B0; s2.setDate(s2.getDate() + 7)) { var e2 = new Date(s2); e2.setDate(e2.getDate() + 6); if (e2 > B0) e2 = new Date(B0); bk.push({ l: s2.getDate() + '/' + (s2.getMonth() + 1), full: '', a: ymd(s2), b: ymd(e2) }); } }
      else if (r.n <= 1100) { var yy = r.n > 400; for (var m2 = new Date(A0.getFullYear(), A0.getMonth(), 1); m2 <= B0; m2.setMonth(m2.getMonth() + 1)) { var mm = ymd(m2).slice(0, 7); bk.push({ l: MES_C[m2.getMonth()] + (yy ? "'" + String(m2.getFullYear()).slice(2) : ''), full: MES_L[m2.getMonth()] + ' ' + m2.getFullYear(), a: mm + '-01' > r.a ? mm + '-01' : r.a, b: mm + '-31' < r.b ? mm + '-31' : r.b }); } }
      else { for (var y2 = A0.getFullYear(); y2 <= B0.getFullYear(); y2++) bk.push({ l: String(y2), full: String(y2), a: y2 + '-01-01' > r.a ? y2 + '-01-01' : r.a, b: y2 + '-12-31' < r.b ? y2 + '-12-31' : r.b }); }
    }
    else if (r.kind === 'wk') for (i = 0; i < 5; i++) {
      var s1 = new Date(r.s0); s1.setDate(s1.getDate() + i * 6); var e1 = new Date(s1); e1.setDate(e1.getDate() + (i === 4 ? 5 : 5));
      bk.push({ l: s1.getDate() + '/' + (s1.getMonth() + 1), full: '', a: ymd(s1), b: i === 4 ? r.b : ymd(e1) });
    } else {
      var y0 = now.getFullYear(); cims.forEach(function (c) { var y = +c.ds[0].slice(0, 4); if (y < y0) y0 = y; });
      for (var y = y0; y <= now.getFullYear(); y++) bk.push({ l: String(y), full: String(y), a: y + '-01-01', b: y + '-12-31' });
    }
    bk.forEach(function (b) { b.n = statCount(cims, b.a, b.b).n; });
    return bk;
  }
  function statsEntry() {
    var D = statCims(), r = statPeriod('ytd'), c = statCount(D.cims, r.a, r.b);
    return '<button class="card st-entry" data-gostats="1"><span class="st-e-i"><svg viewBox="0 0 24 24"><path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/></svg></span><span class="st-e-b"><span class="st-e-t">Estatísticas</span><span class="st-e-s"><b>' + c.n + '</b> cumes este ano · por mes, por ano…</span></span><span class="st-e-c">›</span></button>';
  }
  // ---------- estadístiques d'escalada (sortides dels punts) ----------
  var ROM = { II: 2, III: 3, IV: 4, V: 5, VI: 5.7, VII: 6.7, VIII: 7.5 };
  function gradeVal(g) {
    var best = null;
    String(g || '').split(/[^0-9A-Za-z+\-]+/).forEach(function (t) {
      var m = /^(VIII|VII|VI|IV|V|III|II)([abc])?([+-])?$/.exec(t), v = null;
      if (m) v = ROM[m[1]] + (m[2] ? ' abc'.indexOf(m[2]) * .3 - .3 : 0) + (m[3] === '+' ? .4 : m[3] === '-' ? -.3 : 0);
      else if ((m = /^([3-9])([abc])?(\+)?$/.exec(t))) v = +m[1] + (m[2] ? ' abc'.indexOf(m[2]) * .33 - .33 : 0) + (m[3] ? .17 : 0);
      if (v != null && (!best || v > best.v)) best = { v: v, t: t };
    });
    return best;
  }
  function climbStatsHtml(r) {
    var E = [];
    S.points.forEach(function (p) { (p.vs || []).forEach(function (v) { if (/^\d{4}-\d\d-\d\d$/.test(v.d || '') && v.d >= r.a && v.d <= r.b) E.push({ v: v, p: p }); }); });
    if (!E.length) return '';
    var days = {}, yrs = {}, ppl = {}, tip = {}, top = null;
    E.forEach(function (x) {
      var v = x.v, y = v.d.slice(0, 4), ok = !/retirada/i.test(v.e || '') && !/intent/i.test(v.v || '');
      days[v.d] = 1;
      var Y = yrs[y] = yrs[y] || { d: {}, n: 0, g: null };
      Y.d[v.d] = 1; Y.n++;
      var g = ok ? gradeVal(v.gr) : null;
      if (g) { if (!Y.g || g.v > Y.g.v) Y.g = { v: g.v, t: g.t, via: v.v, p: x.p.n }; if (!top || g.v > top.v) top = { v: g.v, t: g.t, via: v.v, p: x.p.n, d: v.d }; }
      if (v.t) tip[v.t] = (tip[v.t] || 0) + 1;
      splitPeople(v.c).forEach(function (n) { ppl[n] = ppl[n] || {}; ppl[n][v.d] = 1; });
    });
    var nd = Object.keys(days).length;
    var yh = Object.keys(yrs).sort().reverse().map(function (y) { var Y = yrs[y]; return '<div class="lr cy"><span>' + y + '</span><small>' + Object.keys(Y.d).length + ' xorn. · ' + Y.n + ' vías</small><b>' + (Y.g ? esc(Y.g.t) : '—') + '</b></div>'; }).join('');
    var ph = Object.keys(ppl).map(function (n) { return [n, Object.keys(ppl[n]).length]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8)
      .map(function (x) { return '<div class="lr">' + esc(x[0]) + '<b>' + x[1] + '</b></div>'; }).join('');
    var th = Object.keys(tip).sort(function (a, b) { return tip[b] - tip[a]; }).map(function (k) { return '<div class="lr">' + esc(k) + '<b>' + tip[k] + '</b></div>'; }).join('');
    return '<div class="st-sec">Escalada, alpinismo e vías ferratas</div>' +
      '<div class="st-kp"><div class="card"><div class="v">' + nd + '</div><div class="l">xornadas</div></div><div class="card"><div class="v">' + E.length + '</div><div class="l">vías / actividades</div></div>' +
      '<div class="card"><div class="v">' + (top ? esc(top.t) : '—') + '</div><div class="l">grao máximo</div></div></div>' +
      (top ? '<div class="card st-list"><div class="st-h2">Vía máis difícil</div><div class="lr">' + esc(top.via || '—') + '<span>' + esc(top.p) + ' · ' + fmtDate(top.d) + '</span></div></div>' : '') +
      (Object.keys(yrs).length > 1 ? '<div class="card st-list"><div class="st-h2">Por ano · grao máximo</div>' + yh + '</div>' : '') +
      (ph ? '<div class="card st-list"><div class="st-h2">Con quen (xornadas)</div>' + ph + '</div>' : '') +
      (th ? '<div class="card st-list"><div class="st-h2">Por tipo</div>' + th + '</div>' : '');
  }
  function renderStats() {
    var el = $('#v-stats'); if (!el) return;
    var D = statCims(), cims = D.cims, cy = new Date().getFullYear(), yrs = {}; yrs[cy - 1] = 1;
    cims.forEach(function (c) { c.ds.forEach(function (d) { var y = +d.slice(0, 4); if (y < cy) yrs[y] = 1; }); });
    var ys = Object.keys(yrs).map(Number).sort(function (a, b) { return b - a; });
    var chips = [['m1', 'Último mes'], ['m3', '3 meses'], ['ytd', 'Este ano'], ['all', 'Todo'], ['custom', 'Personalizado']];
    if (!chips.some(function (c) { return c[0] === STP; }) && !(/^y\d{4}$/.test(STP) && ys.indexOf(+STP.slice(1)) >= 0)) STP = 'ytd';
    var r = statPeriod(STP), cnt = statCount(cims, r.a, r.b), bk = statBuckets(cims, r), mx = Math.max.apply(null, bk.map(function (b) { return b.n; })) || 1;
    var cmp = '';
    if (r.pa) { var pv = statCount(cims, r.pa, r.pb).n, df = cnt.n - pv; if (pv || cnt.n) cmp = (df > 0 ? '+' : df < 0 ? '−' : '') + Math.abs(df) + ' vs ' + r.vs; }
    else if (bk.length) cmp = 'desde ' + bk[0].l;
    var many = bk.length > 8 && r.kind !== 'cu';
    var chart = '<div class="st-chart">' + bk.map(function (b) {
      return '<div><b>' + (b.n || '') + '</b><i class="' + (b.n ? '' : 'z') + '" style="height:' + Math.max(3, b.n / mx * 78) + '%"></i><span>' + esc(many && b.l.length === 4 ? "'" + b.l.slice(2) : b.l) + '</span></div>';
    }).join('') + '</div>';
    // per llista
    var CATREF = {}; CAT_VIG.forEach(function (c) { CATREF['u:' + c.ref] = 1; });
    var L = [
      ['f', '100 Cims FEEC', lsOn('feec'), function (k) { return k[0] === 'f'; }],
      ['u', '3000 do Pirineo', lsOn('uiaa'), function (k) { return k[0] === 'u'; }],
      ['c', '3000 catalás', lsOn('cat'), function (k) { return !!CATREF[k]; }],
      ['a', '4000 Alps', lsOn('alps'), function (k) { return k[0] === 'a'; }],
      ['s', 'Teitos comarcais', lsOn('sos'), function (k) { return k[0] === 's'; }]
    ].filter(function (l) { return l[2]; });
    var inP = cims.map(function (c) { return { c: c, d: c.ds.filter(function (d) { return d >= r.a && d <= r.b; }) }; }).filter(function (x) { return x.d.length; });
    var lrows = L.map(function (l) {
      var it = inP.filter(function (x) { return x.c.keys.some(l[3]); }).sort(function (a, b) { return b.d[b.d.length - 1] < a.d[a.d.length - 1] ? -1 : 1; });
      if (!it.length) return '<div class="lr pl0">' + l[1] + '<b>0</b></div>';
      return '<details class="pl"><summary><span>' + l[1] + '</span><b>' + it.length + '</b></summary>' + it.map(function (x) {
        var dd = x.d.length > 1 ? fmtDate(x.d[x.d.length - 1]) + ' · ×' + x.d.length : fmtDate(x.d[0]);
        return '<div class="lr" data-tk="' + esc(x.c.k) + '"><span class="tn">' + esc(x.c.n) + '</span><small>' + dd + '</small></div>';
      }).join('') + '</details>';
    }).join('');
    // destacats
    var inR = cims.filter(function (c) { return c.ds.some(function (d) { return d >= r.a && d <= r.b; }); }), hi = null, dmin = '', dmax = '';
    inR.forEach(function (c) { if (c.h != null && (!hi || c.h > hi.h)) hi = c; c.ds.forEach(function (d) { if (d >= r.a && d <= r.b) { if (!dmin || d < dmin) dmin = d; if (!dmax || d > dmax) dmax = d; } }); });
    var best = bk.slice().sort(function (a, b) { return b.n - a.n; })[0], det = [];
    if (hi) det.push(['Cume máis alto · ' + esc(hi.n), fmtAlt(hi.h)]);
    if (best && best.n && bk.length > 1 && r.kind !== 'wk') det.push([r.kind === 'all' || (r.kind === 'cu' && r.n > 1100) ? 'Mellor ano' : r.kind === 'cu' && r.n <= 70 ? 'Mellor semana' : 'Mellor mes', (best.full || best.l) + ' · ' + best.n]);
    if (r.kind === 'all' && bk.length) det.push(['Media', (cnt.n / bk.length).toFixed(1).replace('.', ',') + ' / ano']);
    if (dmin) det.push([r.kind === 'all' ? 'Primeiro · último' : 'Primeiro · último', fmtDate(dmin).slice(0, r.kind === 'all' || r.kind === 'cu' ? 10 : 5) + ' · ' + fmtDate(dmax).slice(0, r.kind === 'all' || r.kind === 'cu' ? 10 : 5)]);
    // els 10 cims més pujats del període
    var top = inR.map(function (c) { return { c: c, n: c.ds.filter(function (d) { return d >= r.a && d <= r.b; }).length }; })
      .sort(function (x, y) { return y.n - x.n || (y.c.h || 0) - (x.c.h || 0); }).slice(0, 10);
    var topH = top.length && top[0].n > 1 ? '<div class="card st-list st-top"><div class="st-h2">Os máis subidos</div>' + top.map(function (t, i) {
      return '<div class="lr" data-tk="' + esc(t.c.k) + '"><i>' + (i + 1) + '</i><span class="tn">' + esc(t.c.n) + '</span><small>' + fmtAlt(t.c.h) + '</small><b>×' + t.n + '</b></div>';
    }).join('') + '</div>' : '';
    // els 10 cims més alts del període (a «Tot» també compten els que no tenen data)
    var hiL = inR.map(function (c) { return { k: c.k, n: c.n, h: c.h, d: c.ds.filter(function (d) { return d >= r.a && d <= r.b; })[0] || '' }; });
    if (r.kind === 'all') {
      var seenH = {}; hiL.forEach(function (x) { seenH[x.k] = 1; });
      Object.keys(S.done).forEach(function (k) { var tk = twinKeys(k), cn = tk[0]; if (seenH[cn] || !tk.some(listOnFor)) return; var inf = cimInfo(cn) || cimInfo(k); if (!inf) return; seenH[cn] = 1; hiL.push({ k: cn, n: inf.n, h: inf.h, d: '' }); });
    }
    hiL = hiL.filter(function (x) { return x.h; }).sort(function (a, b) { return b.h - a.h; }).slice(0, 10);
    var altH = hiL.length > 2 ? '<div class="card st-list st-top"><div class="st-h2">Os máis altos</div>' + hiL.map(function (x, i) {
      return '<div class="lr" data-tk="' + esc(x.k) + '"><i>' + (i + 1) + '</i><span class="tn">' + esc(x.n) + '</span><small>' + (x.d ? fmtDate(x.d) : 'sen data') + '</small><b>' + fmtAlt(x.h) + '</b></div>';
    }).join('') + '</div>' : '';
    var kp = r.kind === 'all'
      ? [[cims.length, 'con data'], [D.undated, 'sen data']]
      : [[cnt.nous, 'cumes novos<br>(1.ª vez)'], [cnt.rep, 'repeticions']];
    var h = '<button class="st-back" data-statsback="1">‹ Atrás</button><div class="st-pe">' + chips.slice(0, 3).map(function (c) { return '<button class="' + (c[0] === STP ? 'on' : '') + '" data-stp="' + c[0] + '">' + esc(c[1]) + '</button>'; }).join('') +
      '<select class="st-yr' + (/^y\d{4}$/.test(STP) ? ' on' : '') + '" id="stYr" aria-label="Ano"><option value=""' + (/^y\d{4}$/.test(STP) ? '' : ' selected') + ' disabled>Ano ▾</option>' + ys.map(function (y) { return '<option value="y' + y + '"' + (STP === 'y' + y ? ' selected' : '') + '>' + y + (y === cy - 1 ? ' (pasado)' : '') + '</option>'; }).join('') + '</select>' +
      chips.slice(3).map(function (c) { return '<button class="' + (c[0] === STP ? 'on' : '') + '" data-stp="' + c[0] + '">' + esc(c[1]) + '</button>'; }).join('') + '</div>' +
      (STP === 'custom' ? '<div class="st-cu"><label>Desde<input type="date" id="stA" value="' + esc(r.a) + '"></label><label>Ata<input type="date" id="stB" value="' + esc(r.b) + '"></label></div>' : '') +
      '<div class="card st-hero"><div class="st-lab">' + esc(r.lab) + '</div><div class="st-row"><span class="st-big">' + (r.kind === 'all' ? cims.length + D.undated : cnt.n) + '</span><span class="st-u">cumes</span>' + (cmp ? '<span class="st-cmp">' + esc(cmp) + '</span>' : '') + '</div>' +
      (cnt.n || bk.some(function (b) { return b.n; }) ? chart : '<div class="empty" style="padding:22px 6px 6px">Ningún cume con data neste período.</div>') + '</div>' +
      '<div class="st-kp">' + kp.map(function (x) { return '<div class="card"><div class="v">' + x[0] + '</div><div class="l">' + x[1] + '</div></div>'; }).join('') + '</div>' +
      (lrows ? '<div class="card st-list"><div class="st-h2">Por lista</div>' + lrows + '</div>' : '') +
      topH + altH +
      (det.length ? '<div class="card st-list"><div class="st-h2">Destacados</div>' + det.map(function (x) { return '<div class="lr">' + x[0] + '<span>' + x[1] + '</span></div>'; }).join('') + '</div>' : '') + climbStatsHtml(r);
    el.innerHTML = h;
  }
  $('#v-stats').addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'stYr' && t.value) { STP = t.value; renderStats(); }
    else if (t.id === 'stA' || t.id === 'stB') { var a = $('#stA').value, b = $('#stB').value; if (a && b) { STC = { a: a, b: b }; renderStats(); } }
  });
  $('#v-stats').addEventListener('click', function (e) { var d = e.target.closest('[data-tk]'); if (!d) return; var it = itemByKey(d.dataset.tk); if (it) openItem(it); });

  // ---------- importar tracks ----------
  function simplify(pts, minM) {
    var out = [], last = null;
    pts.forEach(function (p, i) { if (!last || i === pts.length - 1 || dist(last[0], last[1], p[0], p[1]) * 1000 >= minM) { out.push([+p[0].toFixed(5), +p[1].toFixed(5)]); last = p; } });
    return out;
  }
  function openTrack(t) {
    var cands = cimCands();
    var hits = Tracks.detect(t, cands, 80);
    var rows = hits.map(function (c, i) {
      var r = S.done[c.key], na = nAsc(c.key), st = !r ? 'nou' : 'ascensión nº ' + (na + 1), on = true;
      return '<label class="trk-row"><input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span class="body"><span class="nm">' + esc(c.n) + ' <small>' + fmtAlt(c.h) + '</small></span>' +
        '<span class="meta">' + esc(c.l) + ' · a ' + c.dist + ' m del track' + (c.when ? ' · ' + c.when.toTimeString().slice(0, 5) : '') + '</span></span><span class="badge ' + (!r ? 'b-ess' : !r.d ? 'b-s' : 'b-baixa') + '">' + st + '</span></label>';
    }).join('');
    openSheet('<h3>' + esc(t.name) + '</h3><div class="sub">' + t.km + ' km' + (t.up != null ? ' · +' + t.up + ' m' : '') + ' · ' + t.pts.length + ' puntos</div>' +
      '<div class="field"><label>Data da saída</label><input type="date" id="tDate" value="' + esc(t.date || today()) + '"></div>' +
      '<h4 class="st-h">' + (hits.length ? hits.length + ' cume' + (hits.length > 1 ? 's' : '') + ' detectado' + (hits.length > 1 ? 's' : '') + ' (a menos de 80 m)' : 'Non se detectou ningún cume das listas') + '</h4>' +
      rows + '<label class="trk-row"><input type="checkbox" id="tRoute" checked><span class="body"><span class="nm">Gardar o track como ruta</span><span class="meta">Verase no mapa e no Excel/KMZ</span></span></label>' +
      '<div class="btns"><button class="btn ok" id="tApply">Aplicar</button><button class="btn" id="tCancel">Cancelar</button></div>' +
      '<div class="detail">Cada cume marcado suma unha ascensión coa data da saída. Se xa hai unha ascensión ese mesmo día, non se duplica.</div>');
    $('#tCancel').onclick = closeSheet;
    $('#tApply').onclick = function () {
      var d = $('#tDate').value || '', n = 0;
      $$('#sheet input[data-i]').forEach(function (cb) {
        if (!cb.checked) return; var c = hits[+cb.dataset.i];
        if (addAscent(c.key, { d: d, s: 'track', n: t.name })) n++;
      });
      if ($('#tRoute').checked) S.routes.push({ n: t.name, km: t.km, up: t.up, d: d, y: d.slice(0, 4), c: simplify(t.pts, 25) });
      save(); refreshAll(); closeSheet(); toast(n + ' cume' + (n === 1 ? '' : 's') + ' marcado' + (n === 1 ? '' : 's'));
      checkMedals(false);
    };
  }
  $('#trackIn').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    toast('Lendo o track…');
    Tracks.parse(f).then(openTrack).catch(function (e) { toast('Error: ' + e.message); });
  });

  // ---------- navegació ----------
  var view = 'resum';
  var TITLES = { diari: 'Diario', stats: 'Estatísticas', resum: 'Cumes', llistes: 'Listas', mapa: 'Mapa', punts: 'Os meus puntos', fites: 'Fitos' };
  var NAV_ORDER = ['resum', 'llistes', 'mapa', 'fites', 'punts'], viewT = null;
  var VIEW_CLS = ['v-out', 'v-in-l', 'v-in-r', 'v-out-l', 'v-out-r'];
  function setTopFor(v) {
    document.body.setAttribute('data-v', v);
  }
  function showView(v) {
    if (v !== 'punts' && SEL) { SEL = null; var rb = $('#rSelBar'); if (rb) rb.remove(); document.body.classList.remove('rsel-on'); DIRTY.punts = true; }
    var prev = view; view = v;
    var from = $('#v-' + prev), to = $('#v-' + v);
    clearTimeout(viewT);
    $$('.view').forEach(function (s) { VIEW_CLS.forEach(function (c) { s.classList.remove(c); }); s.classList.toggle('active', s.id === 'v-' + v); });
    // transició lliscant: la pantalla nova entra pel costat de la pestanya tocada i l'anterior surt per l'altre
    if (prev !== v && from && to) {
      var oi = (v === 'stats' || v === 'diari') ? 99 : NAV_ORDER.indexOf(v), pi = (prev === 'stats' || prev === 'diari') ? 99 : NAV_ORDER.indexOf(prev), dir = oi > pi ? 1 : -1;
      to.classList.add('v-in-r');
      viewT = setTimeout(function () { to.classList.remove('v-in-r'); }, 200);
    }
    $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === ((v === 'stats' || v === 'diari') ? 'resum' : v)); });
    $('#topTitle').textContent = TITLES[v];
    setTopFor(v);
    $('#layerPanel').classList.add('hidden');
    if (v === 'mapa') { if (!map) { initMap(); DIRTY.mapa = false; } else flushView('mapa'); setTimeout(function () { map.invalidateSize(); }, 50); }
    else if (v === 'stats') { DIRTY.stats = true; flushView('stats'); $('#v-stats').scrollTop = 0; }
    else if (v === 'diari') { DIRTY.diari = true; flushView('diari'); $('#v-diari').scrollTop = 0; }
    else flushView(v);
    if (v === 'resum') animateIn($('#v-resum'));
  }
  // només es dibuixa la pantalla visible; les altres es marquen «brutes» i es dibuixen quan s'hi entra
  var RENDER = { resum: function () { renderResum(); }, llistes: function () { renderSeg(); renderFilters(); renderList(); }, mapa: function () { drawMap(); }, fites: function () { renderFites(); }, punts: function () { renderPoints(); }, stats: function () { renderStats(); }, diari: function () { renderDiari(); } };
  var DIRTY = {};
  function flushView(v) { if (DIRTY[v]) { DIRTY[v] = false; if (RENDER[v]) RENDER[v](); } }
  function refreshAll() {
    Object.keys(RENDER).forEach(function (k) { DIRTY[k] = true; });
    flushView(view);
  }

  // ---------- events ----------
  $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { RET = null; showView(b.dataset.v); } });
  $('#listSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    $$('#listSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
    LS.list = b.dataset.l; LS.tipus = 'tots'; LS.grp = ''; renderFilters(); renderList(); $('#v-llistes').scrollTop = 0;
  });
  var qT = null;
  $('#q').addEventListener('input', function () { LS.q = this.value; clearTimeout(qT); qT = setTimeout(renderList, 120); });
  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.estat) LS.estat = b.dataset.estat;
    renderFilters(); renderList();
  });
  $('#fltBtn').addEventListener('click', openFilters);
  $('#list').addEventListener('click', function (e) {
    var li = e.target.closest('.row'); if (!li) return;
    var it = findItem(li.dataset.kind, li.dataset.i);
    if (e.target.closest('.wnt')) {
      var wasW = isWant(it.key); setWant(it.key, !wasW);
      toast(wasW ? 'Xa non é «Quero facer»: ' + it.name : '★ Quero facer: ' + it.name);
      if (LS.estat === 'vull' && wasW) { li.classList.add('leaving'); setTimeout(function () { renderFilters(); renderList(); }, 300); } else { renderFilters(); renderList(); }
      return;
    }
    if (e.target.closest('.chk')) {
      var was = isDone(it.key);
      if (was) delete S.done[it.key]; else S.done[it.key] = { d: today() };
      save();
      li.classList.toggle('done', !was); li.classList.remove('want'); var cb = $('.chk', li); if (cb) cb.textContent = '✓'; var wb = $('.wnt', li); if (wb) wb.remove();
      li.classList.remove('pop'); void li.offsetWidth; if (!was) li.classList.add('pop');
      var dEl = $('.meta', li);
      if (dEl && !was) dEl.insertAdjacentHTML('beforeend', '<span class="new-d"> · ' + fmtDate(today()) + '</span>');
      if (!((LS.estat === 'pend' && !was) || (LS.estat === 'fets' && was))) $('#listCount').textContent = $('#listCount').textContent.replace(/(\d+) fets/, function (m0, n0) { return (+n0 + (was ? -1 : 1)) + ' feitos'; });
      var leaving = (LS.estat === 'pend' && !was) || (LS.estat === 'fets' && was) || (LS.estat === 'vull' && !was);
      if (leaving) {
        li.style.height = li.offsetHeight + 'px'; void li.offsetWidth;
        setTimeout(function () { li.classList.add('leaving'); }, was ? 120 : 380);
      }
      softRefresh(leaving ? 820 : was ? 300 : 650);
      if (was) toast('Desmarcado: ' + it.name);
      else toast('✓ ' + it.name + ' · hoxe', 'Sen data', function () { var r = S.done[it.key]; if (r) { r.d = ''; if (r.a) r.a = [{ d: '', s: 'm' }]; save(); refreshAll(); toast('Data borrada'); } });
    }
    else openItem(it);
  });
  $('#pq').addEventListener('input', function () { P.q = this.value; renderPoints(); });
  $('#pfilters').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; P.g = b.dataset.g; renderPoints(); });
  $('#pCount').addEventListener('click', function (e) {
    if (e.target.closest('[data-pgrp]')) { groupsSheet(); return; }
    var b = e.target.closest('[data-pall]'); if (!b) return;
    var o = {}; if (b.dataset.pall === '1') { $$('#plist .pg-h').forEach(function (h) { o[h.dataset.pg] = 1; }); S.points.forEach(function (p) { if (p.g === 'Escalades') o['z:' + (zoneName(p.z) || 'Sense zona')] = 1; }); } pgSetOpen(o); renderPoints();
  });
  $('#plist').addEventListener('click', function (e) {
    var hd = e.target.closest('[data-pg]');
    if (hd) { if (P.q) return; var o = pgOpen(); o[hd.dataset.pg] = !o[hd.dataset.pg]; pgSetOpen(o); var y = $('#v-punts').scrollTop; renderPoints(); $('#v-punts').scrollTop = y; return; }
    var lr = e.target.closest('[data-rid]');
    if (lr) { if (lpDone()) return; if (SEL) { selToggle(lr); return; } openRoute(S.routes[+lr.dataset.rid]); return; }
    var li = e.target.closest('[data-pid]'); if (!li || lpDone()) return; if (SEL) { selToggle(li); return; } var p = S.points.filter(function (x) { return x.id === li.dataset.pid; })[0]; if (p) openPoint(p); });
  // mantenir premut (0,5 s sense moure's) = començar la selecció
  var lpT = null, lpXY = null, lpFired = 0;
  function lpDone() { if (lpFired) { lpFired = 0; return true; } return false; }
  ['touchstart', 'mousedown'].forEach(function (ev) {
    $('#v-punts').addEventListener(ev, function (e) {
      lpFired = 0;
      var li = e.target.closest('#plist .row, #rlist .row'); if (!li || SEL) return;
      var t = e.touches ? e.touches[0] : e; lpXY = [t.clientX, t.clientY];
      clearTimeout(lpT); lpT = setTimeout(function () { lpT = null; lpFired = Date.now(); selStart(li); }, 500);
    }, { passive: true });
  });
  ['touchmove', 'mousemove'].forEach(function (ev) {
    $('#v-punts').addEventListener(ev, function (e) { if (!lpT) return; var t = e.touches ? e.touches[0] : e; if (Math.abs(t.clientX - lpXY[0]) > 10 || Math.abs(t.clientY - lpXY[1]) > 10) { clearTimeout(lpT); lpT = null; } }, { passive: true });
  });
  ['touchend', 'touchcancel', 'mouseup'].forEach(function (ev) { $('#v-punts').addEventListener(ev, function () { clearTimeout(lpT); lpT = null; }, { passive: true }); });
  $('#v-punts').addEventListener('contextmenu', function (e) { if (e.target.closest('.row')) e.preventDefault(); });
  $('#rlist').addEventListener('click', function (e) {
    var li = e.target.closest('[data-rid]'); if (!li || lpDone()) return;
    if (SEL) { selToggle(li); return; }
    openRoute(S.routes[+li.dataset.rid]);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rs]'); if (!b || !SEL) return;
    var a = b.dataset.rs;
    if (a === 'cancel') { selEnd(); return; }
    if (a === 'all') { $$('#plist .row, #rlist .row').forEach(function (li) { if (!SEL[selKey(li)]) selToggle(li); }); return; }
    if (a === 'move') {
      var ks0 = Object.keys(SEL); if (!ks0.length) return;
      var hasR = ks0.some(function (k) { return k[0] === 'r'; });
      catSheet('Mover ' + ks0.length + ' elemento' + (ks0.length === 1 ? '' : 's'), null, hasR, function (g) {
        var np = 0, nr = 0;
        ks0.forEach(function (k) {
          if (k[0] === 'p') { if (g === 'Rutes') return; var p = S.points.filter(function (x) { return x.id === k.slice(2); })[0]; if (p) { p.g = g; np++; } }
          else { var r = S.routes[+k.slice(2)]; if (r) { if (g === 'Rutes') delete r.g; else r.g = g; nr++; } }
        });
        SEL = null; save(); refreshAll(); renderPoints(); closeSheet();
        var o = pgOpen(); o[g] = 1; pgSetOpen(o); renderPoints();
        toast((np + nr) + ' movido' + (np + nr === 1 ? '' : 's') + ' a ' + g);
      });
      return;
    }
    if (a === 'del') {
      var ks = Object.keys(SEL); if (!ks.length) return;
      var pids = ks.filter(function (k) { return k[0] === 'p'; }).map(function (k) { return k.slice(2); });
      var rts = ks.filter(function (k) { return k[0] === 'r'; }).map(function (k) { return S.routes[+k.slice(2)]; });
      var msg = [pids.length ? pids.length + ' punto' + (pids.length === 1 ? '' : 's') : '', rts.length ? rts.length + ' ruta' + (rts.length === 1 ? '' : 's') : ''].filter(Boolean).join(' i ');
      if (!confirm('Queres borrar ' + msg + '?')) return;
      S.points.forEach(function (p) { if (pids.indexOf(p.id) >= 0) unlinkPoint(p); });
      S.points = S.points.filter(function (p) { return pids.indexOf(p.id) < 0; });
      SEL = null; delRoutes(rts); toast('Borrado: ' + msg);
    }
  });
  $('#addPointBtn').addEventListener('click', function () { pointForm(null); });
  $('#scrim').addEventListener('click', closeSheet);
  $('#menuBtn').addEventListener('click', openMenu);
  $('#locBtn').addEventListener('click', nearMe);
  $('#layerBtn').addEventListener('click', function () { renderLayerPanel(); $('#layerPanel').classList.toggle('hidden'); });
  $('#layerPanel').addEventListener('click', function (e) {
    var h = e.target.closest('.lph'), q = e.target.closest('.lpa');
    if (h) { lpOpen = lpOpen === h.dataset.sec ? '' : h.dataset.sec; renderLayerPanel(); }
    if (q) { var o = {}; pgGroups().forEach(function (x) { o[x[0]] = q.dataset.all === '1'; }); mapOpts.pg = o; saveMapOpts(); renderLayerPanel(); drawMap(); }
  });
  $('#layerPanel').addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'base') { map.removeLayer(base[mapOpts.base]); mapOpts.base = t.value; base[t.value].addTo(map); }
    if (t.name === 'feec') mapOpts.feec = t.value;
    if (t.name === 'uiaa') mapOpts.uiaa = t.value;
    if (t.name === 'alps') mapOpts.alps = t.value;
    if (t.classList && t.classList.contains('lyG')) {
      if (mapOpts.pg === 'all') { var o = {}; pgGroups().forEach(function (x) { o[x[0]] = true; }); mapOpts.pg = o; }
      mapOpts.pg = mapOpts.pg || {}; mapOpts.pg[t.dataset.g] = t.checked;
    }
    if (t.id === 'lyR') mapOpts.routes = t.checked;
    if (t.id === 'lyDone') { ['feec', 'uiaa', 'alps'].forEach(function (k) { mapOpts[k] = t.checked ? 'fets' : 'tots'; }); renderLayerPanel(); }
    else if (t.name === 'feec' || t.name === 'uiaa' || t.name === 'alps') { var c = $('#lyDone'); if (c) c.checked = onlyDone(); }
    saveMapOpts();
    drawMap();
    if (t.name || (t.classList && t.classList.contains('lyG'))) renderLayerPanel();
  });

  // refresc complet ajornat (així l'animació de la fila no es talla)
  var softT = null;
  function softRefresh(ms) {
    clearTimeout(softT);
    softT = setTimeout(function () { refreshAll(); checkMedals(false); }, ms);
  }

  // foto a pantalla completa: tocar la foto de la fitxa l'obre sencera; tocar o enrere la tanca
  function openPhoto(src) {
    var o = document.createElement('div'); o.id = 'phView';
    o.innerHTML = '<img alt=""><button class="ph-x" aria-label="Pechar">✕</button>';
    o.querySelector('img').src = src;
    o.addEventListener('click', closePhoto);
    document.body.appendChild(o);
  }
  function closePhoto() { var o = $('#phView'); if (!o) return false; o.classList.add('out'); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 160); return true; }
  document.addEventListener('click', function (e) {
    var im = e.target.closest('#sheet .photo img'); if (im && im.src) openPhoto(im.src);
  });

  // Botó enrere d'Android: retorna true si l'app l'ha gestionat
  // tornar a la pantalla d'on véns (p. ex. Fites → Veure llista → enrere)
  var RET = null;
  function retSet(extra) { var vv = $('#v-' + view); RET = Object.assign({ v: view, y: vv ? vv.scrollTop : 0, w: window.scrollY || 0 }, extra || {}); }
  function retGo() {
    var r = RET; RET = null; if (!r) return false;
    showView(r.v);
    setTimeout(function () {
      var vv = $('#v-' + r.v); if (vv) vv.scrollTop = r.y; window.scrollTo(0, r.w || 0);
      if (r.com) { var p = $('#v-fites path[data-com="' + r.com.replace(/"/g, '\\"') + '"]'); if (p) p.dispatchEvent(new MouseEvent('click', { bubbles: true })); if (vv) vv.scrollTop = r.y; window.scrollTo(0, r.w || 0); }
    }, 120);
    return true;
  }
  window.onAndroidBack = function () {
    if ($('#phView')) { closePhoto(); return true; }
    if (SEL) { selEnd(); return true; }
    if (!$('#celebrate').classList.contains('hidden')) { $('#celebrate').classList.add('hidden'); return true; }
    if (sheetOpen) { if (SHEET_UP) { var up = SHEET_UP; SHEET_UP = null; up(); } else if (FROM_MENU && !MENU_SHOWN) openMenu(); else closeSheet(); return true; }
    if (!$('#layerPanel').classList.contains('hidden')) { $('#layerPanel').classList.add('hidden'); return true; }
    if (pickMode) { pickMode = false; draft = null; toast('Cancelado'); return true; }
    if (RET && RET.v !== view && retGo()) return true;
    if (view !== 'resum') { showView('resum'); return true; }
    return false;
  };

  function ptOwn(p) { var a = (p.ds || []).slice(); if (p.d && a.indexOf(p.d) < 0) a.push(p.d); return a.filter(Boolean).sort(); }
  // sortides d'altres punts on aquest punt és un dels cims (clau 'p:id' a v.cm)
  function ptIncl(p) {
    var out = [], key = 'p:' + p.id;
    S.points.forEach(function (q) { if (q !== p) (q.vs || []).forEach(function (v) { if (v.cm && v.cm.indexOf(key) >= 0) out.push({ p: q, v: v }); }); });
    return out;
  }
  function ptDates(p) { var a = ptOwn(p); ptIncl(p).forEach(function (x) { if (x.v.d && a.indexOf(x.v.d) < 0) a.push(x.v.d); }); return a.sort(); }
  var STRAVA_NT = /(\s*·\s*)?Strava: \d+ vegades, última \d\d\/\d\d\/\d{4}/;
  // Dades puntuals que arriben en un fitxer d'importació personal (no són al codi): només omplen el que falta
  function ptFind(r) { return S.points.filter(function (x) { return x.id === r[0] && norm(x.n) === norm(r[1]); })[0] || S.points.filter(function (x) { return norm(x.n) === norm(r[1]); })[0]; }
  function importAscNotes(L) {
    var n = 0;
    (L || []).forEach(function (r) {
      twinKeys(r[0]).forEach(function (k) {
        var rec = S.done[k]; if (!rec) return;
        var A = ascList(rec).map(function (x) { return Object.assign({}, x); }), hit = false;
        A.forEach(function (x) { if (x.d === r[1] && !x.c) { x.c = r[2]; hit = true; } });
        if (hit) { rec.a = A; if (k === r[0]) n++; }
      });
    });
    return n;
  }
  function importPtDates(L) {
    var n = 0;
    (L || []).forEach(function (r) {
      var p = ptFind(r); if (!p || p.vs) return; // les escalades amb sortides ja tenen les seves dates
      var before = JSON.stringify([p.d, p.ds, p.nt]);
      var all = ptOwn(p); r[2].forEach(function (d) { if (all.indexOf(d) < 0) all.push(d); }); all.sort();
      p.d = all[0]; if (all.length > 1) p.ds = all; else delete p.ds;
      if (p.nt) p.nt = p.nt.replace(STRAVA_NT, '').trim();
      if (JSON.stringify([p.d, p.ds, p.nt]) !== before) n++;
    });
    return n;
  }
  function importPtAlt(L) {
    var n = 0;
    (L || []).forEach(function (r) { var p = ptFind(r); if (p && (p.h == null || p.h === '')) { p.h = r[2]; n++; } });
    return n;
  }
  // v0.71: salides d'alpinisme que només tenien dates (i «Sortides» buit): es creen les sortides amb aquestes dates i
  // s'hi enllacen els cims que ja tenies fets aquell dia (amb qui hi vas anar, si ho tenies apuntat). Una sola vegada.
  function visitBackfill() {
    if (S.m71) return; S.m71 = 1;
    S.points.forEach(function (p) {
      if (p.g !== 'Alpinisme') return;
      var V = p.vs || [], have = {}, add = [];
      V.forEach(function (v) { if (v.d) have[v.d] = 1; });
      ptOwn(p).forEach(function (d) { if (/^\d{4}-\d\d-\d\d$/.test(d) && !have[d]) { have[d] = 1; var nv = { d: d, t: 'Alpinisme' }; V.push(nv); add.push(nv); } });
      V.forEach(function (v) {
        if (!/^\d{4}-\d\d-\d\d$/.test(v.d || '') || (v.cm && v.cm.length)) return;
        var ks = cimsDoneOn(v.d); if (!ks.length) return;
        v.cm = ks; v.id = v.id || uid();
        if (!v.c) {
          var cc = [];
          ks.forEach(function (k) { ascList(S.done[k]).forEach(function (x) { if (x.d === v.d && x.c && cc.indexOf(x.c) < 0) cc.push(x.c); }); });
          if (cc.length) v.c = cc[0];
        }
        syncVisit(p, v, []);
      });
      var tw = S.points.filter(function (y) { return y !== p && y.g === 'Cims' && !officialPoint(y) && norm(y.n) === norm(p.n); })[0];
      if (tw) V.forEach(function (v) { v.cm = v.cm || []; if (v.cm.indexOf('p:' + tw.id) < 0) v.cm.push('p:' + tw.id); v.id = v.id || uid(); });
      if (V.length) { p.vs = V.sort(function (x, y) { return (x.d || '') < (y.d || '') ? -1 : (x.d || '') > (y.d || '') ? 1 : 0; }); }
    });
  }
  // sense suggeriments ni autocompleció en cap quadre de text
  function noSug(el) { if (el.nodeType !== 1) return; var L = el.matches && el.matches('input,textarea') ? [el] : []; if (el.querySelectorAll) L = L.concat([].slice.call(el.querySelectorAll('input,textarea'))); L.forEach(function (t) { t.setAttribute('autocomplete', 'off'); t.setAttribute('autocorrect', 'off'); t.setAttribute('spellcheck', 'false'); }); }
  try { noSug(document.body); new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, noSug); }); }).observe(document.body, { childList: true, subtree: true }); } catch (e) { }
  function ckBackfill() {
    if (S.m74) return; S.m74 = 1;
    S.points.forEach(function (p) {
      if (!climbGroup(p) || (p.ck && p.ck.length)) return;
      var ks = []; (p.vs || []).forEach(function (v) { (v.cm || []).forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); }); });
      if (!ks.length) return;
      p.ck = ks;
    });
  }
  // punts d'escalada/alpinisme amb sortides: cada data del punt ha de ser una sortida (les dates soltes es converteixen en sortida)
  function orphanDates() {
    S.points.forEach(function (p) {
      if (!climbGroup(p) || !p.vs || !p.vs.length) return;
      var have = {}; p.vs.forEach(function (v) { if (v.d) have[v.d] = 1; });
      var nw = ptOwn(p).filter(function (d) { return d && !have[d]; });  // també dates en text («2015», «hivern 2010»…)
      if (!nw.length) return;
      nw.forEach(function (d) {
        var v = { d: d, t: vsDefT(p) }; p.vs.push(v);
        if (p.ck && p.ck.length && /^\d{4}-\d\d-\d\d$/.test(d)) {
          v.cm = p.ck.slice(); v.id = uid(); syncVisit(p, v, []);
          v.cm.forEach(function (k) { twinKeys(k).forEach(function (kk) { if (S.done[kk] && !v.c) ascList(S.done[kk]).forEach(function (x) { if (x.vid === v.id && x.c && !v.c) v.c = x.c; }); }); });
        }
      });
      p.vs.sort(function (x, y) { return (x.d || '') < (y.d || '') ? -1 : (x.d || '') > (y.d || '') ? 1 : 0; });
    });
  }
  function dropLabels() { if (S.m76) return; S.m76 = 1; S.points.forEach(function (p) { (p.vs || []).forEach(function (v) { delete v.e; }); }); }
  S = load(); syncTwins(); visitBackfill(); ckBackfill(); orphanDates(); dropLabels(); S.points.forEach(function (p) { if (climbGroup(p)) ckCoords(p); });
  save(); flushSave();
  setTopFor(view);
  refreshAll();
  checkMedals(true);
  cloudOnStart();
  refreshBadge();
  otaOnStart();
})();
