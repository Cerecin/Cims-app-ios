/* Exporta l'estat de l'app a KMZ per a Google Earth (carpetes com al KMZ original). */
(function () {
  'use strict';
  function x(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fd(d) { var p = (d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  // colors KML: aabbggrr
  var GROUP_STYLE = { Cims: 'red', Internacionals: 'red', Astúries: 'red', Galícia: 'red', Escalades: 'green', Ferrades: 'green', Alpinisme: 'cyan', Projectes: 'pink' };
  var STYLES = { red: 'ff0000ff', green: 'ff00aa00', cyan: 'ffffff00', pink: 'ffffaaff', gray: 'ffa0a0a0', done: 'ff4b9f2f', ess: 'ffa85b6b', uiaa: 'ffc08c5b' };
  function style(id, color) {
    return '<Style id="' + id + '"><IconStyle><color>' + color + '</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle>' +
      '<LabelStyle><scale>0.8</scale></LabelStyle></Style>';
  }
  function pm(name, desc, st, la, lo) {
    return '<Placemark><name>' + x(name) + '</name>' + (desc ? '<description>' + x(desc) + '</description>' : '') + '<styleUrl>#' + st + '</styleUrl>' +
      '<Point><coordinates>' + lo + ',' + la + ',0</coordinates></Point></Placemark>';
  }
  function ascTxt(r) {
    var a = r.a && r.a.length ? r.a : [{ d: r.d || '' }];
    if (a.length === 1) return a[0].d ? fd(a[0].d) : 'sense data';
    return a.length + ' ascensions: ' + a.map(function (x) { return x.d ? fd(x.d) : 'sense data'; }).join(', ');
  }
  function folder(name, body, visible) { return '<Folder><name>' + x(name) + '</name>' + (visible === false ? '<visibility>0</visibility>' : '') + body + '</Folder>'; }

  window.buildKmz = function (S) {
    var D = window.DATA, out = [];
    Object.keys(STYLES).forEach(function (k) { out.push(style('s_' + k, STYLES[k])); });
    out.push('<Style id="s_route"><LineStyle><color>ff2b82d9</color><width>3</width></LineStyle></Style>');
    // Els meus punts, per grup (mateixa estructura que el KMZ original)
    var groups = [];
    S.points.forEach(function (p) { if (groups.indexOf(p.g || 'Altres') < 0) groups.push(p.g || 'Altres'); });
    groups.forEach(function (g) {
      var body = S.points.filter(function (p) { return (p.g || 'Altres') === g && p.la != null; }).map(function (p) {
        var d = [p.h != null ? p.h + ' m' : '', p.d ? fd(p.d) : '', p.nt || ''].filter(Boolean).join(' · ');
        return pm(p.n, d, 's_' + (GROUP_STYLE[g] || 'gray'), p.la, p.lo);
      }).join('');
      if (body) out.push(folder(g, body));
    });
    // 100 Cims
    var fDone = D.feec.filter(function (f) { return S.done['f:' + f.id]; });
    out.push(folder('100 Cims FEEC · fets (' + fDone.length + ')', fDone.map(function (f) {
      var r = S.done['f:' + f.id];
      return pm(f.n + ' (' + Math.round(f.h) + ' m)', [f.e ? 'Essencial' : 'No essencial', f.r, ascTxt(r), r.nt || ''].filter(Boolean).join(' · '), 's_done', f.la, f.lo);
    }).join('')));
    var ePend = D.feec.filter(function (f) { return f.e && !S.done['f:' + f.id]; });
    out.push(folder('100 Cims FEEC · essencials pendents (' + ePend.length + ')', ePend.map(function (f) {
      return pm(f.n + ' (' + Math.round(f.h) + ' m)', f.r, 's_ess', f.la, f.lo);
    }).join(''), false));
    // Tresmils (només els que tenen coordenades)
    var uDone = D.uiaa.filter(function (u) { return S.done['u:' + u.id] && u.la != null; });
    out.push(folder('3000 Pirineu · fets (' + uDone.length + ')', uDone.map(function (u) {
      var r = S.done['u:' + u.id];
      return pm(u.n + ' (' + Math.round(u.h) + ' m)', [u.z, u.k === 'P' ? 'Principal' : u.k === 'S' ? 'Secundari' : '', ascTxt(r)].filter(Boolean).join(' · '), 's_done', u.la, u.lo);
    }).join('')));
    var uPend = D.uiaa.filter(function (u) { return !S.done['u:' + u.id] && u.la != null; });
    out.push(folder('3000 Pirineu · pendents (' + uPend.length + ')', uPend.map(function (u) {
      return pm(u.n + ' (' + Math.round(u.h) + ' m)', u.z, 's_uiaa', u.la, u.lo);
    }).join(''), false));
    // 4000 dels Alps (si la llista està activa)
    if ((!S.lists || S.lists.alps !== false) && D.alps && D.alps.length) {
      var aDone = D.alps.filter(function (a) { return S.done['a:' + a.id] && a.la != null; });
      out.push(folder('4000 Alps · fets (' + aDone.length + ')', aDone.map(function (a) {
        return pm(a.n + ' (' + a.h + ' m)', [a.z, a.k === 'P' ? 'Principal' : 'Secundari', ascTxt(S.done['a:' + a.id])].join(' · '), 's_done', a.la, a.lo);
      }).join('')));
      var aPend = D.alps.filter(function (a) { return !S.done['a:' + a.id] && a.la != null; });
      out.push(folder('4000 Alps · pendents (' + aPend.length + ')', aPend.map(function (a) { return pm(a.n + ' (' + a.h + ' m)', a.z, 's_uiaa', a.la, a.lo); }).join(''), false));
    }
    // Rutes
    out.push(folder('Rutes', (S.routes || []).filter(function (r) { return r.c && r.c.length > 1; }).map(function (r) {
      return '<Placemark><name>' + x(r.n) + '</name><description>' + x([r.km ? r.km + ' km' : '', r.up ? '+' + r.up + ' m' : '', r.d ? fd(r.d) : r.y || ''].filter(Boolean).join(' · ')) + '</description>' +
        '<styleUrl>#s_route</styleUrl><LineString><tessellate>1</tessellate><coordinates>' + r.c.map(function (c) { return c[1] + ',' + c[0] + ',0'; }).join(' ') + '</coordinates></LineString></Placemark>';
    }).join('')));
    var kml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Cims</name><open>1</open>' + out.join('') + '</Document></kml>';
    var zip = new JSZip(); zip.file('doc.kml', kml);
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  };
})();
