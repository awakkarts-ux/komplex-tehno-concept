/* Комплекс-Техно — концепт главной. Анимация фона, попап, лента этапов, переключатель акцента. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Плавная прокрутка — как на instituteofhealth.com: Lenis, duration 1.2, экспоненциальное затухание.
  // Стоп на время прелоадера, перехода между страницами и попапа. Программная прокрутка — через scrollToY
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    if (document.documentElement.classList.contains('is-preloader')) lenis.stop();
  }
  function scrollToY(y) { if (lenis) lenis.scrollTo(y); else scrollToY(y); }
  function headerOffset() { var h = document.querySelector('.header'); return (h ? h.offsetHeight : 0) + 24; }
  // якоря на этой же странице — плавно и с поправкой на закреплённую шапку
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href').slice(1);
    var t = id ? document.getElementById(id) : null;
    if (!t) return;
    e.preventDefault();
    scrollToY(t.getBoundingClientRect().top + window.scrollY - headerOffset());
    history.replaceState(null, '', '#' + id);
  });

  // Анимированный фон первого экрана и блока цифр — просьба клиента (референс promstoki.ru).
  // Тёплые частицы медленно поднимаются вверх, как нагретый воздух. Без свечений и пятен.
  function Particles(canvas) {
    var ctx = canvas.getContext('2d');
    // data-particles="dark" — тёмные частицы для светлого фона (блок цифр)
    var rgb = canvas.dataset.particles === 'dark' ? '24,28,33' : '255,255,255';
    var k = canvas.dataset.particles === 'dark' ? 0.55 : 1;
    var dots = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = null, visible = true;

    function seed() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((w * h) / 9000);
      dots = [];
      for (var i = 0; i < n; i++) dots.push(make(true));
    }
    function make(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + Math.random() * 40,
        r: 0.5 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.38,
        a: 0.06 + Math.random() * 0.34,
        ph: Math.random() * Math.PI * 2,
        sw: 0.15 + Math.random() * 0.45
      };
    }
    function draw(step) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (step) {
          d.y -= d.vy; d.ph += 0.01;
          d.x += Math.sin(d.ph) * d.sw * 0.3;
          if (d.y < -10) dots[i] = d = make(false);
        }
        // ярче внизу, тают к верху — как тёплый воздух
        var fade = Math.min(1, Math.max(0, d.y / h) * 1.4);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',' + (d.a * fade * k).toFixed(3) + ')';
        ctx.fill();
      }
    }
    function loop() { draw(true); raf = visible ? requestAnimationFrame(loop) : null; }
    seed();
    if (reduce) { draw(false); return; }
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(canvas);
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(seed, 150); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-particles]'), function (c) { Particles(c); });

  // Попап «Получить консультацию» — как на учетстоков.рф: без формы, телефон и почта
  var modal = document.getElementById('consult');
  var last = null;
  function open(btn) {
    last = btn; modal.hidden = false; document.body.style.overflow = 'hidden'; if (lenis) lenis.stop();
    modal.querySelector('.modal__close').focus();
  }
  function close() {
    modal.hidden = true; document.body.style.overflow = ''; if (lenis) lenis.start();
    if (last) last.focus();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-modal]');
    if (o) { e.preventDefault(); open(o); return; }
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  // Лента этапов: стрелки и счётчик
  var track = document.querySelector('.steps');
  if (track) {
    var prev = document.querySelector('[data-steps-prev]');
    var next = document.querySelector('[data-steps-next]');
    var count = document.querySelector('.steps-nav__count');
    var cards = track.querySelectorAll('.step');
    function stepW() { return cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0); }
    function update() {
      var i = Math.round(track.scrollLeft / stepW());
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      count.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + cards.length).slice(-2);
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Услуги — сцена по прокрутке, как на delta.ava-case.com: точка едет по линии, карточка гаснет,
  // следующая выезжает снизу, графика поворачивается. Плавность — догонялка к цели (как scrub у GSAP)
  var svc = document.querySelector('[data-svc]');
  if (svc) {
    var stage = svc.querySelector('.svc-stage');
    var sCards = svc.querySelectorAll('.svc-card');
    var sBtns = svc.querySelectorAll('[data-svc-go]');
    var ball = svc.querySelector('.svc-nav__ball');
    var cap = svc.querySelector('[data-svc-cap]');
    var shape = svc.querySelector('.svc-art__shape');
    var N = sCards.length, cur = 0, target = 0, running = false, active = -1;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function stepLen() { return window.innerHeight * 0.7; }
    function stickyTop() { return parseFloat(getComputedStyle(stage).top) || 0; }
    function readTarget() {
      var scrolled = stickyTop() - svc.getBoundingClientRect().top;
      target = clamp(scrolled / stepLen(), 0, N - 1);
    }
    function render() {
      for (var k = 0; k < N; k++) {
        var enter = k === 0 ? 1 : clamp(cur - (k - 1), 0, 1);
        var exit = k === N - 1 ? 0 : clamp(cur - k, 0, 1);
        sCards[k].style.transform = 'translateY(' + ((1 - enter) * 120).toFixed(2) + '%)';
        sCards[k].style.opacity = (1 - exit).toFixed(3);
        sBtns[k].style.opacity = (0.4 + 0.6 * Math.max(0, 1 - Math.abs(cur - k))).toFixed(3);
      }
      var i0 = Math.min(Math.floor(cur), N - 2), f = cur - i0;
      var x0 = sBtns[i0].parentNode.offsetLeft, x1 = sBtns[i0 + 1].parentNode.offsetLeft;
      ball.style.transform = 'translateX(' + (x0 + (x1 - x0) * f).toFixed(1) + 'px)';
      shape.style.transform = 'rotate(' + (cur * 90).toFixed(2) + 'deg)';
      var a = Math.round(cur);
      if (a !== active) {
        active = a;
        cap.textContent = sBtns[a].textContent.replace(/^(\d+)/, '$1 · ');
        for (var m = 0; m < N; m++) {
          sCards[m].setAttribute('aria-hidden', m === a ? 'false' : 'true');
          if (m === a) sBtns[m].setAttribute('aria-current', 'step'); else sBtns[m].removeAttribute('aria-current');
        }
      }
    }
    function tick() {
      cur += (target - cur) * (reduce ? 1 : 0.12);
      if (Math.abs(target - cur) < 0.0005) cur = target;
      render();
      running = cur !== target;
      if (running) requestAnimationFrame(tick);
    }
    function kick() { readTarget(); if (!running) { running = true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    // клик по пункту — прокрутка к его шагу
    Array.prototype.forEach.call(sBtns, function (b) {
      b.addEventListener('click', function () {
        var k = +b.dataset.svcGo;
        var y = window.scrollY + svc.getBoundingClientRect().top - stickyTop() + k * stepLen() + 2;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    readTarget(); cur = target; render();
  }

  // Прелоадер — по референсу 24ist.ru. Счётчик идёт к 90%, пока страница грузится, после load — к 100%.
  // Минимум 1,4 с, чтобы анимацию было видно. Таймеры, а не кадры анимации: работают и в фоновой вкладке
  (function () {
    var html = document.documentElement;
    var pre = document.querySelector('.preloader');
    var loader = document.querySelector('.header__loader');
    if (!html.classList.contains('is-preloader')) { if (pre) pre.remove(); if (loader) loader.remove(); return; }
    var count = document.querySelector('[data-loader-count]');
    var start = Date.now(), shown = 0, loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });
    var t = setInterval(function () {
      var cap = loaded ? 100 : 90;
      shown = Math.min(cap, shown + Math.max(0.6, (cap - shown) * 0.09));
      if (Date.now() - start < 1400) shown = Math.min(shown, 99);
      var v = Math.floor(shown);
      count.textContent = v;
      html.style.setProperty('--loader', (v - 100) + '%');
      if (v >= 100) {
        clearInterval(t);
        setTimeout(function () {
          html.classList.add('is-leaving');
          html.classList.remove('is-preloader');
          if (lenis) lenis.start();
          window.dispatchEvent(new Event('resize'));
          setTimeout(function () {
            html.classList.remove('is-leaving');
            html.style.removeProperty('--loader');
            pre.remove(); loader.remove();
          }, 2000);
        }, 450);
      }
    }, 40);
  })();

  // Этапы — по референсу 24ist.ru («Наш принцип»): сцена закреплена, прокрутка вниз двигает ленту влево.
  // Высота дорожки = высота сцены + длина сдвига + 20vh задержки. Плавность — догонялка (у них пружина)
  var hs = document.querySelector('[data-hs]');
  if (hs) {
    var hsSec = hs.closest('.hs');
    var hsStage = hs.querySelector('.hs-stage');
    var hsWrap = hs.querySelector('.hs-wrap');
    var hsDist = 0, hsCur = 0, hsTarget = 0, hsRun = false;
    function hsMeasure() {
      // ширина по раскладке, а не scrollWidth: сдвиг ленты для появления (translate 10rem) раздувает scrollWidth
      var pad = parseFloat(getComputedStyle(hsStage).paddingLeft) * 2;
      var list = hsWrap.lastElementChild;
      hsDist = Math.max(0, list.offsetLeft + list.offsetWidth - (hsStage.clientWidth - pad));
      hs.style.height = (hsStage.offsetHeight + hsDist + window.innerHeight * 0.2) + 'px';
    }
    function hsRead() {
      var top = parseFloat(getComputedStyle(hsStage).top) || 0;
      var scrolled = top - hs.getBoundingClientRect().top;
      hsTarget = hsDist ? Math.max(0, Math.min(1, scrolled / hsDist)) : 0;
    }
    function hsTick() {
      hsCur += (hsTarget - hsCur) * (reduce ? 1 : 0.1);
      if (Math.abs(hsTarget - hsCur) < 0.0002) hsCur = hsTarget;
      hsWrap.style.transform = 'translate3d(' + (-hsCur * hsDist).toFixed(1) + 'px,0,0)';
      hsRun = hsCur !== hsTarget;
      if (hsRun) requestAnimationFrame(hsTick);
    }
    function hsKick() { hsRead(); if (!hsRun) { hsRun = true; requestAnimationFrame(hsTick); } }
    hsMeasure(); hsRead(); hsCur = hsTarget; hsTick();
    window.addEventListener('scroll', hsKick, { passive: true });
    window.addEventListener('resize', function () { hsMeasure(); hsKick(); });
    if (document.fonts) document.fonts.ready.then(function () { hsMeasure(); hsKick(); });
    // лента въезжает при появлении секции
    new IntersectionObserver(function (e, o) {
      if (e[0].isIntersecting) { hsSec.classList.add('is-revealed'); o.disconnect(); }
    }, { threshold: 0.15 }).observe(hsSec);
  }

  // Переход между страницами — по референсу 24ist.ru. Тайминги и кривые — из их кода (framer-motion animate):
  // уход — панель из-под шапки на весь экран (.6s easeInOut), затем scale 1.2 + непрозрачность (.6s circIn);
  // приход — scale 1.2 → 1 (.6s), панель втягивается под шапку (.6s), заголовок выезжает по словам
  (function () {
    var html = document.documentElement;
    var veil = document.querySelector('.page-veil');
    var header = document.querySelector('.header');
    if (!veil || !header) return;
    var EIO = 'cubic-bezier(.42, 0, .58, 1)', CIRC_IN = 'cubic-bezier(0, .65, .55, 1)';
    var FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    function strip() { var h = header.offsetHeight + 'px'; return 'polygon(0% 0%, 100% 0%, 100% ' + h + ', 0% ' + h + ')'; }
    function anim(el, kf, opt) { return el.animate(kf, Object.assign({ fill: 'forwards' }, opt)).finished; }

    // Заголовок по словам: каждое слово в маске (.w), внутри выезжает снизу. Делим по обычным пробелам —
    // неразрывные склеивают предлог со словом, как в тексте
    function split(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { split(n); return; }
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/( +)/).forEach(function (part) {
          if (!part) return;
          if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span'); w.className = 'w';
          var i = document.createElement('span'); i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      });
      return el.querySelectorAll('.w > span');
    }
    function enterContent() {
      var title = document.querySelector('.js-page-title');
      if (title) Array.prototype.forEach.call(split(title), function (w, i) {
        w.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1000, easing: EIO, delay: 200 + 100 * i, fill: 'both' });
      });
      Array.prototype.forEach.call(document.querySelectorAll('.js-page-description'), function (d) {
        d.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1000, easing: EIO, delay: 400, fill: 'both' });
      });
      var img = document.querySelector('.js-page-image');
      if (img) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: EIO, delay: 200, fill: 'both' });
    }

    // Приход на страницу
    if (html.classList.contains('is-page-in')) {
      enterContent();
      anim(veil, [{ transform: 'scale(1.2)', opacity: 1, clipPath: FULL }, { transform: 'scale(1)', opacity: .95, clipPath: FULL }], { duration: 600, easing: EIO })
        .then(function () { return anim(veil, [{ transform: 'scale(1)', opacity: .95, clipPath: FULL }, { transform: 'scale(1)', opacity: .95, clipPath: strip() }], { duration: 600, easing: EIO }); })
        .then(function () {
          html.classList.remove('is-page-in');
          veil.getAnimations().forEach(function (a) { a.cancel(); });
        });
    }

    // Уход со страницы: любая ссылка на другую страницу сайта; якоря на этой же странице — без перехода
    function go(href) {
      if (html.classList.contains('is-page-out')) return;
      html.classList.add('is-page-out');
      if (lenis) lenis.stop();
      try { sessionStorage.setItem('kt-page-veil', '1'); } catch (e) {}
      anim(veil, [{ opacity: .95, clipPath: strip() }, { opacity: .95, clipPath: FULL }], { duration: 600, easing: EIO })
        .then(function () { return anim(veil, [{ transform: 'scale(1)', opacity: .95, clipPath: FULL }, { transform: 'scale(1.2)', opacity: 1, clipPath: FULL }], { duration: 600, easing: CIRC_IN }); })
        .then(function () { location.href = href; });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || reduce) return;
      var url = new URL(a.getAttribute('href'), location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      go(url.href);
    });
    // Возврат кнопкой «Назад» из кэша браузера — страница не должна остаться под панелью
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      html.classList.remove('is-page-out', 'is-page-in');
      veil.getAnimations().forEach(function (a) { a.cancel(); });
    });
  })();

  // Вопросы — раскрытие как на instituteofhealth.com: высота 0 → по содержимому, текст поднимается с 20%
  // и проявляется, плюс поворачивается в крестик. ~0.6s, кривая их иконки cubic-bezier(.165,.84,.44,1)
  (function () {
    var EASE = 'cubic-bezier(.165, .84, .44, 1)';
    Array.prototype.forEach.call(document.querySelectorAll('.qa-item'), function (item) {
      var head = item.querySelector('.qa-item__head');
      var body = item.querySelector('.qa-item__body');
      var text = item.querySelector('.qa-item__text');
      head.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        var from = body.offsetHeight;
        item.classList.toggle('is-open', open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        body.inert = !open;
        if (reduce) return;
        var to = open ? body.scrollHeight : 0;
        body.getAnimations().forEach(function (a) { a.cancel(); });
        body.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: open ? 600 : 450, easing: EASE });
        if (open) text.animate([{ opacity: 0, transform: 'translateY(20%)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
        else text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-out' });
      });
    });
  })();

  // Появление заголовков — как на instituteofhealth.com: строка поднимается из размытия с лёгким 3D-наклоном
  // (opacity 0, yPercent 50, rotateX 10°, blur 18px → чисто; 1.2s power3.out, шаг между строками 0.08s).
  // Делим на слова и группируем по строкам — отступ первой строки в заголовке цифр сохраняется
  (function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('main h2:not(.tag):not(.js-page-title), .wcard__title');
    function wrap(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { wrap(n); return; }
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/( +)/).forEach(function (part) {
          if (!part) return;
          if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span'); w.className = 'rw'; w.textContent = part; frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      });
    }
    Array.prototype.forEach.call(targets, function (el) { wrap(el); el.classList.add('rv-wait'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var words = e.target.querySelectorAll('.rw'), line = -1, top = null;
        Array.prototype.forEach.call(words, function (w) {
          var t = w.offsetTop;
          if (top === null || Math.abs(t - top) > 4) { line++; top = t; }
          w.animate([
            { opacity: 0, transform: 'translateY(50%) rotateX(10deg)', filter: 'blur(18px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' }
          ], { duration: 1200, delay: line * 80, easing: 'cubic-bezier(.215, .61, .355, 1)', fill: 'backwards' });
        });
        e.target.classList.remove('rv-wait');
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  })();

  // Панель концепта: акцент, зазор между плашками, базовая ширина для rem — сравнить варианты на месте
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function press(sel, test) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (b) { b.setAttribute("aria-pressed", test(b) ? "true" : "false"); });
  }
  var accents = document.querySelectorAll(".concept-bar [data-accent]");
  function setAccent(v) {
    root.style.setProperty("--accent", v);
    press(".concept-bar [data-accent]", function (b) { return b.dataset.accent === v; });
    store("kt-accent", v);
  }
  Array.prototype.forEach.call(accents, function (b) {
    b.style.background = b.dataset.accent;
    b.addEventListener("click", function () { setAccent(b.dataset.accent); });
  });
  setAccent(load("kt-accent") || accents[0].dataset.accent);

  function setOpt(name, v) {
    root.setAttribute("data-" + name, v);
    press(".concept-bar [data-set=\"" + name + "\"]", function (b) { return b.dataset.val === v; });
    store("kt-" + name, v);
    window.dispatchEvent(new Event("resize"));
  }
  Array.prototype.forEach.call(document.querySelectorAll(".concept-bar [data-set]"), function (b) {
    b.addEventListener("click", function () { setOpt(b.dataset.set, b.dataset.val); });
  });
  setOpt("gap", load("kt-gap") || "8");
  setOpt("base", load("kt-base") || "1440");
})();
