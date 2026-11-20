// 18.11 — Главная по Figma 98:4951: схема узла, кадры чертежа «Услуг», ленты «Этапов» и «Наших работ»
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchMQ = matchMedia('(max-width: 1023px), (hover: none)');
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return String(n).padStart(2, '0'); }

  /* ---------- Схема узла ----------
     Десктоп: наведение → плашка над прибором. ≤1023 / касание: карточка элемента под схемой
     (правка дизайнера 18.11 — без всплывающей шторки): тап по точке или стрелки ‹ › переключают элемент */
  var stage = document.querySelector('[data-uzel]');
  if (stage) {
    var ITEMS = JSON.parse(document.getElementById('uzel-items').textContent);
    var svg = stage.querySelector('.uzel__svg'), tip = stage.querySelector('.uzel__tip');
    var hits = $$('.hit', svg), dots = $$('.dot', svg), lbls = $$('text.lbl', svg);
    var VW = 1320;
    // точки: обёртка для масштаба (на узком экране точка не меньше ~10 px)
    dots.forEach(function (d) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'dot-s');
      while (d.firstChild) g.appendChild(d.firstChild); d.appendChild(g);
    });
    lbls.forEach(function (t) { t.dataset.fs = t.getAttribute('font-size'); });
    var deco = $$('text:not(.lbl)', svg).filter(function (t) { return t.getAttribute('font-size'); });
    deco.forEach(function (t) { t.dataset.fs = t.getAttribute('font-size'); });
    function fit() {
      var k = svg.getBoundingClientRect().width / VW || 1;
      // подписи схемы не мельче 12 px после масштаба (на ≤1023 они скрыты — вместо них легенда над схемой)
      lbls.forEach(function (t) { var fs = +t.dataset.fs; t.style.fontSize = (fs * k < 12 ? (12 / k).toFixed(2) : fs) + 'px'; });
      // 20.11 (аудит П1.5): микротекст приборов (0125,4, РАСХОДОМЕР, Гкал…) — декор, мельче 12 px не показываем
      deco.forEach(function (t) { t.style.display = (+t.dataset.fs * k < 11.5 && innerWidth < 1920) ? 'none' : ''; });   // 1920 — эталон, не меняется
      var ds = Math.min(3.4, Math.max(1, 1 / k)); // ядро точки r=5 → не меньше 10 px на экране
      dots.forEach(function (d) { d.firstChild.setAttribute('transform', 'scale(' + ds.toFixed(2) + ')'); });
    }
    fit(); addEventListener('resize', fit);

    function mark(el) {
      var n = hits.indexOf(el);
      hits.forEach(function (h) { h.classList.toggle('on', h === el); });
      dots.forEach(function (d, i) { d.classList.toggle('off', i === n); });
    }
    function clearAll() { tip.classList.remove('on'); hits.forEach(function (h) { h.classList.remove('on'); }); dots.forEach(function (d) { d.classList.remove('off'); }); }

    // десктоп: плашка над элементом
    function showTip(el) {
      if (touchMQ.matches) return;
      var it = ITEMS[+el.dataset.k];
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
      h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', ITEMS[+h.dataset.k].t);
      h.addEventListener('mouseenter', function () { showTip(h); });
      h.addEventListener('mouseleave', function () { if (!touchMQ.matches) clearAll(); });
      h.addEventListener('focus', function () { if (touchMQ.matches) select(hits.indexOf(h)); else showTip(h); });
      h.addEventListener('blur', function () { if (!touchMQ.matches) clearAll(); });
    });

    // ≤1023 / касание: карточка элемента
    var info = document.querySelector('[data-uzel-info]');
    var infoT = info.querySelector('.uzel__info-t'), infoD = info.querySelector('.uzel__info-d'), cnt = info.querySelector('.uzel__cnt');
    // порядок обхода: 9 элементов, у каждого — первая зона на схеме
    var order = ITEMS.map(function (_, k) { return hits.findIndex(function (h) { return +h.dataset.k === k; }); });
    var curK = 0;
    function select(i) {
      var h = hits[i], k = +h.dataset.k, it = ITEMS[k];
      curK = k;
      infoT.textContent = it.t; infoD.textContent = it.d;
      cnt.textContent = pad2(k + 1) + ' / ' + pad2(ITEMS.length);
      mark(h);
    }
    function centers(list) { return list.map(function (e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); }
    function nearest(list, x, y, rad) {
      var best = -1, bd = rad * rad;
      centers(list).forEach(function (p, i) { var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    stage.addEventListener('click', function (e) {
      if (!touchMQ.matches) return;
      // точки и зоны идут в одном порядке: тап рядом с точкой (28 px), иначе — ближайший прибор (40 px)
      var i = nearest(dots, e.clientX, e.clientY, 28);
      if (i < 0) i = nearest(hits, e.clientX, e.clientY, 40);
      if (i >= 0) select(i);
    });
    $$('[data-uzel-step]', info).forEach(function (b) {
      b.addEventListener('click', function () { select(order[(curK + +b.dataset.uzelStep + ITEMS.length) % ITEMS.length]); });
    });
    function syncMode() { clearAll(); if (touchMQ.matches) select(order[curK]); }
    touchMQ.addEventListener('change', syncMode); syncMode();
  }

  /* ---------- Услуги: кадр чертежа следит за открытой / наведённой строкой ---------- */
  var ill = document.querySelector('[data-svc-ill]');
  if (ill) {
    var CAP = ['Подача Т1 и обратка Т2: запорная арматура, фильтры, расходомеры, датчики температуры, манометры, термометры, тепловычислитель.',
      'Весь узел и замеры: прямые участки до и после расходомера, длина участка под узел.',
      'Чертёжная сетка, границы проектирования и штамп листа.',
      'Приборы учёта: расходомеры, датчики температуры, тепловычислитель — «приезжают» на место.',
      'Места врезки приборов в трубу: фланцы расходомеров, бобышки датчиков, манометров и термометров.',
      'То, что обслуживается: линии связи, пломбы, фильтры.',
      'Приборы, которые снимают и везут в лабораторию: расходомеры, датчики температуры, вычислитель.',
      'Неисправный прибор — расходомер на подаче.'];
    var imgs = $$('.svc-ill__img', ill), rows = $$('.svc'), no = ill.querySelector('.svc-ill__no'),
      nm = ill.querySelector('.svc-ill__name'), cap = ill.querySelector('.svc-ill__txt');
    var show = function (s) {
      imgs.forEach(function (im, i) { im.classList.toggle('is-on', i === s); });
      no.textContent = s ? '[' + pad2(s) + ']' : '';
      nm.textContent = s ? rows[s - 1].querySelector('.svc__name').textContent : 'Узел учёта тепловой энергии';
      cap.textContent = CAP[s];
    };
    var opened = function () { return rows.findIndex(function (r) { return r.classList.contains('is-open'); }) + 1; };
    rows.forEach(function (r, i) {
      var h = r.querySelector('.svc__head');
      h.addEventListener('click', function () { setTimeout(function () { show(opened()); }, 0); });
      h.addEventListener('mouseenter', function () { if (matchMedia('(hover: hover)').matches) show(i + 1); });
      h.addEventListener('mouseleave', function () { show(opened()); });
    });
    show(opened());
  }

  /* ---------- Ленты с прокруткой: «Этапы» (вариант Г) и «Наши работы» (≤1199) ----------
     Стрелки листают на одну карточку, ←/→ на ленте, перетаскивание мышью; на касании — родная прокрутка */
  function slider(sc, items, btns, pos) {
    var pitch = function () { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : sc.clientWidth; };
    var upd = function () {
      var atEnd = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2;
      btns[0].disabled = sc.scrollLeft <= 2; btns[1].disabled = atEnd;
      if (pos) { var i = atEnd ? items.length : Math.min(items.length, Math.round(sc.scrollLeft / pitch()) + 1); pos.textContent = pad2(i) + ' / ' + pad2(items.length); }
    };
    var go = function (d) { sc.scrollTo({ left: (Math.round(sc.scrollLeft / pitch()) + d) * pitch(), behavior: reduce ? 'auto' : 'smooth' }); };
    btns.forEach(function (b, i) { b.addEventListener('click', function () { go(i ? 1 : -1); }); });
    sc.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    sc.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    var x0 = null, s0 = 0, moved = false;
    sc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button || sc.scrollWidth <= sc.clientWidth) return; x0 = e.clientX; s0 = sc.scrollLeft; moved = false; });
    sc.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      if (!moved && Math.abs(e.clientX - x0) > 4) { moved = true; sc.classList.add('is-drag'); sc.setPointerCapture(e.pointerId); }
      if (moved) sc.scrollLeft = s0 - (e.clientX - x0);
    });
    var end = function () {
      if (x0 === null) return; x0 = null;
      if (moved) { sc.classList.remove('is-drag'); sc.scrollTo({ left: Math.round(sc.scrollLeft / pitch()) * pitch(), behavior: reduce ? 'auto' : 'smooth' }); }
    };
    sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end);
    sc.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    sc.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  var stg = document.querySelector('[data-stgg-track]');
  if (stg) slider(stg, $$('.stgg__step', stg), $$('[data-stgg]'), document.querySelector('[data-stgg-pos]'));
  var wk = document.querySelector('[data-wk-track]');
  if (wk) slider(wk, $$('.wcard', wk), $$('[data-wk]'), null);

  /* ---------- подписи встроенных SVG (котельная, дом) не мельче 12 px после масштаба ---------- */
  var fitSvgs = $$('svg[data-fit-text]');
  if (fitSvgs.length) {
    fitSvgs.forEach(function (s) { $$('text', s).forEach(function (t) { t.dataset.fs = t.getAttribute('font-size'); }); });
    // стрелка сразу за подписью (line + path) сдвигается на прирост длины текста, чтобы не наезжать на него
    var arrowOf = function (t) { var a = t.nextElementSibling, b = a && a.nextElementSibling; return a && a.tagName === 'line' && b && b.tagName === 'path' ? [a, b] : null; };
    var fitText = function () {
      fitSvgs.forEach(function (s) {
        var k = s.getBoundingClientRect().width / s.viewBox.baseVal.width; if (!k) return;
        $$('text', s).forEach(function (t) {
          var fs = +t.dataset.fs, ar = arrowOf(t);
          if (ar && !t.dataset.len0) { t.style.fontSize = fs + 'px'; t.dataset.len0 = t.getComputedTextLength(); }
          t.style.fontSize = (fs * k < 12 ? (12 / k).toFixed(2) : fs) + 'px';
          if (ar) { var dx = (t.getComputedTextLength() - +t.dataset.len0).toFixed(1); ar.forEach(function (e) { e.setAttribute('transform', 'translate(' + dx + ' 0)'); }); }
        });
      });
    };
    fitText(); addEventListener('resize', fitText);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      fitSvgs.forEach(function (s) { $$('text', s).forEach(function (t) { delete t.dataset.len0; }); }); fitText();
    });
  }
})();
