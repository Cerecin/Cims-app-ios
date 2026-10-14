/* Genera l'Excel de seguiment a partir de plantilla.xlsx.
   Es modifica l'XML directament (es conserven colors, taules, filtres, barres i fórmules).
   Pestanyes i columnes es localitzen pel nom (fila 4 = capçaleres), així la plantilla pot canviar. */
(function () {
  'use strict';
  var HROW = 4;

  function xesc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function unxml(s) {
    return s.replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(+d); })
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  }
  function colNum(c) { var n = 0; for (var i = 0; i < c.length; i++) n = n * 26 + (c.charCodeAt(i) - 64); return n; }
  function colName(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function dateSerial(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return null;
    return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
  }
  var ROW_RE = /<row [^>]*?r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g;
  var CELL_RE = /<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g;

  function sharedStrings(xml) {
    var out = [], re = /<si>([\s\S]*?)<\/si>/g, m;
    if (!xml) return out;
    while ((m = re.exec(xml))) { var t = '', r2 = /<t[^>]*>([\s\S]*?)<\/t>/g, k; while ((k = r2.exec(m[1]))) t += unxml(k[1]); out.push(t); }
    return out;
  }
  function cellText(cellXml, ss) {
    if (!cellXml) return '';
    var head = cellXml.split('>')[0], t = /\bt="(\w+)"/.exec(head), v = /<v>([\s\S]*?)<\/v>/.exec(cellXml);
    if (t && t[1] === 's' && v) return ss[+v[1]] || '';
    if (t && t[1] === 'inlineStr') { var parts = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []; return unxml(parts.map(function (p) { return p.replace(/<[^>]+>/g, ''); }).join('')); }
    return v ? unxml(v[1]) : '';
  }
  function getCell(rowXml, col) { var m = new RegExp('<c r="' + col + '\\d+"[^>]*?(?:/>|>[\\s\\S]*?</c>)').exec(rowXml); return m ? m[0] : null; }
  function hasFormula(cellXml) { return !!cellXml && /<f[\s>\/]/.test(cellXml); }
  function styleOf(cellXml) { var m = cellXml && /\bs="(\d+)"/.exec(cellXml.split('>')[0]); return m ? m[1] : null; }
  function sAttr(s) { return s ? ' s="' + s + '"' : ''; }
  function strCell(ref, s, text) {
    if (text == null || text === '') return '<c r="' + ref + '"' + sAttr(s) + '/>';
    return '<c r="' + ref + '"' + sAttr(s) + ' t="inlineStr"><is><t xml:space="preserve">' + xesc(text) + '</t></is></c>';
  }
  function numCell(ref, s, n) {
    if (n == null || n === '' || isNaN(n)) return '<c r="' + ref + '"' + sAttr(s) + '/>';
    return '<c r="' + ref + '"' + sAttr(s) + '><v>' + n + '</v></c>';
  }
  function fCell(ref, s, f) { return '<c r="' + ref + '"' + sAttr(s) + ' t="str"><f>' + xesc(f) + '</f></c>'; }
  function setCell(rowXml, col, row, make) {
    var old = getCell(rowXml, col), cell = make(col + row, styleOf(old));
    if (old) return rowXml.replace(old, function () { return cell; });
    var open = /^<row[^>]*>/.exec(rowXml)[0], body = rowXml.slice(open.length, rowXml.length - 6);
    var cells = body.match(CELL_RE) || [], n = colNum(col), out = [], done = false;
    cells.forEach(function (c) { if (!done && colNum(/<c r="([A-Z]+)/.exec(c)[1]) > n) { out.push(cell); done = true; } out.push(c); });
    if (!done) out.push(cell);
    return open + out.join('') + '</row>';
  }
  function mapRows(xml, fn) {
    return xml.replace(ROW_RE, function (rx, r) { if (!/<\/row>$/.test(rx)) rx = rx.replace(/\/>$/, '></row>'); return fn(rx, +r); });
  }
  function rowXml(xml, r) { var m = new RegExp('<row [^>]*?r="' + r + '"[^>]*?(?:/>|>[\\s\\S]*?</row>)').exec(xml); return m ? m[0] : ''; }
  function headers(xml, ss) {
    var h = {}, rx = rowXml(xml, HROW);
    (rx.match(CELL_RE) || []).forEach(function (c) { var t = cellText(c, ss).trim(); if (t) h[t] = /<c r="([A-Z]+)/.exec(c)[1]; });
    return h;
  }

  // registre d'ascensions d'un cim fet: [{d}] (si no n'hi ha, una sola amb la data del cim)
  function ascOf(rec) { return !rec ? [] : rec.a && rec.a.length ? rec.a : [{ d: rec.d || '' }]; }
  function fdate(d) { var p = (d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : 'sense data'; }
  function ascCells(rx, h, r, rec) {
    var a = ascOf(rec);
    if (h['Ascensions']) rx = setCell(rx, h['Ascensions'], r, function (ref, s) { return numCell(ref, s, a.length || null); });
    if (h['Dates de les ascensions']) rx = setCell(rx, h['Dates de les ascensions'], r, function (ref, s) { return strCell(ref, s, a.map(function (x) { return fdate(x.d); }).join(' · ')); });
    return rx;
  }
  window.buildXlsx = function (S, opts) {
    var D = window.DATA;
    var fById = {}, uById = {}, fByName = {}, uByName = {}, sByCom = {};
    D.feec.forEach(function (f) { fById[f.id] = f; (fByName[f.n] = fByName[f.n] || []).push(f); });
    D.uiaa.forEach(function (u) { uById[u.id] = u; (uByName[u.n] = uByName[u.n] || []).push(u); });
    var aByName = {}; (D.alps || []).forEach(function (x) { aByName[x.n] = x; });
    D.sostres.forEach(function (s) { sByCom[s.com] = s; });
    var ptsF = {}, ptsU = {};
    S.points.forEach(function (p) {
      if (p.f) (ptsF[p.f] = ptsF[p.f] || []).push(p.n);
      if (p.u) (ptsU[p.u] = ptsU[p.u] || []).push(p.n);
    });
    var uniq = function (a) { return (a || []).filter(function (x, i) { return a.indexOf(x) === i; }).join(' · '); };
    var done = function (k) { return S.done[k]; };

    return fetch(opts && opts.template || 'plantilla.xlsx').then(function (r) { if (!r.ok) throw new Error('No es troba la plantilla'); return r.arrayBuffer(); })
      .then(function (buf) { return JSZip.loadAsync(buf); })
      .then(function (zip) {
        var rd = function (n) { return zip.file(n) ? zip.file(n).async('string') : Promise.resolve(null); };
        return Promise.all([rd('xl/workbook.xml'), rd('xl/_rels/workbook.xml.rels'), rd('xl/sharedStrings.xml'), rd('[Content_Types].xml')]).then(function (base) {
          var wb = base[0], wbr = base[1], ss = sharedStrings(base[2]), ct = base[3];
          // nom de pestanya -> fitxer
          var rel = {}; (wbr.match(/<Relationship [^>]*\/>/g) || []).forEach(function (r) { var id = /Id="([^"]+)"/.exec(r)[1], t = /Target="([^"]+)"/.exec(r)[1]; rel[id] = t.replace(/^\/?xl\//, '').replace(/^\//, ''); });
          var sheets = {}; (wb.match(/<sheet [^>]*\/>/g) || []).forEach(function (s) { sheets[unxml(/name="([^"]+)"/.exec(s)[1])] = 'xl/' + rel[/r:id="([^"]+)"/.exec(s)[1]]; });
          var names = Object.keys(sheets);
          return Promise.all(names.map(function (n) { return rd(sheets[n]); })).then(function (xs) {
            var X = {}; names.forEach(function (n, i) { X[n] = xs[i]; });
            var tasks = [];

            // --- 100 Cims FEEC
            if (X['100 Cims FEEC']) {
              var h1 = headers(X['100 Cims FEEC'], ss);
              X['100 Cims FEEC'] = mapRows(X['100 Cims FEEC'], function (rx, r) {
                if (r <= HROW) return rx;
                var name = cellText(getCell(rx, h1['Cim']), ss); if (!name) return rx;
                var h = +cellText(getCell(rx, h1['Altitud (m)']), ss), c = fByName[name] || [];
                var f = c.length === 1 ? c[0] : c.filter(function (x) { return Math.abs(x.h - h) < 2; })[0]; if (!f) return rx;
                var rec = done('f:' + f.id);
                if (h1['Assolit']) rx = setCell(rx, h1['Assolit'], r, function (ref, s) { return strCell(ref, s, rec ? 'Sí' : 'No'); });
                if (h1['Data']) rx = setCell(rx, h1['Data'], r, function (ref, s) { return numCell(ref, s, rec ? dateSerial(rec.d) : null); });
                if (h1['Punt(s) al meu KMZ']) rx = setCell(rx, h1['Punt(s) al meu KMZ'], r, function (ref, s) { return strCell(ref, s, uniq(ptsF[f.id])); });
                return ascCells(rx, h1, r, rec);
              });
            }
            // --- 3000 Pirineu
            if (X['3000 Pirineu']) {
              var h3 = headers(X['3000 Pirineu'], ss);
              X['3000 Pirineu'] = mapRows(X['3000 Pirineu'], function (rx, r) {
                if (r <= HROW) return rx;
                var c = uByName[cellText(getCell(rx, h3['Cim']), ss)] || []; if (!c.length) return rx;
                var u = c[0], rec = done('u:' + u.id);
                if (h3['Assolit']) rx = setCell(rx, h3['Assolit'], r, function (ref, s) { return strCell(ref, s, rec ? 'Sí' : 'No'); });
                if (h3['Data']) rx = setCell(rx, h3['Data'], r, function (ref, s) { return numCell(ref, s, rec ? dateSerial(rec.d) : null); });
                if (h3['Punt(s) al meu KMZ']) rx = setCell(rx, h3['Punt(s) al meu KMZ'], r, function (ref, s) { return strCell(ref, s, uniq(ptsU[u.id])); });
                return ascCells(rx, h3, r, rec);
              });
            }
            // --- 4000 Alps
            if (X['4000 Alps']) {
              var h8 = headers(X['4000 Alps'], ss);
              X['4000 Alps'] = mapRows(X['4000 Alps'], function (rx, r) {
                if (r <= HROW) return rx;
                var a = aByName[cellText(getCell(rx, h8['Cim']), ss)]; if (!a) return rx;
                var rec = done('a:' + a.id);
                if (h8['Assolit']) rx = setCell(rx, h8['Assolit'], r, function (ref, s) { return strCell(ref, s, rec ? 'Sí' : 'No'); });
                if (h8['Data']) rx = setCell(rx, h8['Data'], r, function (ref, s) { return numCell(ref, s, rec ? dateSerial(rec.d) : null); });
                return ascCells(rx, h8, r, rec);
              });
            }
            // --- Sostres comarcals (els que són als 100 Cims ja porten fórmula: no es toquen)
            if (X['Sostres comarcals']) {
              var h7 = headers(X['Sostres comarcals'], ss);
              X['Sostres comarcals'] = mapRows(X['Sostres comarcals'], function (rx, r) {
                if (r <= HROW) return rx;
                var s = sByCom[cellText(getCell(rx, h7['Comarca']), ss)]; if (!s) return rx;
                if (hasFormula(getCell(rx, h7['Assolit']))) return rx;
                var rec = done(s.f ? 'f:' + s.f : 's:' + s.id);
                rx = setCell(rx, h7['Assolit'], r, function (ref, st) { return strCell(ref, st, rec ? 'Sí' : 'No'); });
                if (h7['Data']) rx = setCell(rx, h7['Data'], r, function (ref, st) { return numCell(ref, st, rec ? dateSerial(rec.d) : null); });
                return rx;
              });
            }
            // --- Els meus punts: es reescriuen totes les files de dades
            var oldEnd = null, newEnd = null;
            if (X['Els meus punts']) {
              var x5 = X['Els meus punts'], h5 = headers(x5, ss), first = rowXml(x5, HROW + 1);
              var st = {}; Object.keys(h5).forEach(function (k) { st[k] = styleOf(getCell(first, h5[k])); });
              var oldFont = {};
              (x5.match(ROW_RE) || []).forEach(function (rx) {
                if (+/r="(\d+)"/.exec(rx)[1] <= HROW) return;
                var t = cellText(getCell(rx, h5['Font altitud']), ss); if (t) oldFont[cellText(getCell(rx, h5['Nom']), ss)] = t;
              });
              var lastCol = Object.keys(h5).map(function (k) { return colNum(h5[k]); }).reduce(function (a, b) { return Math.max(a, b); }, 1);
              var rowOpen = (/^<row[^>]*>/.exec(first) || ['<row>'])[0].replace(/\s*r="\d+"/, '');
              var pts = S.points.length ? S.points : [null];
              var KN = { P: 'Principal', S: 'Secundari', X: 'No (només llista catalana)' };
              var rowsXml = pts.map(function (p, i) {
                var r = HROW + 1 + i;
                if (!p) return '<row r="' + r + '"/>';
                var f = p.f ? fById[p.f] : null, u = p.u ? uById[p.u] : null, cells = {};
                var put = function (hname, xml) { if (h5[hname]) cells[h5[hname]] = xml(h5[hname] + r, st[hname]); };
                put('Grup (carpeta)', function (ref, s) { return strCell(ref, s, p.g || ''); });
                put('Nom', function (ref, s) { return strCell(ref, s, p.n); });
                put('Altitud (m)', function (ref, s) { return numCell(ref, s, p.h); });
                put('Data', function (ref, s) { return numCell(ref, s, dateSerial(p.d)); });
                put('Font altitud', function (ref, s) { return strCell(ref, s, p.h == null ? '' : oldFont[p.n] || (f ? 'FEEC' : u ? 'UIAA' : 'Punt')); });
                put('Cim FEEC', function (ref, s) { return strCell(ref, s, f ? f.n : ''); });
                put('Tipus FEEC', function (ref, s) { return strCell(ref, s, f ? (f.e ? 'Essencial' : 'No essencial') : ''); });
                put('Comarca FEEC', function (ref, s) { return strCell(ref, s, f ? f.r : ''); });
                put('Tresmil (llista 3000)', function (ref, s) { return strCell(ref, s, u ? u.n : ''); });
                put('Llista UIAA', function (ref, s) { return strCell(ref, s, u ? KN[u.k] : ''); });
                put('Tresmil català', function (ref, s) { return strCell(ref, s, u && u.ca ? 'Sí' : ''); });
                put('Latitud', function (ref, s) { return numCell(ref, s, p.la); });
                put('Longitud', function (ref, s) { return numCell(ref, s, p.lo); });
                put('Mapa', function (ref, s) { return p.la != null ? fCell(ref, s, 'HYPERLINK("https://www.google.com/maps/search/?api=1&query=' + p.la + ',' + p.lo + '","Mapa ↗")') : strCell(ref, s, ''); });
                var keys = Object.keys(cells).sort(function (a, b) { return colNum(a) - colNum(b); });
                return rowOpen.replace('<row', '<row r="' + r + '"') + keys.map(function (k) { return cells[k]; }).join('') + '</row>';
              }).join('');
              newEnd = HROW + pts.length;
              x5 = x5.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function (m, body) {
                var keep = (body.match(ROW_RE) || []).filter(function (rx) { return +/r="(\d+)"/.exec(rx)[1] <= HROW; });
                keep = keep.map(function (rx) { return +/r="(\d+)"/.exec(rx)[1] === 2 ? setCell(rx.replace(/\/>$/, '></row>'), 'A', 2, function (ref, s) { return strCell(ref, s, S.points.length + ' punts, agrupats per carpeta, amb l\'encreuament amb les llistes FEEC i de tresmils'); }) : rx; });
                return '<sheetData>' + keep.join('') + rowsXml + '</sheetData>';
              });
              x5 = x5.replace(/<hyperlinks>[\s\S]*?<\/hyperlinks>/, '').replace(/<dimension ref="[^"]*"/, '<dimension ref="A1:' + colName(lastCol) + newEnd + '"');
              x5 = x5.replace(/sqref="([^"]+)"/g, function (m, sq) {
                var parts = [], seen = {};
                sq.split(' ').forEach(function (rg) {
                  var mm = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(rg); if (!mm || +mm[2] <= HROW) { parts.push(rg); return; }
                  for (var k = colNum(mm[1]); k <= colNum(mm[3] || mm[1]); k++) { var cl = colName(k); if (!seen[cl]) { seen[cl] = 1; parts.push(cl + (HROW + 1) + ':' + cl + newEnd); } }
                });
                return 'sqref="' + parts.join(' ') + '"';
              });
              X['Els meus punts'] = x5;
              // taula i enllaços del full de punts
              var relPath = sheets['Els meus punts'].replace(/([^\/]+)$/, '_rels/$1.rels');
              tasks.push(rd(relPath).then(function (rels) {
                if (!rels) return;
                var tbl = /Type="[^"]*\/table" Target="([^"]+)"|Target="([^"]+)"[^>]*Type="[^"]*\/table"/.exec(rels);
                zip.file(relPath, rels.replace(/<Relationship [^>]*relationships\/hyperlink"[^>]*\/>/g, ''));
                if (!tbl) return;
                var tpath = 'xl/' + (tbl[1] || tbl[2]).replace(/^\.\.\//, '').replace(/^\/xl\//, '');
                return rd(tpath).then(function (t) {
                  var m = /ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/.exec(t);
                  if (m) { oldEnd = +m[4]; t = t.replace(/ref="([A-Z]+)(\d+):([A-Z]+)\d+"/g, 'ref="$1$2:$3' + newEnd + '"'); }
                  zip.file(tpath, t);
                });
              }));
            }

            return Promise.all(tasks).then(function () {
              // Resum (i qualsevol fórmula) que apunti a «Els meus punts»: s'allarga el rang
              names.forEach(function (n) {
                var x = X[n]; if (!x) return;
                if (oldEnd && newEnd && n !== 'Els meus punts') {
                  x = x.replace(/<f([^>]*)>([\s\S]*?)<\/f>/g, function (m, a, txt) {
                    if (txt.indexOf('Els meus punts') < 0) return m;
                    return '<f' + a + '>' + txt.replace(/\$(\d+)\b/g, function (mm, k) { return +k === oldEnd ? '$' + newEnd : mm; }) + '</f>';
                  });
                }
                // fora valors desats de fórmules: es recalcula en obrir
                x = x.replace(/<c ([^>]*?)>(<f[^>]*?(?:\/>|>[\s\S]*?<\/f>))<v>[\s\S]*?<\/v><\/c>/g, function (m, attrs, f) { return '<c ' + attrs.replace(/\s*t="(?:str|e|b|n)"/, '') + '>' + f + '</c>'; });
                zip.file(sheets[n], x);
              });
              if (/<calcPr/.test(wb)) wb = wb.replace(/<calcPr([^>]*?)\/>/, function (m, a) { return '<calcPr' + a.replace(/\s*fullCalcOnLoad="[^"]*"/, '') + ' fullCalcOnLoad="1"/>'; });
              else wb = wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
              zip.file('xl/workbook.xml', wb);
              if (zip.file('xl/calcChain.xml')) {
                zip.remove('xl/calcChain.xml');
                zip.file('xl/_rels/workbook.xml.rels', wbr.replace(/<Relationship [^>]*calcChain[^>]*\/>/, ''));
                zip.file('[Content_Types].xml', ct.replace(/<Override [^>]*calcChain[^>]*\/>/, ''));
              }
              return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
            });
          });
        });
      });
  };
})();
