/* Icones de les medalles: SVG propi, un sistema coherent.
   MedalIcon(m, {size}) -> HTML. Medalla aconseguida = metall; pendent = gris amb anell de progrés. */
(function () {
  var TIERS = {
    gold: { a: '#FCEAB4', b: '#EBC25A', c: '#C9962A', ring1: '#E9C560', ring2: '#B8841F', ink: '#5C3F0A', soft: '#FFF4D2' },
    silver: { a: '#F8FAF9', b: '#D5DCD8', c: '#A5B0AA', ring1: '#C4CCC8', ring2: '#8E9B95', ink: '#34403B', soft: '#FFFFFF' },
    emerald: { a: '#CFF2E3', b: '#6FC6A7', c: '#2D8366', ring1: '#6FC6A7', ring2: '#1F6650', ink: '#FFFFFF', soft: '#D9F6EA' }
  };
  var defsDone = false;
  function defs() {
    if (defsDone || typeof document === 'undefined') return;
    defsDone = true;
    var g = '';
    Object.keys(TIERS).forEach(function (k) {
      var t = TIERS[k];
      g += '<radialGradient id="mg-' + k + '" cx="32%" cy="26%" r="85%"><stop offset="0" stop-color="' + t.a + '"/><stop offset=".55" stop-color="' + t.b + '"/><stop offset="1" stop-color="' + t.c + '"/></radialGradient>' +
        '<linearGradient id="mr-' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + t.ring1 + '"/><stop offset="1" stop-color="' + t.ring2 + '"/></linearGradient>';
    });
    g += '<radialGradient id="mg-lock" cx="32%" cy="26%" r="90%"><stop offset="0" stop-color="#F3F5F1"/><stop offset="1" stop-color="#DCE0D9"/></radialGradient>' +
      '<radialGradient id="mg-lockd" cx="32%" cy="26%" r="90%"><stop offset="0" stop-color="#2D373D"/><stop offset="1" stop-color="#222B30"/></radialGradient>';
    var s = document.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<svg width="0" height="0"><defs>' + g + '</defs></svg>';
    document.body.appendChild(s);
  }

  // glifs (caixa 72x72, centre 36,36). «f» = color de farciment, «s» = color suau (neu / ressalts)
  var G = {
    peak: function (f, s, dy) {
      dy = dy || 0;
      return '<path d="M17 ' + (50 + dy) + 'L31 ' + (26 + dy) + 'L37.5 ' + (36 + dy) + 'L42 ' + (30 + dy) + 'L55 ' + (50 + dy) + 'Z" fill="' + f + '"/>' +
        '<path d="M31 ' + (26 + dy) + 'L26.4 ' + (33.8 + dy) + 'L31 ' + (31.6 + dy) + 'L34.4 ' + (33.6 + dy) + 'L37.5 ' + (36 + dy) + 'Z" fill="' + s + '"/>';
    },
    mini: function (f) { return '<path d="M27 53L36 43.5L39.5 48L42.5 45.5L49 53Z" fill="' + f + '"/>'; },
    range: function (f, s) {
      return '<path d="M12 50L25 31L31 40L38 24L52 50Z" fill="' + f + '" opacity=".55"/><path d="M26 50L40 29L47 39L51 34L62 50Z" fill="' + f + '"/>' +
        '<path d="M38 24L34 31L38 29.6L41.4 31.4Z" fill="' + s + '"/>';
    },
    flag: function (f, s) {
      return '<path d="M14 52L29 33L35 41L41 34L58 52Z" fill="' + f + '"/><path d="M29 33V17" stroke="' + f + '" stroke-width="2.6" stroke-linecap="round"/><path d="M29.6 17.6L43 22.4L29.6 27.4Z" fill="' + s + '"/>';
    },
    pin: function (f, s, check) {
      return '<path d="M36 54C28 45 22.5 38.8 22.5 31.5a13.5 13.5 0 0 1 27 0C49.5 38.8 44 45 36 54Z" fill="' + f + '"/>' +
        (check ? '<path d="M30 31.5l4.4 4.6 8-9" fill="none" stroke="' + s + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' : '<circle cx="36" cy="31.5" r="5" fill="' + s + '"/>');
    },
    gem: function (f, s) {
      return '<path d="M24 25h24l8.5 10.5L36 55 15.5 35.5Z" fill="' + f + '"/><path d="M15.5 35.5h41M24 25l6.5 10.5L36 55M48 25l-6.5 10.5L36 55M30.5 35.5L36 25l5.5 10.5" fill="none" stroke="' + s + '" stroke-width="1.8" stroke-linejoin="round" opacity=".95"/>';
    },
    flake: function (f) {
      var o = '';
      for (var i = 0; i < 3; i++) o += '<g transform="rotate(' + (i * 60) + ' 36 36)"><path d="M36 17V55" stroke="' + f + '" stroke-width="3" stroke-linecap="round"/><path d="M36 22l-5 -4M36 22l5 -4M36 50l-5 4M36 50l5 4" stroke="' + f + '" stroke-width="2.6" stroke-linecap="round"/></g>';
      return o;
    },
    senyera: function (f, s) {
      var o = '<rect x="18" y="20" width="36" height="32" rx="4" fill="' + s + '"/>';
      for (var i = 0; i < 4; i++) o += '<rect x="18" y="' + (24 + i * 7.4) + '" width="36" height="3.6" fill="' + f + '"/>';
      return o;
    },
    roof: function (f, s) {
      return '<path d="M16 54L30 33L36 42L41 36L56 54Z" fill="' + f + '"/><path d="M30 33l-4 6 4-2 3 2 3-3Z" fill="' + s + '"/><path d="M20 22H52" stroke="' + f + '" stroke-width="3" stroke-linecap="round"/><path d="M36 22v5" stroke="' + f + '" stroke-width="3" stroke-linecap="round"/>';
    },
    laurel: function (f) {
      var o = '';
      [-1, 1].forEach(function (sd) {
        for (var i = 0; i < 5; i++) {
          var y = 49 - i * 6.2, x = 36 + sd * (20 - i * 1.4);
          o += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="3" ry="5.2" transform="rotate(' + (sd * (28 - i * 6)) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + f + '" opacity=".9"/>';
        }
      });
      return o;
    },
    num: function (t, f, y, fs) {
      return '<text x="36" y="' + y + '" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="700" font-size="' + fs + '" fill="' + f + '" style="font-variation-settings:\'opsz\' 72">' + t + '</text>';
    }
  };

  // quin dibuix i quin metall té cada medalla
  function spec(m) {
    var id = m.id, p = id.split(':')[0];
    if (id === 'e100') return { t: 'gold', g: 'e100' };
    if (id === 'eall' || id === 'call' || id === 'aall' || id === 'uall') return { t: 'emerald', g: 'gem' };
    if (/^c\d+$/.test(id)) return { t: +id.slice(1) % 100 ? 'silver' : 'gold', g: 'num', n: id.slice(1) };
    if (p === 'ce') return { t: 'silver', g: 'pin' };
    if (p === 'ca') return { t: 'emerald', g: 'pinok' };
    if (p === 'zp') return { t: 'silver', g: 'range' };
    if (p === 'zt') return { t: 'gold', g: 'flag' };
    if (p === 'za') return { t: 'emerald', g: 'range' };
    if (id === 'a50') return { t: 'silver', g: 'num', n: '50', alps: 1 };
    if (id === 'ahalf') return { t: 'gold', g: 'half' };
    if (id === 'u1') return { t: 'silver', g: 'flake' };
    if (id === 'up') return { t: 'gold', g: 'range' };
    if (id === 'cat') return { t: 'gold', g: 'senyera' };
    if (id === 'sos') return { t: 'gold', g: 'roof' };
    return { t: m.tier === 'silver' ? 'silver' : 'gold', g: 'peak' };
  }

  function glyph(sp, c) {
    var f = c.f, s = c.s;
    switch (sp.g) {
      case 'num': var n = sp.n, big = n.length <= 2; return G.num(n, f, big ? 40 : 38, big ? 24 : 19) + G.mini(f);
      case 'e100': return G.laurel(f).replace(/opacity=".9"/g, 'opacity=".5"') + G.num('100', f, 41, 19);
      case 'gem': return G.gem(f, s);
      case 'pin': return G.pin(f, s, false);
      case 'pinok': return G.pin(f, s, true);
      case 'range': return G.range(f, s);
      case 'flag': return G.flag(f, s);
      case 'flake': return G.flake(f);
      case 'senyera': return G.senyera(f, s);
      case 'roof': return G.roof(f, s);
      case 'half': return G.peak(f, s) + G.num('½', f, 25, 15).replace('x="36"', 'x="50"');
      default: return G.peak(f, s);
    }
  }

  // done: medalla aconseguida; fr: progrés 0..1 (només si no està aconseguida)
  // imatge pròpia d'una medalla: per id exacte, per sèrie (abans dels «:») o per sèrie sense xifres finals (c50 -> c, sos25 -> sos)
  function medImg(m) {
    var T = window.MEDIMG; if (!T || !m || !m.id) return null;
    var id = m.id;
    return T[id] || T[id.split(':')[0]] || T[id.replace(/\d+$/, '')] || null;
  }
  window.MedalImg = medImg;
  window.MedalIcon = function (m, o) {
    defs();
    o = o || {};
    var size = o.size || 64, done = !!o.done, fr = Math.max(0, Math.min(1, o.fr || 0));
    var mim = medImg(m);
    if (mim) size = Math.round(size * 1.3);
    if (mim) return '<span class="mimg' + (done ? '' : ' off') + '" style="width:' + size + 'px;height:' + size + 'px"><img src="' + mim + '" alt="" decoding="async" loading="lazy"></span>';
    var sp = spec(m), t = TIERS[sp.t], dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (document.documentElement.getAttribute('data-theme') !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var R = 33, C = 2 * Math.PI * R, out = '<svg class="mi' + (done ? ' mi-on' : '') + '" viewBox="0 0 72 72" width="' + size + '" height="' + size + '" role="img">';
    if (done) {
      out += '<circle cx="36" cy="36" r="33" fill="none" stroke="url(#mr-' + sp.t + ')" stroke-width="3.2"/>' +
        '<circle cx="36" cy="36" r="29" fill="url(#mg-' + sp.t + ')"/>' +
        '<circle cx="36" cy="36" r="25.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>' +
        '<path d="M14 26A24 24 0 0 1 36 11" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>' +
        glyph(sp, { f: t.ink, s: t.soft });
    } else {
      out += '<circle cx="36" cy="36" r="' + R + '" fill="none" style="stroke:var(--track)" stroke-width="3.2"/>' +
        (fr > 0 ? '<circle cx="36" cy="36" r="' + R + '" fill="none" style="stroke:var(--pine)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="' + (C * fr).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 36 36)"/>' : '') +
        '<circle cx="36" cy="36" r="29" fill="url(#mg-' + (dark ? 'lockd' : 'lock') + ')"/>' +
        glyph(sp, { f: dark ? '#5A676E' : '#B3BAB2', s: dark ? '#2A343A' : '#ECEFEA' });
    }
    return out + '</svg>';
  };
})();
