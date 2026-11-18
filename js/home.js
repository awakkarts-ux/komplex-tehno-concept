// 18.11 — Главная по Figma 98:4951: схема узла (наведение / шторка), кадры чертежа «Услуг», лента «Этапов» (вариант Г)
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchMQ = matchMedia('(max-width: 1023px), (hover: none)');
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Схема узла ---------- */
  var stage = document.querySelector('[data-uzel]');
  if (stage) {
    var ITEMS = JSON.parse(document.getElementById('uzel-items').textContent);
    var svg = stage.querySelector('.uzel__svg'), tip = stage.querySelector('.uzel__tip');
    var hits = $$('.hit', svg), dots = $$('.dot', svg), lbls = $$('text.lbl', svg), tls = $$('.uzel__tl', stage);
    var VW = 1320;
    // точки: обёртка для масштаба (на узком экране точка не меньше ~10 px)
    dots.forEach(function (d) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'dot-s');
      while (d.firstChild) g.appendChild(d.firstChild); d.appendChild(g);
    });
    lbls.forEach(function (t) { t.dataset.fs = t.getAttribute('font-size'); });
    function fit() {
      var k = svg.getBoundingClientRect().width / VW || 1;
      // подписи схемы не мельче 12 px после масштаба (на ≤1023 они скрыты и заменены HTML-подписями)
      lbls.forEach(function (t) { var fs = +t.dataset.fs; t.style.fontSize = (fs * k < 12 ? (12 / k).toFixed(2) : fs) + 'px'; });
      var ds = Math.max(1, 1 / k); // точка ≥ 10 px в диаметре на экране (ядро r=5 в единицах схемы)
      dots.forEach(function (d) { d.firstChild.setAttribute('transform', 'scale(' + Math.min(ds, 3.4).toFixed(2) + ')'); });
      // HTML-подписи Т1/Т2 (≤1023) — по высоте рисунка, а не стола с подсказкой
      var sh = svg.getBoundingClientRect().height;
      tls[0].style.top = (sh * .225) + 'px'; tls[1].style.top = (sh * .875) + 'px';
    }
    fit(); addEventListener('resize', fit);

    function dimDot(el) { var n = hits.indexOf(el); dots.forEach(function (d, i) { d.classList.toggle('off', i === n); }); }
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
      tip.classList.add('on'); dimDot(el);
    }
    hits.forEach(function (h) {
      h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', ITEMS[+h.dataset.k].t);
      h.addEventListener('mouseenter', function () { showTip(h); });
      h.addEventListener('mouseleave', clearAll);
      h.addEventListener('focus', function () { showTip(h); });
      h.addEventListener('blur', clearAll);
      h.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && touchMQ.matches) { e.preventDefault(); openSheet(hits.indexOf(h)); } });
    });

    // ≤1023 / касание: тап рядом с точкой (радиус 28 px) → нижняя шторка; второй тап по той же точке — закрыть
    var modal = document.querySelector('[data-uzel-modal]'), sheet = modal.querySelector('.uzel__sheet');
    var cropSvg = modal.querySelector('.uzel__crop svg'), ring = modal.querySelector('.uzel__ring');
    var order = []; ITEMS.forEach(function (_, k) { var i = hits.findIndex(function (h) { return +h.dataset.k === k; }); if (i >= 0) order.push(i); });
    var cur = -1, closeT;
    function centers() {
      return hits.map(function (h) { var r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    }
    function dotCenters() { return dots.map(function (d) { var r = d.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); }
    function openSheet(i) {
      clearTimeout(closeT);
      cur = i; var h = hits[i], it = ITEMS[+h.dataset.k], b = h.getBBox();
      var pad = Math.max(b.width, b.height) * .45 + 24, w = b.width + pad * 2, hh = b.height + pad * 2;
      cropSvg.setAttribute('viewBox', [b.x - pad, b.y - pad, w, hh].map(function (v) { return v.toFixed(1); }).join(' '));
      ring.setAttribute('x', b.x - 6); ring.setAttribute('y', b.y - 6); ring.setAttribute('width', b.width + 12); ring.setAttribute('height', b.height + 12);
      ring.style.display = h.tagName === 'path' ? 'none' : '';
      modal.querySelector('#uzel-sheet-t').textContent = it.t;
      modal.querySelector('.uzel__d').textContent = it.d;
      var oi = order.indexOf(hits.findIndex(function (x) { return x.dataset.k === h.dataset.k; }));
      modal.querySelector('.uzel__cnt').textContent = String(oi + 1).padStart(2, '0') + ' / ' + String(order.length).padStart(2, '0');
      hits.forEach(function (x) { x.classList.toggle('on', x === h); }); dimDot(h);
      if (modal.hidden) { modal.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-on'); }); }); }
      sheet.style.transform = '';
    }
    function closeSheet() {
      if (modal.hidden) return;
      modal.classList.remove('is-on'); sheet.style.transform = ''; cur = -1; clearAll();
      closeT = setTimeout(function () { modal.hidden = true; }, reduce ? 0 : 280);
    }
    stage.addEventListener('click', function (e) {
      if (!touchMQ.matches) return;
      var c = dotCenters(), best = -1, bd = 28 * 28;
      c.forEach(function (p, i) { var d = (p.x - e.clientX) * (p.x - e.clientX) + (p.y - e.clientY) * (p.y - e.clientY); if (d < bd) { bd = d; best = i; } });
      if (best < 0) { // промах по точкам — ближайший прибор по зоне
        var hc = centers(); bd = 40 * 40;
        hc.forEach(function (p, i) { var d = (p.x - e.clientX) * (p.x - e.clientX) + (p.y - e.clientY) * (p.y - e.clientY); if (d < bd) { bd = d; best = i; } });
      }
      if (best < 0) return;
      if (best === cur) closeSheet(); else openSheet(best);
    });
    $$('[data-uzel-close]', modal).forEach(function (b) { b.addEventListener('click', closeSheet); });
    $$('[data-uzel-step]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = +hits[cur].dataset.k, oi = order.findIndex(function (i) { return +hits[i].dataset.k === k; });
        openSheet(order[(oi + +b.dataset.uzelStep + order.length) % order.length]);
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    // свайп вниз по шторке — закрыть
    var y0 = null;
    sheet.addEventListener('pointerdown', function (e) { if (sheet.scrollTop > 0 || e.target.closest('button')) return; y0 = e.clientY; });
    sheet.addEventListener('pointermove', function (e) { if (y0 === null) return; var dy = Math.max(0, e.clientY - y0); sheet.style.transition = 'none'; sheet.style.transform = 'translateY(' + dy + 'px)'; });
    function up(e) { if (y0 === null) return; var dy = e.clientY - y0; y0 = null; sheet.style.transition = ''; if (dy > 60) closeSheet(); else sheet.style.transform = ''; }
    sheet.addEventListener('pointerup', up); sheet.addEventListener('pointercancel', up);
    touchMQ.addEventListener('change', function () { closeSheet(); clearAll(); });
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
    function show(s) {
      imgs.forEach(function (im, i) { im.classList.toggle('is-on', i === s); });
      no.textContent = s ? '[' + String(s).padStart(2, '0') + ']' : '';
      nm.textContent = s ? rows[s - 1].querySelector('.svc__name').textContent : 'Узел учёта тепловой энергии';
      cap.textContent = CAP[s];
    }
    function opened() { var i = rows.findIndex(function (r) { return r.classList.contains('is-open'); }); return i + 1; }
    rows.forEach(function (r, i) {
      var h = r.querySelector('.svc__head');
      h.addEventListener('click', function () { setTimeout(function () { show(opened()); }, 0); });
      h.addEventListener('mouseenter', function () { if (matchMedia('(hover: hover)').matches) show(i + 1); });
      h.addEventListener('mouseleave', function () { show(opened()); });
    });
    show(opened());
  }

  /* ---------- Этапы, вариант Г: стрелки, перетаскивание, ←/→, счётчик 01/07 ---------- */
  var sc = document.querySelector('[data-stgg-track]');
  if (sc) {
    var btns = $$('[data-stgg]'), pos = document.querySelector('[data-stgg-pos]'), steps = $$('.stgg__step', sc);
    var stepW = function () { return steps[1].offsetLeft - steps[0].offsetLeft; };
    var upd = function () {
      btns[0].disabled = sc.scrollLeft <= 2;
      btns[1].disabled = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2;
      var i = Math.min(steps.length, Math.round(sc.scrollLeft / stepW()) + 1);
      if (btns[1].disabled) i = steps.length;
      pos.textContent = String(i).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    };
    var go = function (d) { sc.scrollTo({ left: (Math.round(sc.scrollLeft / stepW()) + d) * stepW(), behavior: reduce ? 'auto' : 'smooth' }); };
    btns.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.stgg); }); });
    sc.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    sc.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    // перетаскивание мышью (на касании — родная прокрутка)
    var x0 = null, s0 = 0, moved = false;
    sc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; x0 = e.clientX; s0 = sc.scrollLeft; moved = false; });
    sc.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      if (!moved && Math.abs(e.clientX - x0) > 4) { moved = true; sc.classList.add('is-drag'); sc.setPointerCapture(e.pointerId); }
      if (moved) sc.scrollLeft = s0 - (e.clientX - x0);
    });
    var end = function () {
      if (x0 === null) return; x0 = null;
      if (moved) { sc.classList.remove('is-drag'); sc.scrollTo({ left: Math.round(sc.scrollLeft / stepW()) * stepW(), behavior: reduce ? 'auto' : 'smooth' }); }
    };
    sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end);
    sc.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  /* ---------- подписи встроенных SVG (котельная, дом) не мельче 12 px после масштаба ---------- */
  var fitSvgs = [].slice.call(document.querySelectorAll('svg[data-fit-text]'));
  if (fitSvgs.length) {
    fitSvgs.forEach(function (s) { [].forEach.call(s.querySelectorAll('text'), function (t) { t.dataset.fs = t.getAttribute('font-size'); }); });
    // стрелка сразу за подписью (line + path) сдвигается на прирост длины текста, чтобы не наезжать на него
    var arrowOf = function (t) { var a = t.nextElementSibling, b = a && a.nextElementSibling; return a && a.tagName === 'line' && b && b.tagName === 'path' ? [a, b] : null; };
    var fitText = function () {
      fitSvgs.forEach(function (s) {
        var k = s.getBoundingClientRect().width / s.viewBox.baseVal.width; if (!k) return;
        [].forEach.call(s.querySelectorAll('text'), function (t) {
          var fs = +t.dataset.fs, ar = arrowOf(t);
          if (ar && !t.dataset.len0) { t.style.fontSize = fs + 'px'; t.dataset.len0 = t.getComputedTextLength(); }
          t.style.fontSize = (fs * k < 12 ? (12 / k).toFixed(2) : fs) + 'px';
          if (ar) { var dx = (t.getComputedTextLength() - +t.dataset.len0).toFixed(1); ar.forEach(function (e) { e.setAttribute('transform', 'translate(' + dx + ' 0)'); }); }
        });
      });
    };
    fitText(); addEventListener('resize', fitText);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      fitSvgs.forEach(function (s) { [].forEach.call(s.querySelectorAll('text'), function (t) { delete t.dataset.len0; }); }); fitText();
    });
  }
})();
