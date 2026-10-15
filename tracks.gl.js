/* Lectura de tracks (GPX, FIT de Garmin, KML/KMZ, ZIP amb FIT) i detecció de cims per on passa. */
(function () {
  'use strict';
  var FIT_SRC = 'lib/fitsdk.min.js';
  function loadFit() {
    if (window.FitSDK) return Promise.resolve();
    return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = FIT_SRC; s.onload = ok; s.onerror = function () { ko(new Error('Non se puido cargar o lector FIT')); }; document.head.appendChild(s); });
  }
  function ext(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function toTime(t) { if (!t) return null; var d = t instanceof Date ? t : new Date(t); return isNaN(d) ? null : d; }

  function parseGpx(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml'), pts = [];
    ['trkpt', 'rtept'].forEach(function (tag) {
      Array.prototype.forEach.call(doc.getElementsByTagName(tag), function (n) {
        var la = parseFloat(n.getAttribute('lat')), lo = parseFloat(n.getAttribute('lon'));
        var e = n.getElementsByTagName('ele')[0], t = n.getElementsByTagName('time')[0];
        if (!isNaN(la) && !isNaN(lo)) pts.push([la, lo, e ? parseFloat(e.textContent) : null, t ? toTime(t.textContent) : null]);
      });
    });
    var nm = doc.getElementsByTagName('name')[0];
    return { name: nm ? nm.textContent.trim() : '', pts: pts };
  }
  function parseKml(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml'), pts = [];
    var coords = doc.getElementsByTagNameNS('*', 'coord');
    if (coords.length) {
      var whens = doc.getElementsByTagNameNS('*', 'when');
      Array.prototype.forEach.call(coords, function (c, i) {
        var v = c.textContent.trim().split(/\s+/).map(Number);
        pts.push([v[1], v[0], isNaN(v[2]) ? null : v[2], whens[i] ? toTime(whens[i].textContent) : null]);
      });
    } else {
      Array.prototype.forEach.call(doc.getElementsByTagName('LineString'), function (ls) {
        var c = ls.getElementsByTagName('coordinates')[0]; if (!c) return;
        c.textContent.trim().split(/\s+/).forEach(function (tok) { var v = tok.split(',').map(Number); if (!isNaN(v[0]) && !isNaN(v[1])) pts.push([v[1], v[0], isNaN(v[2]) ? null : v[2], null]); });
      });
    }
    var nm = doc.getElementsByTagName('name')[0];
    return { name: nm ? nm.textContent.trim() : '', pts: pts };
  }
  function parseTcx(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml'), pts = [];
    Array.prototype.forEach.call(doc.getElementsByTagNameNS('*', 'Trackpoint'), function (tp) {
      var g = function (n) { var e = tp.getElementsByTagNameNS('*', n)[0]; return e ? e.textContent : null; };
      var la = parseFloat(g('LatitudeDegrees')), lo = parseFloat(g('LongitudeDegrees')), al = g('AltitudeMeters');
      if (!isNaN(la) && !isNaN(lo)) pts.push([la, lo, al != null ? parseFloat(al) : null, toTime(g('Time'))]);
    });
    var nm = doc.getElementsByTagNameNS('*', 'Name')[0] || doc.getElementsByTagNameNS('*', 'Notes')[0];
    return { name: nm ? nm.textContent.trim() : '', pts: pts };
  }
  function parseFit(buf) {
    return loadFit().then(function () {
      var stream = window.FitSDK.Stream.fromByteArray(new Uint8Array(buf));
      var dec = new window.FitSDK.Decoder(stream);
      if (!dec.isFIT()) throw new Error('O ficheiro non é un FIT válido');
      var res = dec.read(), recs = (res.messages && res.messages.recordMesgs) || [], k = 180 / Math.pow(2, 31), pts = [];
      recs.forEach(function (r) {
        if (r.positionLat == null || r.positionLong == null) return;
        pts.push([r.positionLat * k, r.positionLong * k, r.enhancedAltitude != null ? r.enhancedAltitude : (r.altitude != null ? r.altitude : null), toTime(r.timestamp)]);
      });
      return { name: '', pts: pts };
    });
  }

  function gunzip(buf) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Hai que actualizar «Android System WebView» para ler ficheiros comprimidos'));
    return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  // Llegeix un track a partir del nom del fitxer i el seu contingut (GPX, TCX, KML, FIT; també .gz)
  function parseBuffer(name, buf) {
    var n = name.toLowerCase();
    if (/\.gz$/.test(n)) return gunzip(buf).then(function (b) { return parseBuffer(name.replace(/\.gz$/i, ''), b); });
    var txt = function () { return new TextDecoder('utf-8').decode(buf); };
    if (/\.gpx$/.test(n)) return Promise.resolve(parseGpx(txt()));
    if (/\.tcx$/.test(n)) return Promise.resolve(parseTcx(txt().trim()));
    if (/\.kml$/.test(n)) return Promise.resolve(parseKml(txt()));
    if (/\.fit$/.test(n)) return parseFit(buf);
    return Promise.reject(new Error('Formato non compatible'));
  }
  function parse(file) {
    var e = ext(file.name);
    var asText = function () { return file.text ? file.text() : new Response(file).text(); };
    var asBuf = function () { return file.arrayBuffer ? file.arrayBuffer() : new Response(file).arrayBuffer(); };
    var p;
    if (e === 'gz' || e === 'tcx') p = asBuf().then(function (b) { return parseBuffer(file.name, b); });
    else if (e === 'gpx') p = asText().then(parseGpx);
    else if (e === 'kml') p = asText().then(parseKml);
    else if (e === 'fit') p = asBuf().then(parseFit);
    else if (e === 'kmz' || e === 'zip') {
      p = asBuf().then(function (b) { return JSZip.loadAsync(b); }).then(function (z) {
        var names = Object.keys(z.files);
        var fit = names.filter(function (n) { return /\.fit$/i.test(n); })[0];
        var kml = names.filter(function (n) { return /\.kml$/i.test(n); })[0];
        var gpx = names.filter(function (n) { return /\.gpx$/i.test(n); })[0];
        if (!fit && !kml && !gpx && names.length > 3) throw new Error('Parece un arquivo con moitas actividades: usa «Importar historial (Garmin ou Strava)»');
        if (fit) return z.file(fit).async('arraybuffer').then(parseFit);
        if (kml) return z.file(kml).async('string').then(parseKml);
        if (gpx) return z.file(gpx).async('string').then(parseGpx);
        throw new Error('Non se atopou ningún track dentro do ficheiro');
      });
    } else p = Promise.reject(new Error('Formato non compatible (usa GPX, FIT, KML, KMZ ou ZIP)'));
    return p.then(function (t) {
      if (!t.pts.length) throw new Error('O ficheiro non contén puntos de track');
      t.name = t.name || file.name.replace(/\.[^.]+$/, '');
      return summary(t);
    });
  }

  function hav(a, b, c, d) { var R = 6371000, p = Math.PI / 180, x = Math.sin((c - a) * p / 2), y = Math.sin((d - b) * p / 2); return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a * p) * Math.cos(c * p) * y * y)); }
  function summary(t) {
    var km = 0, up = 0, ref = null;
    for (var i = 1; i < t.pts.length; i++) km += hav(t.pts[i - 1][0], t.pts[i - 1][1], t.pts[i][0], t.pts[i][1]);
    t.pts.forEach(function (p) { if (p[2] == null) return; if (ref == null) { ref = p[2]; return; } if (p[2] - ref >= 5) { up += p[2] - ref; ref = p[2]; } else if (ref - p[2] >= 5) ref = p[2]; });
    var t0 = null; for (var j = 0; j < t.pts.length; j++) if (t.pts[j][3]) { t0 = t.pts[j][3]; break; }
    t.km = Math.round(km / 100) / 10; t.up = ref == null ? null : Math.round(up);
    t.date = t0 ? new Date(t0.getTime() - t0.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
    return t;
  }
  // distància (m) d'un punt a un segment, en projecció local
  function segDist(la, lo, a, b) {
    var kx = 111320 * Math.cos(la * Math.PI / 180), ky = 110540;
    var ax = (a[1] - lo) * kx, ay = (a[0] - la) * ky, bx = (b[1] - lo) * kx, by = (b[0] - la) * ky;
    var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
    var px = ax + t * dx, py = ay + t * dy; return { d: Math.sqrt(px * px + py * py), t: t };
  }
  // cands: [{key, la, lo, ...}] -> els que queden a menys de radi metres del track
  function detect(track, cands, radius) {
    radius = radius || 80;
    var pts = track.pts, mnLa = 90, mxLa = -90, mnLo = 180, mxLo = -180;
    pts.forEach(function (p) { if (p[0] < mnLa) mnLa = p[0]; if (p[0] > mxLa) mxLa = p[0]; if (p[1] < mnLo) mnLo = p[1]; if (p[1] > mxLo) mxLo = p[1]; });
    var pad = 0.002, out = [];
    cands.forEach(function (c) {
      if (c.la == null || c.la < mnLa - pad || c.la > mxLa + pad || c.lo < mnLo - pad || c.lo > mxLo + pad) return;
      var best = 1e9, when = null;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (Math.min(a[0], b[0]) > c.la + 0.01 || Math.max(a[0], b[0]) < c.la - 0.01) continue;
        var r = segDist(c.la, c.lo, a, b);
        if (r.d < best) { best = r.d; when = a[3] && b[3] ? new Date(a[3].getTime() + (b[3].getTime() - a[3].getTime()) * r.t) : (a[3] || null); }
      }
      if (best <= radius) out.push(Object.assign({}, c, { dist: Math.round(best), when: when }));
    });
    return out.sort(function (a, b) { return (a.when && b.when) ? a.when - b.when : a.dist - b.dist; });
  }
  // polilínia codificada (format de Google, la que fa servir Strava) -> [[lat, lon], ...]
  function decodePolyline(str) {
    var i = 0, la = 0, lo = 0, out = [];
    while (i < (str || '').length) {
      var r = 0, sh = 0, b;
      do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
      la += (r & 1) ? ~(r >> 1) : (r >> 1);
      r = 0; sh = 0;
      do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lo += (r & 1) ? ~(r >> 1) : (r >> 1);
      out.push([la / 1e5, lo / 1e5]);
    }
    return out;
  }
  function encodePolyline(pts) {
    var out = '', pla = 0, plo = 0;
    function enc(v) { v = v < 0 ? ~(v << 1) : v << 1; var s = ''; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }
    pts.forEach(function (p) { var la = Math.round(p[0] * 1e5), lo = Math.round(p[1] * 1e5); out += enc(la - pla) + enc(lo - plo); pla = la; plo = lo; });
    return out;
  }
  // ---- Lector de ZIP grans sense carregar-los sencers a memòria (arxius d'exportació de Garmin/Strava) ----
  function u64(dv, o) { return dv.getUint32(o, true) + dv.getUint32(o + 4, true) * 4294967296; }
  function blobDV(blob, a, b) { return blob.slice(a, b).arrayBuffer().then(function (x) { return new DataView(x); }); }
  function zipList(blob) {
    var tl = Math.min(blob.size, 65557 + 20);
    return blobDV(blob, blob.size - tl, blob.size).then(function (dv) {
      var i = dv.byteLength - 22;
      while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
      if (i < 0) throw new Error('Non é un ficheiro ZIP válido');
      var cnt = dv.getUint16(i + 10, true), size = dv.getUint32(i + 12, true), off = dv.getUint32(i + 16, true), base = blob.size - tl;
      var z64 = i >= 20 && dv.getUint32(i - 20, true) === 0x07064b50;
      var p = Promise.resolve();
      if (z64 && (off === 0xFFFFFFFF || cnt === 0xFFFF || size === 0xFFFFFFFF)) {
        var eo = u64(dv, i - 20 + 8);
        p = blobDV(blob, eo, eo + 56).then(function (d) { cnt = u64(d, 32); size = u64(d, 40); off = u64(d, 48); });
      }
      return p.then(function () { return blobDV(blob, off, off + size); }).then(function (d) {
        var out = [], o = 0, dec = new TextDecoder('utf-8');
        while (o + 46 <= d.byteLength && d.getUint32(o, true) === 0x02014b50) {
          var method = d.getUint16(o + 10, true), cs = d.getUint32(o + 20, true), us = d.getUint32(o + 24, true);
          var nl = d.getUint16(o + 28, true), xl = d.getUint16(o + 30, true), cl = d.getUint16(o + 32, true), lo = d.getUint32(o + 42, true);
          var name = dec.decode(new Uint8Array(d.buffer, d.byteOffset + o + 46, nl));
          var x = o + 46 + nl, xe = x + xl;
          while (x + 4 <= xe) {
            var id = d.getUint16(x, true), ln = d.getUint16(x + 2, true), q = x + 4;
            if (id === 1) { if (us === 0xFFFFFFFF) { us = u64(d, q); q += 8; } if (cs === 0xFFFFFFFF) { cs = u64(d, q); q += 8; } if (lo === 0xFFFFFFFF) { lo = u64(d, q); } }
            x += 4 + ln;
          }
          if (!/\/$/.test(name)) out.push({ name: name, method: method, cs: cs, us: us, off: lo });
          o = xe + cl;
        }
        return out;
      });
    });
  }
  function zipEntry(blob, e) {
    return blobDV(blob, e.off, e.off + 30).then(function (h) {
      var start = e.off + 30 + h.getUint16(26, true) + h.getUint16(28, true), comp = blob.slice(start, start + e.cs);
      if (e.method === 0) return comp;
      if (e.method !== 8) throw new Error('Compresión non soportada');
      if (typeof DecompressionStream === 'undefined') throw new Error('Hai que actualizar «Android System WebView» para ler o arquivo');
      return new Response(comp.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    });
  }
  window.Tracks = { parse: parse, parseBuffer: parseBuffer, detect: detect, summary: summary, decodePolyline: decodePolyline, encodePolyline: encodePolyline, zipList: zipList, zipEntry: zipEntry };
})();
