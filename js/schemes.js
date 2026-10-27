// 27.10 — схемы страниц услуг (графика-метафора). Строятся по data-sx, стили — css/schemes.css.
// Перенесено из пробы graphics-test.html: термограмма, чертёж узла, сезон. Новое: прямые участки, ведомость опытной
// эксплуатации, погрешность, листы проекта, пиктограммы объектов, магистраль шагов с клеймом. Числа на графиках иллюстративные
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]shot/.test(location.search);
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, a) { var t = el('text', a || {}, parent); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = s; return t; }
  function L(parent, tag, a, cls) { a['class'] = 'l' + (cls ? ' ' + cls : ''); return el(tag, a, parent); }
  function onView(node, fn, ratio) {
    if (reduce || !('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: ratio || .35 });
    io.observe(node);
  }
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function accent() { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C2410C'; }
  var uid = 0;

  // общая штриховка «/» для SVG-схем
  var defsHost = el('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute;width:0;height:0' });
  document.body.appendChild(defsHost);
  var pat = el('pattern', { id: 'sx-hatch', patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)' }, el('defs', {}, defsHost));
  el('line', { x1: 0, y1: 0, x2: 0, y2: 7, style: 'stroke:var(--accent);stroke-width:1.5' }, pat);

  // переключатель режимов внутри фигуры: кнопки .sx-seg [data-mode], подпись .sx-modecap из data-cap
  function seg(fig, onMode) {
    var btns = all('.sx-seg:not(.sx-var) button', fig), cap = fig.querySelector('.sx-modecap');
    function set(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (cap) cap.innerHTML = b.getAttribute('data-cap') || '';
      onMode(b.getAttribute('data-mode'));
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b); }); });
    var on = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || btns[0];
    if (on) set(on);
  }
  function fade(node, fn) {
    if (reduce || !node.firstChild) { fn(); return; }
    node.classList.add('sx-fade', 'is-out');
    setTimeout(function () { fn(); node.classList.remove('is-out'); }, 200);
  }

  // ── Термограмма из плашек (Обследование) ──
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(',') + ')';
  }
  function noise(x, s) { return Math.sin(x * 37 + s) * .5 + Math.sin(x * 91 + s * 2.3) * .3 + Math.sin(x * 17 + s * .7) * .2; }
  function thermo(host) {
    if (host._stop) host._stop();
    var A = accent(); if (!/^#[0-9a-f]{6}$/i.test(A)) A = '#C2410C';
    var HEAT = ['#F0F1F3', mix('#F0F1F3', A, .1), mix('#F0F1F3', A, .3), mix('#F0F1F3', A, .55), mix('#F0F1F3', A, .8), A, mix(A, '#000000', .42)];
    var R = rem(), cell = Math.round(R * 1.25), gap = 2;
    var W = host.clientWidth, H = host.clientHeight, dpr = window.devicePixelRatio || 1;
    var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    host.innerHTML = '';
    var cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    function inR(u, v, a, b, c, d) { return u >= a && u <= c && v >= b && v <= d; }
    function glow(d, r) { return d <= 0 ? 1 : Math.max(0, 1 - d / r); }
    var base = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var u = (c + .5) / cols, v = (r + .5) / rows, h = .04 + .03 * noise(u * 9, v * 7);
      if (inR(u, v, .18, .22, .82, .82)) h = .2 + .04 * noise(u * 20, v * 14);        // стены
      if (inR(u, v, .16, .16, .84, .22)) h = .36;                                     // кровля — теплопотери
      for (var i = 0; i < 6; i++) for (var j = 0; j < 3; j++) {                       // окна
        var wu = .24 + i * .1, wv = .30 + j * .16;
        if (inR(u, v, wu, wv, wu + .06, wv + .09)) h = .5 + .12 * ((i + j) % 3) / 2;
      }
      if (inR(u, v, .46, .70, .54, .82)) h = .3;                                      // дверь
      var pv = Math.abs(v - .9), py = Math.abs(u - .5);
      if (u <= .5 && pv < .12) h = Math.max(h, glow(pv * rows, 2.4));                 // ввод
      if (v >= .3 && v <= .92 && py < .1) h = Math.max(h, glow(py * cols, 2.4) * .95); // стояк
      if (v >= .88 && v <= .92 && u > .5 && u <= .9) h = Math.max(h, .85);            // разводка
      base[r * cols + c] = h;
    }
    var trail = new Float32Array(cols * rows), raf = 0, shown = reduce ? 1 : 0, t0 = null;
    function draw(ts) {
      ctx.clearRect(0, 0, W, H); var any = false;
      if (shown < 1) { if (t0 === null) t0 = ts; shown = Math.min(1, (ts - t0) / 1400); any = true; }
      var lim = ease(shown) * (rows + 8);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var k = r * cols + c, t = trail[k];
        if (t > .02) { trail[k] = t * .965; any = true; } else trail[k] = 0;
        var up = Math.max(0, Math.min(1, (lim - (rows - r)) / 8));                     // прогрев снизу вверх при появлении
        var lv = Math.min(6, Math.floor(Math.min(1, base[k] * up + t) * 6.99));
        ctx.fillStyle = HEAT[lv]; ctx.fillRect(c * cell, r * cell, cell - gap, cell - gap);
      }
      raf = any ? requestAnimationFrame(draw) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(draw); }
    if (reduce) draw(0); else { draw(0); cancelAnimationFrame(raf); raf = 0; t0 = null; onView(host, kick, .2); }
    function move(e) {
      var b = host.getBoundingClientRect(), c0 = (e.clientX - b.left) / cell, r0 = (e.clientY - b.top) / cell;
      for (var r = Math.max(0, Math.floor(r0 - 5)); r < Math.min(rows, r0 + 6); r++)
        for (var c = Math.max(0, Math.floor(c0 - 5)); c < Math.min(cols, c0 + 6); c++) {
          var d = Math.hypot(c + .5 - c0, r + .5 - r0), v = Math.max(0, 1 - d / 4.5) * .8;
          if (v > trail[r * cols + c]) trail[r * cols + c] = v;
        }
      kick();
    }
    host.addEventListener('pointermove', move);
    host._stop = function () { host.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
    var leg = host.closest('figure').querySelector('[data-heatleg]');
    if (leg) leg.innerHTML = '<span>ХОЛОДНО</span>' + HEAT.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '<span>ГОРЯЧО</span>';
  }

  // ── Чертёж узла учёта: plan (Проектирование) · install (Установка) · repair / replace / rebuild (Ремонт) ──
  function node(host) {
    var fig = host.closest('figure') || host.parentNode;
    host.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 1200 430', role: 'img', 'aria-label': 'Схема узла учёта тепловой энергии' }, host);
    var SY = 150, RY = 290;
    function G(n) { return el('g', { 'data-n': n }, svg); }
    function badge(parent, x, y, s) { el('circle', { cx: x, cy: y, r: 12, 'class': 'bd' }, parent); txt(parent, x, y + 4, s, { 'class': 'bt' }); }
    el('rect', { x: 170, y: SY + 8, width: 880, height: RY - SY - 16, fill: 'url(#sx-hatch)', 'class': 'hf' }, svg);
    el('rect', { x: 0, y: SY - 8, width: 1200, height: 16, 'class': 'pf-a' }, svg);
    el('rect', { x: 0, y: RY - 8, width: 1200, height: 16, 'class': 'pf-i' }, svg);
    [[SY, 'acc'], [RY, '']].forEach(function (p) { L(svg, 'line', { x1: 0, x2: 1200, y1: p[0] - 8, y2: p[0] - 8 }, p[1]); L(svg, 'line', { x1: 0, x2: 1200, y1: p[0] + 8, y2: p[0] + 8 }, p[1]); });
    el('path', { d: 'M0,' + SY + ' H1200', 'class': 'flow a' }, svg);
    el('path', { d: 'M1200,' + RY + ' H0', 'class': 'flow i' }, svg);
    txt(svg, 0, SY - 22, 'Т1 ПОДАЧА', { 'class': 'ta' }); txt(svg, 0, RY + 34, 'Т2 ОБРАТКА');

    var g1 = G(1);   // 01 запорная арматура
    [130, 1130].forEach(function (x) { [[SY, 'acc'], [RY, '']].forEach(function (p) {
      var y = p[0];
      el('rect', { x: x - 24, y: y - 9, width: 48, height: 18, 'class': 'fw' }, g1);
      L(g1, 'polygon', { points: (x - 22) + ',' + (y - 14) + ' ' + x + ',' + y + ' ' + (x - 22) + ',' + (y + 14), 'class': 'fw' }, p[1]).classList.add('fw');
      L(g1, 'polygon', { points: (x + 22) + ',' + (y - 14) + ' ' + x + ',' + y + ' ' + (x + 22) + ',' + (y + 14) }, p[1]).classList.add('fw');
      L(g1, 'line', { x1: x, y1: y, x2: x, y2: y - 36 }, p[1]); L(g1, 'line', { x1: x - 12, y1: y - 36, x2: x + 12, y2: y - 36 }, p[1]);
    }); });
    badge(g1, 130, 70, '01');
    var g2 = G(2);   // 02 фильтр
    el('rect', { x: 240, y: SY - 9, width: 60, height: 18, 'class': 'fw' }, g2);
    L(g2, 'rect', { x: 246, y: SY - 22, width: 48, height: 44 }, 'acc').classList.add('fw');
    L(g2, 'line', { x1: 252, y1: SY + 14, x2: 276, y2: SY - 14 }, 'acc'); L(g2, 'line', { x1: 264, y1: SY + 14, x2: 288, y2: SY - 14 }, 'acc');
    badge(g2, 270, 70, '02');
    var g3 = G(3);   // 03 манометр
    L(g3, 'line', { x1: 370, y1: SY - 8, x2: 370, y2: SY - 46 }, 'acc');
    L(g3, 'circle', { cx: 370, cy: SY - 62, r: 18 }, 'acc').classList.add('fw');
    L(g3, 'line', { x1: 370, y1: SY - 62, x2: 379, y2: SY - 70 }, 'acc');
    badge(g3, 370, 30, '03');
    var g4 = G(4);   // 04 датчики температуры
    L(g4, 'line', { x1: 480, y1: SY + 8, x2: 480, y2: 206 }, 'acc'); L(g4, 'circle', { cx: 480, cy: 206, r: 6 }, 'acc').classList.add('fw'); txt(g4, 468, 196, 'T1', { 'text-anchor': 'end' });
    L(g4, 'line', { x1: 560, y1: RY - 8, x2: 560, y2: 232 }, ''); L(g4, 'circle', { cx: 560, cy: 232, r: 6 }, '').classList.add('fw'); txt(g4, 548, 246, 'T2', { 'text-anchor': 'end' });
    badge(g4, 430, 220, '04');
    var g5 = G(5);   // 05 расходомер
    el('rect', { x: 980, y: SY - 9, width: 100, height: 18, 'class': 'fw' }, g5);
    L(g5, 'rect', { x: 986, y: SY - 30, width: 88, height: 60 }, 'acc').classList.add('fw');
    L(g5, 'path', { d: 'M996,' + SY + ' q8,-16 16,0 t16,0 t16,0 t16,0' }, 'acc');
    badge(g5, 1030, 70, '05');
    var old = el('g', { 'class': 'old' }, g5);   // Ремонт: старый прибор снят и поднят
    L(old, 'rect', { x: 986, y: SY - 128, width: 88, height: 60, 'stroke-dasharray': '6 5' }, 'mute');
    L(old, 'path', { d: 'M1030,' + (SY - 64) + ' V' + (SY - 38) + ' M1022,' + (SY - 46) + ' l8,8 8,-8' }, 'acc');
    txt(old, 1086, SY - 94, 'СНЯТ В РЕМОНТ', { 'class': 't2' });
    var g6 = G(6);   // 06 вычислитель
    L(g6, 'rect', { x: 800, y: 188, width: 160, height: 66 }, 'acc').classList.add('fw');
    L(g6, 'rect', { x: 812, y: 198, width: 136, height: 22 }, 'acc');
    txt(g6, 880, 214, 'ГКАЛ', { 'text-anchor': 'middle' });
    [826, 846, 866].forEach(function (x) { L(g6, 'circle', { cx: x, cy: 238, r: 4 }, 'acc'); });
    badge(g6, 934, 238, '06');
    var g7 = G(7);   // 07 линии связи
    el('path', { d: 'M486,206 H800', 'class': 'sig' }, g7);
    el('path', { d: 'M566,232 H800', 'class': 'sig' }, g7);
    el('path', { d: 'M1030,' + (SY + 30) + ' V215 H960', 'class': 'sig' }, g7);
    badge(g7, 680, 206, '07');
    // Замена: новые приборы
    var nt = el('g', { 'class': 'new-tag' }, svg);
    [[370, 30], [1030, 70], [880, 188], [480, 206]].forEach(function (p, i) {
      var y = i === 2 ? p[1] - 26 : i === 3 ? 262 : p[1] - 30;
      el('rect', { x: p[0] - 30, y: y - 14, width: 60, height: 20, rx: 2, 'class': 'fa' }, nt);
      txt(nt, p[0], y + 1, 'НОВЫЙ', { 'text-anchor': 'middle', fill: '#fff', style: 'fill:#fff' });
    });
    // размерные линии
    var gd = el('g', { 'class': 'dim' }, svg);
    var xs = [130, 270, 370, 480, 560, 800, 960, 1030, 1130];
    xs.forEach(function (x) { L(gd, 'line', { x1: x, y1: RY + 18, x2: x, y2: 372 }, ''); L(gd, 'line', { x1: x - 5, y1: 367, x2: x + 5, y2: 357 }, ''); });
    L(gd, 'line', { x1: 130, y1: 362, x2: 1130, y2: 362 }, '');
    txt(gd, 130, 398, 'ВВОД'); txt(gd, 1130, 398, 'К ПОТРЕБИТЕЛЮ', { 'text-anchor': 'end' });

    // data-hl — список номеров через пробел; data-pin у хоста — подсветка по умолчанию (её ставит аккордеон услуг)
    function hl(n) {
      n = n || host.getAttribute('data-pin');
      if (n) svg.setAttribute('data-hl', n); else svg.removeAttribute('data-hl');
      all('.sx-legend li', fig).forEach(function (li) { li.classList.toggle('is-hl', !!n && n.split(' ').indexOf(li.getAttribute('data-n')) >= 0); });
    }
    host._hl = hl;
    all('g[data-n]', svg).forEach(function (g) {
      g.addEventListener('pointerenter', function () { hl(g.getAttribute('data-n')); });
      g.addEventListener('pointerleave', function () { hl(null); });
    });
    all('.sx-legend li', fig).forEach(function (li) {
      li.addEventListener('pointerenter', function () { hl(li.getAttribute('data-n')); });
      li.addEventListener('pointerleave', function () { hl(null); });
    });
    function mode(m) {
      svg.setAttribute('class', m && m !== 'install' ? 'is-' + m : '');
      svg.setAttribute('viewBox', m === 'plan' || m === 'rebuild' ? '0 0 1200 430' : '0 0 1200 340');   // без размерных линий — без пустого низа
    }
    host._mode = mode;
    if (fig.querySelector('.sx-seg:not(.sx-var)')) seg(fig, mode); else mode(host.getAttribute('data-mode'));
    hl(null);
  }

  // ── Сезон: год с мая по апрель (Сервис) ──
  var MS = ['МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК', 'ЯНВ', 'ФЕВ', 'МАР', 'АПР'];
  var MF = ['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель'];
  var MG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function season(host) {
    var SEASON = 5, VISITS = [1.5, 7.5, 10.5], PRE = 4.5;
    host.innerHTML = '';
    var tip = document.createElement('div'); tip.className = 'sx-tip'; host.appendChild(tip);
    var R = rem(), W = host.clientWidth, H = host.clientHeight;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    host.insertBefore(svg, tip);
    function X(m) { return m / 12 * W; }
    var bT = 3 * R, rT = H - 4.5 * R;
    var font = 'font-size:' + Math.max(11, R * .8125) + 'px';
    el('rect', { x: 0, y: bT, width: X(SEASON), height: rT - bT, fill: '#F5F5F7' }, svg);
    el('rect', { x: X(SEASON), y: bT, width: W - X(SEASON), height: rT - bT, fill: 'url(#sx-hatch)' }, svg);
    txt(svg, .875 * R, bT + 1.625 * R, 'МЕЖСЕЗОНЬЕ', { 'class': 't2', style: font });
    var lb = el('rect', { fill: '#fff' }, svg);
    var t2 = txt(svg, X(SEASON) + 1.25 * R, bT + 1.625 * R, 'ОТОПИТЕЛЬНЫЙ ПЕРИОД', { 'class': 'ta', style: font });
    var bb = t2.getBBox(); lb.setAttribute('x', bb.x - .5 * R); lb.setAttribute('y', bb.y - .375 * R); lb.setAttribute('width', bb.width + R); lb.setAttribute('height', bb.height + .75 * R);
    el('line', { x1: 0, x2: W, y1: rT, y2: rT, style: 'stroke:var(--text)', 'stroke-width': 1 }, svg);
    for (var w = 0; w <= 52; w++) { var x = W * w / 52; el('line', { x1: x, x2: x, y1: rT, y2: rT + .5 * R, style: 'stroke:var(--text)', 'stroke-width': 1 }, svg); }
    for (var m = 0; m <= 12; m++) {
      var edge = m === SEASON || m === 12 || m === 0;
      el('line', { x1: X(m), x2: X(m), y1: rT, y2: rT + (edge ? 1.75 : 1.125) * R, style: 'stroke:' + ((m === SEASON || m === 12) ? 'var(--accent)' : 'var(--text)'), 'stroke-width': edge ? 2 : 1 }, svg);
      if (m < 12) txt(svg, X(m + .5), rT + 2.75 * R, MS[m], { 'text-anchor': 'middle', 'class': m >= SEASON ? 'ta' : '', style: font });
    }
    function diamond(m, s, fill, stroke) {
      var x = X(m);
      el('rect', { x: x - s / 2, y: rT - s / 2, width: s, height: s, style: 'fill:' + fill + ';stroke:' + stroke, 'stroke-width': 2, transform: 'rotate(45 ' + x + ' ' + rT + ')' }, svg);
    }
    el('line', { x1: X(PRE), x2: X(PRE), y1: 1.375 * R, y2: rT, style: 'stroke:var(--accent)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
    txt(svg, X(PRE), .875 * R, 'ПРЕДСЕЗОННЫЙ ВЫЕЗД', { 'text-anchor': 'middle', 'class': 'ta', style: font });
    VISITS.forEach(function (v) { diamond(v, .875 * R, '#fff', 'var(--text)'); });
    diamond(PRE, 1.25 * R, 'var(--accent)', 'var(--accent)');
    var d = new Date(), mi = (d.getMonth() - 4 + 12) % 12, dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    var nx = X(mi + (d.getDate() - 1) / dim);
    el('line', { x1: nx, x2: nx, y1: 1.375 * R, y2: rT + 1.75 * R, style: 'stroke:var(--text)', 'stroke-width': 2 }, svg);
    el('circle', { cx: nx, cy: rT, r: .3125 * R, style: 'fill:var(--text)' }, svg);
    var near = Math.abs(nx - X(PRE)) < 12 * R;
    var tn = txt(svg, near ? (nx > X(PRE) ? nx - .375 * R : nx + .375 * R) : nx, .875 * R, 'СЕГОДНЯ, ' + d.getDate() + ' ' + MG[d.getMonth()].toUpperCase(), { 'text-anchor': near ? (nx > X(PRE) ? 'start' : 'end') : 'middle', style: font });
    if (near && nx > X(PRE)) tn.setAttribute('x', nx + .375 * R);
    var cur = el('line', { y1: bT, y2: rT + 1.75 * R, style: 'stroke:var(--text)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    host.onmousemove = function (e) {
      var x = Math.max(0, Math.min(W - 1, e.clientX - host.getBoundingClientRect().left)), m = Math.floor(x / W * 12);
      cur.setAttribute('x1', x); cur.setAttribute('x2', x); cur.setAttribute('opacity', 1);
      var nr = VISITS.concat([PRE]).filter(function (v) { return Math.abs(X(v) - x) < .75 * R; })[0];
      var what = nr === PRE ? 'Предсезонный выезд' : nr !== undefined ? 'Ежеквартальный выезд' : (m >= SEASON ? '<i>Отопительный период</i>' : 'Межсезонье');
      tip.innerHTML = '<b>' + MF[m] + '</b><br>' + what;
      tip.style.left = x + 'px'; tip.style.top = bT + 'px'; tip.classList.add('is-on');
    };
    host.onmouseleave = function () { cur.setAttribute('opacity', 0); tip.classList.remove('is-on'); };
  }

  // ── Прямые участки до и после расходомера (Обследование) ──
  function run(host) {
    var fig = host.closest('figure');
    var C = 120, D = 56, M0 = 640, M1 = 760;
    function build(m) {
      host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 1200 270', role: 'img', 'aria-label': 'Прямые участки трубопровода до и после расходомера' }, host);
      // контур трубы: [x, диаметр] по точкам
      var big = 84, pts = m === 'cone'
        ? [[20, big], [392, big], [472, D], [816, D], [896, big], [1180, big]]
        : [[20, D], [1180, D]];
      var top = pts.map(function (p) { return p[0] + ',' + (C - p[1] / 2); }).join(' ');
      var bot = pts.map(function (p) { return p[0] + ',' + (C + p[1] / 2); }).join(' ');
      el('polygon', { points: top + ' ' + bot.split(' ').reverse().join(' '), style: 'fill:#fff' }, svg);
      var before = m === 'local' ? 5 : 3, sx0 = M0 - before * D;
      el('rect', { x: sx0, y: C - D / 2 + 3, width: M0 - sx0, height: D - 6, fill: 'url(#sx-hatch)' }, svg);
      el('rect', { x: M1, y: C - D / 2 + 3, width: D, height: D - 6, fill: 'url(#sx-hatch)' }, svg);
      L(svg, 'polyline', { points: top }, ''); L(svg, 'polyline', { points: bot }, '');
      el('path', { d: 'M20,' + C + ' H1180', 'class': 'flow a' }, svg);
      // расходомер
      L(svg, 'rect', { x: M0, y: C - D / 2 - 18, width: M1 - M0, height: D + 36 }, 'acc').classList.add('fw');
      L(svg, 'circle', { cx: (M0 + M1) / 2, cy: C, r: 22 }, 'acc');
      L(svg, 'path', { d: 'M' + ((M0 + M1) / 2 - 12) + ',' + C + ' h24 M' + ((M0 + M1) / 2 + 5) + ',' + (C - 7) + ' l7,7 -7,7' }, 'acc');
      txt(svg, (M0 + M1) / 2, C - D / 2 - 30, 'РАСХОДОМЕР', { 'text-anchor': 'middle', 'class': 'ta lbl' });
      // местное сопротивление — задвижка
      if (m === 'local') {
        var vx = sx0 - 30;
        L(svg, 'polygon', { points: (vx - 24) + ',' + (C - 26) + ' ' + vx + ',' + C + ' ' + (vx - 24) + ',' + (C + 26) + ' ' + (vx + 24) + ',' + (C - 26) + ' ' + vx + ',' + C + ' ' + (vx + 24) + ',' + (C + 26) }, '').classList.add('fw');
        L(svg, 'path', { d: 'M' + vx + ',' + C + ' V' + (C - 52) + ' M' + (vx - 14) + ',' + (C - 52) + ' h28' }, '');
        txt(svg, vx, C - 64, 'ЗАДВИЖКА', { 'text-anchor': 'middle', 'class': 'lbl' });
      }
      if (m === 'cone') {
        txt(svg, 432, C - big / 2 - 14, 'КОНФУЗОР', { 'text-anchor': 'middle', 'class': 'ta lbl' });
        txt(svg, 856, C - big / 2 - 14, 'ДИФФУЗОР', { 'text-anchor': 'middle', 'class': 'ta lbl' });
        txt(svg, 200, C - big / 2 - 14, 'ДИАМЕТР ТРУБЫ', { 'text-anchor': 'middle', 'class': 'lbl' });
      }
      // шкала в Ду от начала прибора и размерные линии
      var ry = 205;
      for (var k = -9; k <= 7; k++) {
        var x = k < 0 ? M0 + k * D : M1 + k * D;
        if (k === 0) { el('line', { x1: M0, x2: M0, y1: ry - 6, y2: ry + 6, style: 'stroke:var(--text)' }, svg); }
        if (x < 20 || x > 1180) continue;
        el('line', { x1: x, x2: x, y1: ry - 4, y2: ry + 4, style: 'stroke:#9A9A9A' }, svg);
      }
      function dim(x0, x1, s) {
        L(svg, 'line', { x1: x0, x2: x1, y1: ry, y2: ry }, 'acc');
        [x0, x1].forEach(function (x) { L(svg, 'line', { x1: x, x2: x, y1: C + D / 2 + 8, y2: ry + 10 }, 'acc'); L(svg, 'line', { x1: x - 6, y1: ry + 6, x2: x + 6, y2: ry - 6 }, 'acc'); });
        var t = txt(svg, (x0 + x1) / 2, ry + 32, s, { 'text-anchor': 'middle', 'class': 'ta dimt' });
        return t;
      }
      dim(sx0, M0, (before === 5 ? 'НЕ МЕНЕЕ 5 ДУ' : 'НЕ МЕНЕЕ 3 ДУ'));
      dim(M1, M1 + D, '1 ДУ');
      txt(svg, 20, 262, 'ДУ — ДИАМЕТР УСЛОВНЫЙ, ДЕЛЕНИЯ ШКАЛЫ = 1 ДУ', { 'class': 'lbl' });
    }
    seg(fig, function (m) { fade(host, function () { build(m); }); });
  }

  // ── Ведомость опытной эксплуатации: 3 суток без ГВС, 7 — с ГВС (Установка) ──
  function trial(host) {
    var fig = host.closest('.sx-trial'), sum = fig.querySelector('.sx-trial__sum'), raf = 0;
    function build(days) {
      cancelAnimationFrame(raf);
      days = +days;
      var h = '<div class="sx-trial__grid">';
      for (var d = 0; d < days; d++) { h += '<div class="sx-trial__row"><span>СУТКИ ' + (d + 1) + '</span>'; for (var i = 0; i < 24; i++) h += '<i></i>'; h += '</div>'; }
      h += '</div><div class="sx-trial__hours"><span></span>';
      for (var i = 0; i < 24; i++) h += '<span>' + (i % 6 === 0 ? i + ':00' : '') + '</span>';
      host.innerHTML = h + '</div>';
      sum.innerHTML = '<b>' + days * 24 + '</b> почасовых записей · ' + days + ' суток без перерыва';
      var cells = all('.sx-trial__row i', host), n = 0, t0 = null, dur = 900 + days * 160;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(cells.length, Math.round(cells.length * (ts - t0) / dur));
        for (; n < k; n++) cells[n].classList.add('is-w');
        if (n < cells.length) raf = requestAnimationFrame(step);
      }
      if (reduce) cells.forEach(function (c) { c.classList.add('is-w'); });
      else onView(host, function () { raf = requestAnimationFrame(step); }, .3);
    }
    seg(fig, build);
  }

  // ── Погрешность: без обслуживания уходит за предел, с обслуживанием возвращается на выездах (Сервис) ──
  function drift(host) {
    host.innerHTML = '';
    var R = rem(), W = host.clientWidth, H = host.clientHeight, id = ++uid;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Погрешность узла учёта с обслуживанием и без него' }, host);
    var pl = 1 * R, pr = 15 * R, pt = 2.5 * R, pb = 3 * R, lim = .58;
    function X(u) { return pl + u * (W - pl - pr); }
    function Y(v) { return pt + (1 - v) * (H - pt - pb); }
    var defs = el('defs', {}, svg), gp = el('pattern', { id: 'sxg' + id, patternUnits: 'userSpaceOnUse', width: 6, height: 6, patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#9A9A9A', 'stroke-width': 1.5 }, gp);
    var clip = el('rect', { x: 0, y: 0, width: reduce ? W : 0, height: H }, el('clipPath', { id: 'sxc' + id }, defs));
    var font = 'font-size:' + Math.max(11, R * .75) + 'px';
    el('rect', { x: X(0), y: Y(1), width: X(1) - X(0), height: Y(lim) - Y(1), fill: 'url(#sxg' + id + ')', opacity: .55 }, svg);
    el('line', { x1: X(0), x2: X(1), y1: Y(lim), y2: Y(lim), style: 'stroke:var(--text)', 'stroke-width': 1.5 }, svg);
    txt(svg, X(1) + R, Y(lim) + 4, 'ПРЕДЕЛ ПОГРЕШНОСТИ', { style: font });
    txt(svg, X(1) + R, Y(.82) + 4, 'РАСХОЖДЕНИЕ В СЧЁТЕ,', { 'class': 't2', style: font });
    txt(svg, X(1) + R, Y(.82) + 4 + 1.25 * R, 'ПРЕТЕНЗИЯ РСО', { 'class': 't2', style: font });
    el('line', { x1: X(0), x2: X(1), y1: Y(0), y2: Y(0), style: 'stroke:var(--text)', 'stroke-width': 1 }, svg);
    for (var i = 0; i <= 40; i++) el('line', { x1: X(i / 40), x2: X(i / 40), y1: Y(0), y2: Y(0) + (i % 10 ? .4 : .9) * R, style: 'stroke:var(--text)', 'stroke-width': 1 }, svg);
    txt(svg, X(0), Y(0) + 2.25 * R, 'УЗЕЛ ДОПУЩЕН', { style: font });
    txt(svg, X(1), Y(0) + 2.25 * R, 'ВРЕМЯ →', { 'text-anchor': 'end', 'class': 't2', style: font });
    txt(svg, X(0), pt - 1 * R, 'ПОГРЕШНОСТЬ ↑', { 'class': 't2', style: font });
    var g = el('g', { 'clip-path': 'url(#sxc' + id + ')' }, svg);
    // без обслуживания — прямая с лёгким ускорением, пересекает предел
    var p = [], cross = null;
    for (var j = 0; j <= 60; j++) { var u = j / 60, v = .04 + .92 * Math.pow(u, 1.15); p.push(X(u).toFixed(1) + ',' + Y(v).toFixed(1)); if (cross === null && v >= lim) cross = u; }
    L(g, 'polyline', { points: p.join(' '), 'stroke-dasharray': '7 6' }, '');
    // с обслуживанием — пила: выезд возвращает показания
    var visits = [.2, .4, .6, .8], s = [], last = 0;
    visits.concat([1]).forEach(function (vx) {
      var v0 = .04, v1 = .04 + .92 * Math.pow(vx - last, 1.15);
      s.push(X(last).toFixed(1) + ',' + Y(v0).toFixed(1), X(vx).toFixed(1) + ',' + Y(v1).toFixed(1));
      if (vx < 1) s.push(X(vx).toFixed(1) + ',' + Y(v0).toFixed(1));
      last = vx;
    });
    L(g, 'polyline', { points: s.join(' '), 'stroke-width': 2.5 }, 'acc');
    visits.forEach(function (vx) {
      var x = X(vx), y = Y(.04), sz = .75 * R;
      el('rect', { x: x - sz / 2, y: y - sz / 2, width: sz, height: sz, style: 'fill:var(--accent)', transform: 'rotate(45 ' + x + ' ' + y + ')' }, g);
      txt(g, x + .9 * R, Y(.04) + .3 * R, 'ВЫЕЗД', { 'class': 'ta', style: font });
    });
    var cx = X(cross), cy = Y(lim);
    el('circle', { cx: cx, cy: cy, r: .45 * R, style: 'fill:#fff;stroke:var(--text)', 'stroke-width': 2 }, g);
    el('line', { x1: cx, x2: cx, y1: cy, y2: Y(.94), style: 'stroke:var(--text)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    var tb = txt(g, cx + .6 * R, Y(.94) + 4, 'ВЫ УЗНАЁТЕ ОБ ЭТОМ ИЗ СЧЁТА', { style: font });
    if (!reduce) onView(host, function () {
      var t0 = null;
      (function st(ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 2200); clip.setAttribute('width', W * ease(k)); if (k < 1) requestAnimationFrame(st); })(performance.now());
    }, .4);
  }

  // ── Листы проекта: 13 разделов, наведение связывает лист и строку перечня (Проектирование) ──
  var GLYPH = {
    doc: 'M8 10h44M8 18h44M8 26h30M8 38h44M8 46h22',
    plan: 'M6 6h48v48H6zM6 30h22v24M28 6v14h26M40 30h14',
    scheme: 'M4 18h52M4 42h52M14 18v24M30 12v12M46 36v12M24 30h12',
    wire: 'M8 8h16v12H8zM36 40h16v12H36zM16 20v16h28v4M24 14h20v26',
    db: 'M10 12c0-4 40-4 40 0v36c0 4-40 4-40 0zM10 24c0 4 40 4 40 0M10 36c0 4 40 4 40 0',
    seal: 'M6 30h48M30 30v-14M30 30m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M22 46h16',
    formula: 'M8 16h12M14 10v12M28 16h22M8 40l10 10M18 40L8 50M30 45h20',
    flow: 'M4 30h52M30 30m-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0M24 30h12M32 26l4 4-4 4',
    table: 'M6 8h48v44H6zM6 20h48M6 32h48M6 44h48M22 8v44M38 8v44',
    form: 'M6 8h48v44H6zM6 18h48M12 28h20M12 36h30M12 44h16M40 26h10v8H40z',
    mount: 'M4 34h14M42 34h14M18 24v20M42 24v20M18 34h24M30 14v14M24 14h12',
    spec: 'M6 8h48v44H6zM6 18h48M16 8v44M10 26h2M10 34h2M10 42h2M20 26h28M20 34h22M20 42h26'
  };
  var SHEETS = ['doc', 'plan', 'scheme', 'plan', 'wire', 'db', 'seal', 'formula', 'flow', 'table', 'form', 'mount', 'spec'];
  function sheets(host) {
    var rows = all('.sv-rows li', host.closest('.sp-sec'));
    host.innerHTML = SHEETS.map(function (k, i) {
      return '<div class="sx-sheet" style="--i:' + i + '" data-i="' + i + '"><span class="sx-sheet__no">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
        '<svg viewBox="0 0 60 60" aria-hidden="true"><path class="l" d="' + GLYPH[k] + '"/></svg><i class="sx-sheet__st"></i></div>';
    }).join('');
    var sh = all('.sx-sheet', host);
    function hl(i) { sh.forEach(function (s, j) { s.classList.toggle('is-hl', j === i); }); rows.forEach(function (r, j) { r.classList.toggle('is-hl', j === i); }); }
    sh.forEach(function (s, i) { s.addEventListener('pointerenter', function () { hl(i); }); s.addEventListener('pointerleave', function () { hl(-1); }); });
    rows.forEach(function (r, i) { r.addEventListener('pointerenter', function () { hl(i); }); r.addEventListener('pointerleave', function () { hl(-1); }); });
  }

  // ── Пиктограммы объектов: МКД, промышленное предприятие, котельная и ЦТП ──
  var OBJ = {
    mkd: function (s) {
      L(s, 'line', { x1: 8, x2: 192, y1: 106, y2: 106 }, 'mute');
      L(s, 'rect', { x: 36, y: 14, width: 84, height: 92 }, '');
      for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) L(s, 'rect', { x: 45 + c * 18, y: 22 + r * 14, width: 8, height: 7 }, '');
      el('path', { d: 'M192,94 H112', 'class': 'flow a' }, s); L(s, 'line', { x1: 192, x2: 112, y1: 94, y2: 94 }, 'acc');
      L(s, 'line', { x1: 192, x2: 112, y1: 101, y2: 101 }, '');
      L(s, 'rect', { x: 92, y: 88, width: 20, height: 18, }, 'acc').classList.add('fw', 'node');
      txt(s, 150, 86, 'ИТП', { 'class': 'ta', style: 'font-size:10px' });
    },
    prom: function (s) {
      L(s, 'line', { x1: 8, x2: 192, y1: 106, y2: 106 }, 'mute');
      L(s, 'path', { d: 'M40 106V52L66 34V52L92 34V52L118 34V52L144 34V106Z' }, '');
      L(s, 'rect', { x: 152, y: 12, width: 12, height: 94 }, '');
      L(s, 'path', { d: 'M54 66h76M54 80h76' }, 'mute');
      el('path', { d: 'M8,94 H64', 'class': 'flow a' }, s); L(s, 'line', { x1: 8, x2: 64, y1: 94, y2: 94 }, 'acc');
      L(s, 'line', { x1: 8, x2: 64, y1: 101, y2: 101 }, '');
      L(s, 'rect', { x: 64, y: 88, width: 22, height: 18, }, 'acc').classList.add('fw', 'node');
      txt(s, 12, 86, 'ВВОД', { 'class': 'ta', style: 'font-size:10px' });
    },
    kot: function (s) {
      L(s, 'line', { x1: 8, x2: 192, y1: 106, y2: 106 }, 'mute');
      L(s, 'path', { d: 'M30 106V54L62 36L94 54V106Z' }, '');
      L(s, 'rect', { x: 72, y: 8, width: 12, height: 40 }, '');
      L(s, 'rect', { x: 44, y: 70, width: 36, height: 24 }, 'mute');
      el('path', { d: 'M94,84 H192', 'class': 'flow a' }, s); L(s, 'line', { x1: 94, x2: 192, y1: 84, y2: 84 }, 'acc');
      el('path', { d: 'M192,98 H94', 'class': 'flow i' }, s); L(s, 'line', { x1: 94, x2: 192, y1: 98, y2: 98 }, '');
      L(s, 'rect', { x: 120, y: 76, width: 22, height: 30, }, 'acc').classList.add('fw', 'node');
      txt(s, 192, 74, 'В СЕТЬ', { 'text-anchor': 'end', 'class': 'ta', style: 'font-size:10px' });
    }
  };
  function objs(host) {
    var keys = (host.getAttribute('data-objs') || 'mkd prom kot').split(' ');
    all('.sp-card, .sv2-obj', host).forEach(function (card, i) {
      var box = document.createElement('div'); box.className = 'sx sx-obj'; box.setAttribute('aria-hidden', 'true');
      var s = el('svg', { viewBox: '0 0 200 120' }, box);
      if (OBJ[keys[i]]) OBJ[keys[i]](s);
      card.insertBefore(box, card.firstChild);
    });
  }

  // ── Шаги на магистрали Т1/Т2; клеймо на последнем шаге, когда он виден ──
  function pipe(ol) {
    var ring = ol.getAttribute('data-ring'), word = ol.getAttribute('data-stamp');
    if (!word) return;
    var lastStep = all(':scope > .sp-step', ol).pop(), id = 'sxs' + (++uid);
    lastStep.classList.add('has-stamp');
    lastStep.insertAdjacentHTML('beforeend', '<svg class="sx-stamp" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs>' +
      '<circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<text font-size="9.5" font-weight="700"><textPath href="#' + id + '" textLength="276" lengthAdjust="spacing">' + ring + '</textPath></text>' +
      '<text x="60" y="' + (word.length > 8 ? 62 : 59) + '" text-anchor="middle" font-size="' + (word.length > 8 ? 10 : 12) + '" font-weight="800">' + word + '</text>' +
      (word.length > 8 ? '' : '<text x="60" y="73" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="2">УУТЭ</text>') + '</svg>');
    onView(lastStep, function () { lastStep.classList.add('is-stamped'); }, .8);
  }

  // ── Переключатель вариантов блока (концепт, для показа клиенту): .sx-var [data-v] ↔ панели [data-v] в той же фигуре ──
  function variants(fig) {
    var btns = all('.sx-var button', fig), panes = all('[data-v]:not(button)', fig);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        panes.forEach(function (p) { p.hidden = p.getAttribute('data-v') !== b.getAttribute('data-v'); });
        all('[data-sx]', fig).forEach(function (h) { if (!h.closest('[hidden]')) builders[h.getAttribute('data-sx')](h); });   // скрытая панель строилась с нулевым размером
      });
    });
  }

  // ── «Услуги» на главной: лист условных обозначений вместо фото, следит за открытым пунктом аккордеона ──
  var SIGNS = [
    ['valve', 'Задвижка', '<path d="M4 32H18M46 32H60"/><path d="M18 22V42L46 22V42Z"/>'],
    ['filter', 'Фильтр', '<path d="M4 32H18M46 32H60"/><rect x="18" y="20" width="28" height="24"/><path d="M18 44L46 20" stroke-dasharray="3 3"/>'],
    ['flow', 'Расходомер', '<path d="M4 32H22M42 32H60"/><circle cx="32" cy="32" r="10"/><path d="M26 32h12M34 28l4 4-4 4"/>'],
    ['therm', 'Термометр', '<path d="M4 44H60"/><path d="M32 12V44"/><circle class="fi" cx="32" cy="40" r="4"/>'],
    ['mano', 'Манометр', '<path d="M4 50H60"/><path d="M32 50V36"/><circle cx="32" cy="24" r="12"/><path d="M32 24l6-6"/>'],
    ['calc', 'Вычислитель', '<rect x="10" y="16" width="44" height="32"/><path d="M17 24h30M17 32h18"/>'],
    ['sig', 'Линия связи', '<path d="M4 32H60" stroke-dasharray="4 5"/>'],
    ['dim', 'Размер', '<path d="M6 32H58M6 26v12M58 26v12M11 29.5l-5 2.5 5 2.5M53 29.5l5 2.5-5 2.5"/>']
  ];
  // какие знаки собраны в иконке услуги (по порядку услуг на главной)
  var SVC_SIGNS = [['mano', 'therm'], ['valve', 'dim'], ['valve', 'flow', 'therm'], ['flow'], ['therm', 'calc', 'sig'], ['flow', 'sig'], ['flow']];
  function svcSheet(box) {
    var list = box.closest('.services').querySelector('.svc__list'), items = all('.svc', list);
    box.innerHTML = '<p class="svc-sx__h"><span>Условные обозначения</span><span class="svc-sx__no"></span></p>' +
      '<div class="svc-sx__ic"><svg viewBox="0 0 64 64" aria-hidden="true"><use href=""/></svg></div><p class="svc-sx__name"></p>' +
      '<ul class="svc-sx__abc">' + SIGNS.map(function (s) { return '<li data-s="' + s[0] + '"><svg viewBox="0 0 64 64" aria-hidden="true">' + s[2] + '</svg>' + s[1] + '</li>'; }).join('') + '</ul>';
    var use = box.querySelector('use'), ic = box.querySelector('.svc-sx__ic');
    function sync() {
      var i = items.findIndex(function (x) { return x.classList.contains('is-open'); });
      box.classList.toggle('is-empty', i < 0);
      if (i < 0) return;
      var u = items[i].querySelector('.ic-box use');
      use.setAttribute('href', u ? u.getAttribute('href') : '');
      box.querySelector('.svc-sx__no').textContent = items[i].querySelector('.svc__no').textContent;
      box.querySelector('.svc-sx__name').textContent = items[i].querySelector('.svc__name').textContent;
      all('.svc-sx__abc li', box).forEach(function (li) { li.classList.toggle('is-on', (SVC_SIGNS[i] || []).indexOf(li.getAttribute('data-s')) >= 0); });
      if (!reduce) { ic.classList.remove('is-in'); void ic.offsetWidth; ic.classList.add('is-in'); }
    }
    items.forEach(function (it) { it.querySelector('.svc__head').addEventListener('click', function () { setTimeout(sync, 0); }); });
    sync();
  }

  // ── «Этапы» на главной: подача Т1 и обратка Т2 через все шаги, отвод к номеру, в конце узел с пломбой и клеймо допуска ──
  function stages(sec) {
    var steps = all('.stg__step', sec), track = sec.querySelector('.stg__track');
    steps.forEach(function (st) { st.insertAdjacentHTML('afterbegin', '<i class="mg-t1" aria-hidden="true"></i><i class="mg-t2" aria-hidden="true"></i><i class="mg-tap" aria-hidden="true"></i><i class="mg-j1" aria-hidden="true"></i><i class="mg-j2" aria-hidden="true"></i>'); });
    steps[0].insertAdjacentHTML('afterbegin', '<span class="mg-lab mg-lab--1" aria-hidden="true">Т1</span><span class="mg-lab mg-lab--2" aria-hidden="true">Т2</span>');
    track.insertAdjacentHTML('beforeend', '<li class="stg__end" aria-hidden="true"><i class="mg-t1"></i><i class="mg-t2"></i><b class="mg-box">УУТЭ</b><i class="mg-wire"></i><i class="mg-seal"></i><span class="mg-cap">Узел учёта<br>и пломба РСО</span></li>');
    // клеймо — у узла учёта в конце магистрали (на карточке 07 закрывало заголовок)
    var card = track.querySelector('.stg__end'), id = 'sxs' + (++uid);
    card.insertAdjacentHTML('beforeend', '<svg class="sx-stamp" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs>' +
      '<circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<text font-size="9.5" font-weight="700"><textPath href="#' + id + '" textLength="276" lengthAdjust="spacing">АКТ ДОПУСКА · КОММЕРЧЕСКАЯ ЭКСПЛУАТАЦИЯ ·</textPath></text>' +
      '<text x="60" y="59" text-anchor="middle" font-size="12" font-weight="800">ДОПУЩЕН</text><text x="60" y="73" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="2">УУТЭ</text></svg>');
    onView(card, function () { card.classList.add('is-stamped'); }, .9);
  }

  // ── запуск ──
  var builders = { thermo: thermo, node: node, season: season, run: run, drift: drift };
  function build() {
    all('[data-sx]').forEach(function (h) { var b = builders[h.getAttribute('data-sx')]; if (b && !h.closest('[hidden]')) b(h); });
  }
  function once() {
    all('.sx-var').forEach(function (v) { variants(v.closest('figure')); });
    all('[data-sx="svc"]').forEach(svcSheet);
    all('.stg--mg').forEach(stages);
    all('[data-sx="trial"]').forEach(trial);
    all('[data-sx="sheets"]').forEach(sheets);
    all('[data-sx="objs"]').forEach(objs);
    all('.sx-pipe, .sv2-pipe').forEach(pipe);
    all('[data-sx-on]').forEach(function (n) { if (!reduce) n.classList.add('is-wait'); onView(n, function () { n.classList.remove('is-wait'); n.classList.add('is-on'); }, .4); });
    if (!reduce) all('[data-sx="sheets"]').forEach(function (n) { onView(n, function () { n.classList.add('is-on'); }); }); else all('[data-sx="sheets"]').forEach(function (n) { n.classList.add('is-on'); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { once(); build(); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { all('[data-sx="thermo"],[data-sx="season"],[data-sx="drift"]').forEach(function (h) { if (!h.closest('[hidden]')) builders[h.getAttribute('data-sx')](h); }); }, 150); });
  // панель концепта меняет акцент — перекрасить термограмму (canvas не знает про CSS-переменные)
  new MutationObserver(function () { all('[data-sx="thermo"]').forEach(function (h) { if (!h.closest('[hidden]')) thermo(h); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
})();
