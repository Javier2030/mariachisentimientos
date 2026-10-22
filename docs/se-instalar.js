(function () {
/* Procedencia del visitante (Instagram, Facebook, TikTok) */
var procedencia = (function () {
  var W = window, D = document, VIDA = 30 * 864e5, CLAVE = 'sentProc';
  var rotulos = {
    instagram: '📸 Vengo de Instagram — ',
    facebook: '👍 Vengo de Facebook — ',
    tiktok: '🎵 Vengo de TikTok — '
  };
  var textoBase = 'Hola, quiero información de una serenata.';
  var tieneRotulo = /Vengo de (Instagram|Facebook|TikTok) — /;
  var esLinkWa = /^(?:(?:https?:)?\/\/(?:wa\.me|(?:www\.|api\.|web\.)?whatsapp\.com)(?:[\/?#]|$)|whatsapp:\/\/)/i;

  function valorQuery(n) {
    var s = W.location.search;
    try { return new URLSearchParams(s).get(n); } catch (e) {
      var m = new RegExp('[?&]' + n + '(?:=([^&]*))?(?:&|$)').exec(s);
      return m ? (m[1] || '') : null;
    }
  }
  function dominioRef() {
    var m = /^https?:\/\/([^\/?#:]+)/i.exec(D.referrer || '');
    return m ? m[1].toLowerCase() : '';
  }
  function averiguaFuente() {
    var us = (valorQuery('utm_source') || '').toLowerCase(), h = dominioRef(), ua = navigator.userAgent || '';
    if (us === 'instagram' || us === 'ig' || valorQuery('ig') !== null) return 'instagram';
    if (us === 'facebook' || us === 'fb') return 'facebook';
    if (us === 'tiktok') return 'tiktok';
    if (/(^|\.)instagram\.com$/.test(h) || /Instagram/.test(ua)) return 'instagram';
    if (valorQuery('fbclid') !== null || /(^|\.)facebook\.com$/.test(h) || /FBAN|FBAV/.test(ua)) return 'facebook';
    if (/(^|\.)tiktok\.com$/.test(h) || /musical_ly|BytedanceWebview|TikTok/.test(ua)) return 'tiktok';
    return null;
  }
  function fuenteVieja() {
    var r;
    try { r = JSON.parse(localStorage.getItem(CLAVE)); if (r && rotulos[r.o] && Date.now() - r.t < VIDA) return r.o; } catch (e) {}
    try { r = JSON.parse(sessionStorage.getItem(CLAVE)); if (r && rotulos[r.o]) return r.o; } catch (e) {}
    return null;
  }
  function recuerdaFuente(o) {
    var s = JSON.stringify({ o: o, t: Date.now() });
    try { localStorage.setItem(CLAVE, s); } catch (e) {}
    try { sessionStorage.setItem(CLAVE, s); } catch (e) {}
  }

  var nuevo = averiguaFuente(), fuente = nuevo || fuenteVieja();
  if (nuevo) recuerdaFuente(nuevo);
  if (!fuente) return function () { return null; };

  function rotula(u) {
    if (typeof u !== 'string' || !esLinkWa.test(u)) return u;
    var orig = u, m = rotulos[fuente], hash = '', i = u.indexOf('#');
    if (i > -1) { hash = u.slice(i); u = u.slice(0, i); }
    var q = u.indexOf('?'), base = q < 0 ? u : u.slice(0, q);
    var ps = q < 0 ? [] : u.slice(q + 1).split('&').filter(Boolean), hecho = false;
    for (var j = 0; j < ps.length && !hecho; j++) {
      if (!/^text=/i.test(ps[j])) continue;
      var v = ps[j].slice(5), d = v;
      try { d = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
      hecho = true;
      if (tieneRotulo.test(d)) return orig;
      ps[j] = /^\s*$/.test(d) ? 'text=' + encodeURIComponent(m + textoBase) : 'text=' + encodeURIComponent(m) + v;
    }
    if (!hecho) ps.push('text=' + encodeURIComponent(m + textoBase));
    return base + '?' + ps.join('&') + hash;
  }
  function retocaA(el) {
    if (!el || !el.getAttribute) return;
    var h = el.getAttribute('href');
    if (h) { var n = rotula(h); if (n !== h) el.setAttribute('href', n); }
    var c = el.getAttribute('onclick');
    if (c && /wa\.me|whatsapp/i.test(c)) {
      var n2 = c.replace(/https?:\/\/(?:wa\.me\/\d+|(?:api|web|www)\.whatsapp\.com\/send)[^'"\s)]*(?=['"])/gi, rotula);
      if (n2 !== c) el.setAttribute('onclick', n2);
    }
  }
  function recorreA() {
    var l = D.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp"],[onclick*="wa.me"],[onclick*="whatsapp"]');
    for (var i = 0; i < l.length; i++) retocaA(l[i]);
  }

  recorreA();
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', recorreA);
  // enlaces que aparecen después de cargar
  if (W.MutationObserver) {
    var t = 0;
    new MutationObserver(function () {
      if (t) return;
      t = setTimeout(function () { t = 0; recorreA(); }, 60);
    }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'onclick'] });
  }
  // por captura: lo que se haya tocado a mano justo antes del clic también lleva la marca
  D.addEventListener('click', function (e) {
    for (var el = e.target; el && el !== D; el = el.parentNode) retocaA(el);
  }, true);
  // aperturas programáticas (formularios)
  var abrir = W.open;
  W.open = function (u) {
    var a = Array.prototype.slice.call(arguments);
    a[0] = rotula(u);
    return abrir.apply(W, a);
  };

  // medición
  function reportaFuente() {
    try {
      if (typeof W.clarity === 'function') {
        W.clarity('set', 'origen', fuente);
        if (nuevo && !sessionStorage.getItem(CLAVE + 'c')) { sessionStorage.setItem(CLAVE + 'c', '1'); W.clarity('event', 'llegada_' + fuente); }
      }
    } catch (e) {}
    try {
      if (typeof W.gtag === 'function') {
        W.gtag('set', { origen_visita: fuente });
        if (nuevo && !sessionStorage.getItem(CLAVE + 'g')) { sessionStorage.setItem(CLAVE + 'g', '1'); W.gtag('event', 'llegada_origen', { origen: fuente }); }
      }
    } catch (e) {}
  }
  reportaFuente();
  W.addEventListener('load', function () { reportaFuente(); setTimeout(reportaFuente, 4000); });
  return function () { return fuente; };
})();

})();
/* Banner de instalación PWA — Mariachi Sentimientos */
(function () {
  var BRAND = "Mariachi Sentimientos";
  var ICON = "/icon-192.png";
  try {
    if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return; // ya instalada
    if (localStorage.getItem("pwaHide")) return; // el usuario la cerró
  } catch (e) {}

  function banner(inner) {
    var b = document.createElement("div");
    b.id = "pwaB";
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:linear-gradient(135deg,#6E1423,#3d0a12);color:#fff;border:1px solid rgba(232,199,90,.55);border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:11px;box-shadow:0 16px 44px -12px rgba(0,0,0,.75);font-family:system-ui,-apple-system,sans-serif;max-width:460px;margin:0 auto;animation:pwaUp .35s ease";
    b.innerHTML = inner;
    if (!document.getElementById("pwaKF")) {
      var s = document.createElement("style"); s.id = "pwaKF";
      s.textContent = "@keyframes pwaUp{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}";
      document.head.appendChild(s);
    }
    document.body.appendChild(b);
    return b;
  }
  function close() { var e = document.getElementById("pwaB"); if (e) e.remove(); try { localStorage.setItem("pwaHide", "1"); } catch (x) {} }

  var iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var deferred = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    banner('<img src="' + ICON + '" width="44" height="44" style="border-radius:11px;flex:none">' +
      '<div style="flex:1;text-align:left;font-size:14px;line-height:1.3"><b style="color:#E8C75A">Instala la app</b><br>' + BRAND + ' en tu teléfono</div>' +
      '<button id="pwaGo" style="flex:none;background:linear-gradient(135deg,#E8C75A,#C9A227);color:#3d0a12;border:0;font-weight:800;padding:11px 17px;border-radius:12px;font-size:14px;cursor:pointer">Instalar</button>' +
      '<span id="pwaX" style="flex:none;color:#c9a98a;font-size:23px;line-height:1;padding:0 4px;cursor:pointer">&times;</span>');
    document.getElementById("pwaGo").onclick = function () { deferred.prompt(); deferred.userChoice.finally(close); };
    document.getElementById("pwaX").onclick = close;
  });

  if (iOS) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        if (document.getElementById("pwaB")) return;
        banner('<img src="' + ICON + '" width="44" height="44" style="border-radius:11px;flex:none">' +
          '<div style="flex:1;text-align:left;font-size:13px;line-height:1.35"><b style="color:#E8C75A">Instala la app</b><br>Toca <b>Compartir</b> y luego <b>Añadir a inicio</b></div>' +
          '<span id="pwaX" style="flex:none;color:#c9a98a;font-size:23px;line-height:1;padding:0 4px;cursor:pointer">&times;</span>');
        document.getElementById("pwaX").onclick = close;
      }, 2800);
    });
  }
})();
