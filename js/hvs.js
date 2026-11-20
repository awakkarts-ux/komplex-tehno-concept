// 18.11 — схемы с подсказками на страницах услуг (Установка / Сервис / Ремонт).
// Разметка и тексты — hover-vse.html (генератор teplo-graphics/hover_all.py). Поведение — как схема узла Главной (home.js):
// десктоп — плашка над элементом при наведении; ≤1023 / касание — карточка элемента под схемой, ‹ › и тап по точке.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchMQ = matchMedia('(max-width: 1023px), (hover: none)');
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  var NS = 'http://www.w3.org/2000/svg';

  $$('[data-hvs]').forEach(function (stage) {
    var ITEMS = JSON.parse(stage.getAttribute('data-items'));
    var svgs = $$('svg.hvs__svg', stage); if (!svgs.length) return;
    var tip = stage.querySelector('.hvs__tip');
    var root = stage.closest('[data-s]') || stage.closest('.hvs') || stage.parentNode;
    var info = root.querySelector('[data-hvs-info]');
    var hits = [], dots = [], lbls = [];
    svgs.forEach(function (s) { hits = hits.concat($$('.hit', s)); dots = dots.concat($$('.dot', s)); lbls = lbls.concat($$('text', s)); });
    var svg = svgs[0];
    var VW = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) || 1200;

    // точки: обёртка под масштаб (на узком экране ядро точки не меньше ~10 px)
    dots.forEach(function (d) {
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'dot-s');
      while (d.firstChild) g.appendChild(d.firstChild); d.appendChild(g);
    });
    lbls.forEach(function (t) { t.setAttribute('data-fs', t.getAttribute('font-size') || '12'); });
    function fit() {
      var k = svg.getBoundingClientRect().width / VW || 1, mob = touchMQ.matches;
      // подписи мельче 12 px после масштаба скрываем; ≤1023/касание — смысл несёт карточка под схемой (RULES §4)
      // data-fit-up (ГОСТ-схема, 20.11): подписи смысловые — не прячем, а доводим до 12 px (не больше ×1,25 от исходного)
      var up = svg.hasAttribute('data-fit-up'), lost = false;
      lbls.forEach(function (t) {
        var fs = +t.getAttribute('data-fs'), f = up ? Math.min(fs * 1.25, Math.max(fs, 12 / k)) : fs;
        if (up) t.setAttribute('font-size', f.toFixed(2));
        // 20.11 (аудит П1.5): и на десктопе 1024–1440 подпись мельче 12 px не показываем — декор приборов прячется,
        // смысл несут плашка при наведении и HTML-слой (.hvs__zone у датчика)
        var hide = (f * k < 11.5 && (mob || innerWidth < 1920)) ? 'none' : '';   // 1920 — эталон, не меняется
        if (hide) lost = true;
        t.style.display = hide;
        // подложка подписи (rect с заливкой фона прямо перед текстом) прячется вместе с ней
        var bg = t.previousElementSibling;
        if (bg && bg.tagName === 'rect' && /^#F5F5F7$|^#fff(fff)?$/i.test(bg.getAttribute('fill') || '') && +bg.getAttribute('height') < 40) bg.style.display = hide;
      });
      root.classList.toggle('hvs--lbl-off', lost);
      var sc = stage.querySelector('.hvs__sc');
      if (sc) sc.classList.toggle('is-scroll', sc.scrollWidth > sc.clientWidth + 2);
      var ds = Math.min(3.4, Math.max(1, 1 / k));
      dots.forEach(function (d) { d.firstChild.setAttribute('transform', 'scale(' + ds.toFixed(2) + ')'); });
    }
    fit(); addEventListener('resize', fit);

    function mark(el) {
      var n = hits.indexOf(el);
      hits.forEach(function (h) { h.classList.toggle('on', h === el); });
      dots.forEach(function (d, i) { d.classList.toggle('off', i === n); });
    }
    function clearAll() { if (tip) tip.classList.remove('on'); hits.forEach(function (h) { h.classList.remove('on'); }); dots.forEach(function (d) { d.classList.remove('off'); }); }

    function showTip(el) {
      if (touchMQ.matches || !tip) return;
      var it = ITEMS[+el.getAttribute('data-k')];
      tip.innerHTML = '<b>' + it.t + '</b><p>' + it.d + '</p>';
      var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
      var left = r.left + r.width / 2 - s.left - tip.offsetWidth / 2;
      left = Math.max(12, Math.min(left, s.width - tip.offsetWidth - 12));
      var below = r.top - s.top < tip.offsetHeight + 24;
      tip.style.left = left + 'px';
      tip.style.top = (below ? r.bottom - s.top + 10 : r.top - s.top - tip.offsetHeight - 10) + 'px';
      tip.classList.add('on'); mark(el);
    }
    hits.forEach(function (h) {
      var it = ITEMS[+h.getAttribute('data-k')];
      h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', it ? it.t : '');
      h.addEventListener('mouseenter', function () { showTip(h); });
      h.addEventListener('mouseleave', function () { if (!touchMQ.matches) clearAll(); });
      h.addEventListener('focus', function () { if (touchMQ.matches) select(hits.indexOf(h)); else showTip(h); });
      h.addEventListener('blur', function () { if (!touchMQ.matches) clearAll(); });
    });

    // ≤1023 / касание: карточка элемента под схемой
    var infoT, infoD, cnt, order = [], curK = 0;
    if (info) {
      infoT = info.querySelector('.hvs__info-t'); infoD = info.querySelector('.hvs__info-d'); cnt = info.querySelector('.hvs__cnt');
      order = ITEMS.map(function (_, k) { return hits.findIndex(function (h) { return +h.getAttribute('data-k') === k; }); });
    }
    function select(i) {
      if (!info || i < 0) return;
      var h = hits[i], k = +h.getAttribute('data-k'), it = ITEMS[k];
      curK = k;
      infoT.textContent = it.t; infoD.textContent = it.d;
      cnt.textContent = pad2(k + 1) + ' / ' + pad2(ITEMS.length);
      mark(h);
      var sc = stage.querySelector('.hvs__sc'), d = dots[i];
      if (sc && d && sc.scrollWidth > sc.clientWidth + 2) {   // выбранная точка — в видимую часть прокрутки
        var r = d.getBoundingClientRect(), c = sc.getBoundingClientRect();
        if (r.left < c.left + 24 || r.right > c.right - 24) sc.scrollBy({ left: r.left + r.width / 2 - (c.left + c.width / 2), behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    function centers(list) { return list.map(function (e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); }
    function nearest(list, x, y, rad) {
      var best = -1, bd = rad * rad;
      centers(list).forEach(function (p, i) { var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    stage.addEventListener('click', function (e) {
      if (!touchMQ.matches || !info) return;
      var i = nearest(dots, e.clientX, e.clientY, 28);
      if (i < 0) i = nearest(hits, e.clientX, e.clientY, 40);
      if (i >= 0) select(i);
    });
    if (info) $$('[data-hvs-step]', info).forEach(function (b) {
      b.addEventListener('click', function () { select(order[(curK + +b.getAttribute('data-hvs-step') + ITEMS.length) % ITEMS.length]); });
    });
    function syncMode() { clearAll(); fit(); if (touchMQ.matches && info) select(order[curK]); }
    touchMQ.addEventListener('change', syncMode); syncMode();
  });


  /* ---------- Сервис: шкала сезона (Figma 950:6590, вариант Б; код — season.html) ----------
     Десктоп: наведение на месяц → одна плашка на месяц. ≤1023 / касание: карточка месяца под шкалой, ‹ › и тап по месяцу */
  var SICO = {
    hatch: '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="4" fill="#C2410C" fill-opacity=".9"/></svg>',
    q: '<svg viewBox="0 0 24 24"><path d="M12 4l8 8-8 8-8-8z" fill="#fff" stroke="#3A3D42" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#3A3D42"/></svg>',
    pre: '<svg viewBox="0 0 24 24"><path d="M12 1.5L22.5 12 12 22.5 1.5 12z" fill="#C2410C" stroke="#C2410C" stroke-width="2.5" stroke-linejoin="round"/></svg>'
  };
  $$('[data-season]').forEach(function (box) {
    var TIPS = JSON.parse(box.getAttribute('data-tips')), svg = box.querySelector('svg.hvs__svg'), tip = box.querySelector('.hvs__tip');
    var root = box.closest('.hvs'), info = root.querySelector('[data-season-info]');
    var mos = $$('.mo', svg), cur = 5, pinned = null;
    function rows(d) { return d.r.map(function (r) { return '<li><i>' + SICO[r[0]] + '</i><div><strong>' + r[1] + '</strong> <span>— ' + r[2] + '</span></div></li>'; }).join(''); }
    function mark(g) { mos.forEach(function (x) { x.classList.toggle('on', x === g); }); }
    function show(g) {
      if (touchMQ.matches) return;
      var d = TIPS[+g.getAttribute('data-m')]; mark(g);
      tip.innerHTML = '<b>' + d.t + '</b><ul>' + rows(d) + '</ul>';
      var bb = box.getBoundingClientRect(), gb = g.querySelector('.tl').getBoundingClientRect(), sb = svg.getBoundingClientRect();
      var x = gb.left + gb.width / 2 - bb.left, half = Math.min(bb.width * .45, tip.offsetWidth / 2 + 4);
      x = Math.max(half, Math.min(bb.width - half, x));
      tip.style.left = x + 'px'; tip.style.top = (sb.top - bb.top + sb.height * .94) + 'px'; tip.classList.add('on');
    }
    function hide() { if (touchMQ.matches) return; if (pinned) return show(pinned); tip.classList.remove('on'); mark(null); }
    function select(m) {
      cur = (m + TIPS.length) % TIPS.length; var d = TIPS[cur];
      info.querySelector('.hvs__cnt').textContent = pad2(cur + 1) + ' / ' + pad2(TIPS.length);
      info.querySelector('.hvs__info-t').textContent = d.t + ' · ' + d.p;
      info.querySelector('.hvs__info-r').innerHTML = rows(d); mark(mos[cur]);
      var sc = box.querySelector('.hvs__sc'), r = mos[cur].getBoundingClientRect(), c = sc.getBoundingClientRect();
      if (sc.scrollWidth > sc.clientWidth + 2 && (r.left < c.left || r.right > c.right)) sc.scrollBy({ left: r.left + r.width / 2 - (c.left + c.width / 2), behavior: reduce ? 'auto' : 'smooth' });
    }
    mos.forEach(function (g) {
      g.addEventListener('mouseenter', function () { show(g); }); g.addEventListener('mouseleave', hide);
      g.addEventListener('focus', function () { if (touchMQ.matches) select(+g.getAttribute('data-m')); else show(g); });
      g.addEventListener('blur', hide);
      g.addEventListener('click', function (e) {
        e.stopPropagation();
        if (touchMQ.matches) { select(+g.getAttribute('data-m')); return; }
        pinned = (pinned === g) ? null : g; if (pinned) show(g); else { tip.classList.remove('on'); mark(null); }
      });
    });
    document.addEventListener('click', function () { if (touchMQ.matches) return; pinned = null; tip.classList.remove('on'); mark(null); });
    $$('[data-hvs-step]', info).forEach(function (b) { b.addEventListener('click', function () { select(cur + +b.getAttribute('data-hvs-step')); }); });
    function syncMode() { pinned = null; tip.classList.remove('on'); mark(null); if (touchMQ.matches) select(cur); }
    touchMQ.addEventListener('change', syncMode); syncMode();
  });

  /* ---------- Ремонт: сегмент «Было / Стало / Реконструкция» ---------- */
  $$('[data-hvs-seg]').forEach(function (seg) {
    var wrap = seg.closest('.hvs'), btns = $$('button', seg);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-s]', wrap).forEach(function (e) { e.classList.toggle('is-off', e.getAttribute('data-s') !== b.getAttribute('data-s')); });
      });
    });
  });

})();
