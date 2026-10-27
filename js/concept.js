// Концепт главной учёттепла.рф — v4. Без библиотек и сценических анимаций: аккордеоны, карусель работ, попап, панель акцента.
(function () {
  // Аккордеоны: услуги (открыт один) и FAQ (можно несколько)
  function toggle(item, open) {
    var head = item.querySelector('[aria-expanded]');
    var body = document.getElementById(head.getAttribute('aria-controls'));
    item.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', open);
    body.inert = !open;
  }
  document.querySelectorAll('.svc').forEach(function (item) {
    item.querySelector('.svc__head').addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.parentNode.querySelectorAll('.svc.is-open').forEach(function (o) { if (o !== item) toggle(o, false); });
      toggle(item, open);
    });
  });
  document.querySelectorAll('.faq__item').forEach(function (item) {
    item.querySelector('.faq__button').addEventListener('click', function () {
      toggle(item, !item.classList.contains('is-open'));
    });
  });

  // «Наш подход» — карусель как на учетстоках: стрелки листают на одну карточку, крайняя стрелка серая
  var apTrack = document.querySelector('[data-ap-track]');
  if (apTrack) {
    var apBtns = document.querySelectorAll('[data-ap]');
    var apSync = function () {
      apBtns[0].disabled = apTrack.scrollLeft <= 2;
      apBtns[1].disabled = apTrack.scrollLeft >= apTrack.scrollWidth - apTrack.clientWidth - 2;
    };
    apBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var step = apTrack.firstElementChild.offsetWidth + parseFloat(getComputedStyle(apTrack).columnGap);
        apTrack.scrollBy({ left: step * +b.dataset.ap, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    apTrack.addEventListener('scroll', apSync, { passive: true });
    addEventListener('resize', apSync);
    apSync();
  }

  // Этапы — перенос из v3 (24ist.ru «Наш принцип»): сцена закреплена, прокрутка вниз двигает ленту влево.
  // Высота дорожки = высота сцены + путь прокрутки + 20vh задержки. Плавность — догонялка (у них пружина).
  // 12.10 (аудит, п.7 вариант A): путь прокрутки не длиннее 1,8 экрана — лента едет быстрее колеса, было 1:1 (3,8 экрана)
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?shot — страница на холсте целиком (iframe во всю высоту): без закреплённой ленты, всё видно сразу
  var isShot = /[?&]shot/.test(location.search);
  if (isShot) document.documentElement.classList.add('is-shot');
  var hs = document.querySelector('[data-hs]');
  if (hs && !isShot) {
    var hsSec = hs.closest('.hs');
    var hsStage = hs.querySelector('.hs-stage');
    var hsWrap = hs.querySelector('.hs-wrap');
    var hsDist = 0, hsLen = 0, hsCur = 0, hsTarget = 0, hsRun = false;
    var hsMeasure = function () {
      // ширина по раскладке, а не scrollWidth: сдвиг ленты для появления раздувает scrollWidth
      var pad = parseFloat(getComputedStyle(hsStage).paddingLeft) * 2;
      var list = hsWrap.lastElementChild;
      hsDist = Math.max(0, list.offsetLeft + list.offsetWidth - (hsStage.clientWidth - pad));
      hsLen = Math.min(hsDist, innerHeight * 1.8);
      hs.style.height = (hsStage.offsetHeight + hsLen + innerHeight * 0.2) + 'px';
    };
    var hsRead = function () {
      var top = parseFloat(getComputedStyle(hsStage).top) || 0;
      var scrolled = top - hs.getBoundingClientRect().top;
      hsTarget = hsLen ? Math.max(0, Math.min(1, scrolled / hsLen)) : 0;
    };
    var hsTick = function () {
      hsCur += (hsTarget - hsCur) * (reduce ? 1 : 0.1);
      if (Math.abs(hsTarget - hsCur) < 0.0002) hsCur = hsTarget;
      hsWrap.style.transform = 'translate3d(' + (-hsCur * hsDist).toFixed(1) + 'px,0,0)';
      hsRun = hsCur !== hsTarget;
      if (hsRun) requestAnimationFrame(hsTick);
    };
    var hsKick = function () { hsRead(); if (!hsRun) { hsRun = true; requestAnimationFrame(hsTick); } };
    hsMeasure(); hsRead(); hsCur = hsTarget; hsTick();
    addEventListener('scroll', hsKick, { passive: true });
    addEventListener('resize', function () { hsMeasure(); hsKick(); });
    if (document.fonts) document.fonts.ready.then(function () { hsMeasure(); hsKick(); });
    // лента въезжает при появлении секции
    new IntersectionObserver(function (e, o) {
      if (e[0].isIntersecting) { hsSec.classList.add('is-revealed'); o.disconnect(); }
    }, { threshold: 0.15 }).observe(hsSec);
  }

  // Выпадающее меню шапки — 13.10, по референсу дизайнера (unlumen-ui «Motion Navigation Menu»). Одна панель на все пункты:
  // её ширина, высота и положение едут к новому пункту на пружине (stiffness 350, damping 32, как у них); содержимое при
  // переходе между пунктами уезжает в сторону движения. Открытие — наведением или нажатием, закрытие — уход курсора, Esc, Tab наружу
  var mv = document.querySelector('.mnav__viewport');
  if (mv) {
    var mHead = mv.parentElement, mTr = [].slice.call(document.querySelectorAll('.mnav__trigger')), mP = {};
    mv.querySelectorAll('.mnav__panel').forEach(function (p) { mP[p.dataset.panel] = p; p.inert = true; });
    var mCur = null, mIdx = -1, mClose = 0, ms = null, mt = null, mvv = [0, 0, 0], mRun = false, mLast = 0;
    var mHover = matchMedia('(hover: hover)');
    var mPaint = function () { mv.style.left = ms[0].toFixed(1) + 'px'; mv.style.width = ms[1].toFixed(1) + 'px'; mv.style.height = ms[2].toFixed(1) + 'px'; };
    var mStep = function (t) {
      var dt = Math.min(0.05, (t - mLast) / 1000 || 0.016); mLast = t;
      for (var i = 0, n = Math.ceil(dt / 0.004), hh = dt / n; i < n; i++)
        for (var k = 0; k < 3; k++) { mvv[k] += (-350 * (ms[k] - mt[k]) - 32 * mvv[k]) * hh; ms[k] += mvv[k] * hh; }
      var done = true;
      for (k = 0; k < 3; k++) if (Math.abs(ms[k] - mt[k]) > 0.1 || Math.abs(mvv[k]) > 1) done = false;
      if (done) { ms = mt.slice(); mvv = [0, 0, 0]; }
      mPaint(); mRun = !done; if (mRun) requestAnimationFrame(mStep);
    };
    var mTarget = function (name, tr) {
      var p = mP[name], hr = mHead.getBoundingClientRect(), r = tr.getBoundingClientRect();
      var w = p.offsetWidth, x = r.left - hr.left - parseFloat(getComputedStyle(document.documentElement).fontSize);
      return [Math.max(0, Math.min(x, hr.width - w)), w, p.offsetHeight];
    };
    var mShow = function (p, from) {   // from: -1 — въезжает слева, 1 — справа, 0 — без сдвига
      p.style.transition = 'none'; p.style.transform = from ? 'translateX(' + from * 3 + 'rem)' : ''; void p.offsetWidth;
      p.style.transition = ''; p.style.transform = ''; p.classList.add('is-active'); p.inert = false;
    };
    var mHide = function (p, to) { p.classList.remove('is-active'); p.inert = true; p.style.transform = to ? 'translateX(' + to * 3 + 'rem)' : ''; };
    var mOpen = function (name, tr) {
      clearTimeout(mClose);
      if (mCur === name) return;
      var idx = mTr.indexOf(tr), target = mTarget(name, tr);
      if (!mCur) { ms = target.slice(); mt = target; mvv = [0, 0, 0]; mPaint(); mShow(mP[name], 0); mv.classList.add('is-open'); }
      else {
        var dir = idx > mIdx ? 1 : -1;
        mHide(mP[mCur], -dir); mShow(mP[name], dir);
        mt = target;
        if (reduce) { ms = mt.slice(); mPaint(); } else if (!mRun) { mRun = true; mLast = performance.now(); requestAnimationFrame(mStep); }
      }
      mTr.forEach(function (b) { b.setAttribute('aria-expanded', b === tr); });
      mCur = name; mIdx = idx;
    };
    var mShut = function () {
      if (!mCur) return;
      mv.classList.remove('is-open'); mHide(mP[mCur], 0);
      mTr.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      mCur = null; mIdx = -1;
    };
    var mLater = function () { clearTimeout(mClose); mClose = setTimeout(mShut, 150); };
    mTr.forEach(function (b) {
      b.addEventListener('mouseenter', function () { if (mHover.matches) mOpen(b.dataset.mnav, b); });
      b.addEventListener('mouseleave', mLater);
      b.addEventListener('click', function () { if (mCur === b.dataset.mnav && !mHover.matches) mShut(); else mOpen(b.dataset.mnav, b); });
    });
    mv.addEventListener('mouseenter', function () { clearTimeout(mClose); });
    mv.addEventListener('mouseleave', mLater);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mCur) { var tr = mTr[mIdx]; mShut(); tr.focus(); } });
    mHead.addEventListener('focusout', function () { setTimeout(function () { if (!mHead.contains(document.activeElement)) mShut(); }); });
    document.addEventListener('click', function (e) { if (mCur && !mHead.contains(e.target)) mShut(); });
  }

  // «Этапы» — 13.10, 1:1 как KCCI: лента листается стрелками на один шаг, крайняя стрелка гаснет
  var stg = document.querySelector('[data-stg-track]');
  if (stg) {
    var stgBtns = document.querySelectorAll('[data-stg]');
    var stgSync = function () {
      stgBtns[0].disabled = stg.scrollLeft <= 2;
      stgBtns[1].disabled = stg.scrollLeft >= stg.scrollWidth - stg.clientWidth - 2;
    };
    stgBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var from = stg.scrollLeft, dx = stg.querySelector('.stg__step').offsetWidth * +b.dataset.stg;
        stg.scrollBy({ left: dx, behavior: reduce ? 'auto' : 'smooth' });
        // подстраховка: если браузер не анимирует прокрутку (фоновая вкладка) — сразу на шаг
        setTimeout(function () { if (stg.scrollLeft === from) { stg.style.scrollBehavior = 'auto'; stg.scrollLeft = from + dx; stg.style.scrollBehavior = ''; stgSync(); } }, 500);
      });
    });
    stg.addEventListener('scroll', stgSync, { passive: true });
    addEventListener('resize', stgSync);
    stgSync();
  }

  // Оглавление страницы услуги: подсвечиваем раздел, который сейчас на экране
  var tocLinks = document.querySelectorAll('[data-toc]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var tocMap = {};
    tocLinks.forEach(function (a) { tocMap[a.dataset.toc] = a; });
    var tocIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.toggle('is-active', a === tocMap[e.target.id]); });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(tocMap).forEach(function (id) { var s = document.getElementById(id); if (s) tocIo.observe(s); });
  }

  // Попап без формы. 12.10 (аудит, п.4 вариант A): у кнопки с data-modal-lead заголовок окна = надпись кнопки,
  // подводка — из атрибута (черновик, согласовать с клиентом). Пока окно открыто, страница под ним inert, Tab ходит по кругу
  var modal = document.getElementById('consult');
  var mTitle = modal.querySelector('#consult-title');
  var mLead = modal.querySelector('.modal__panel > p');
  var mDefault = { title: mTitle.textContent, lead: mLead.innerHTML };
  var last = null;
  function onKey(e) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    var f = modal.querySelectorAll('a[href], button:not([disabled])');
    var first = f[0], end = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
    else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
  }
  function setInert(on) {
    [].forEach.call(document.body.children, function (el) { if (el !== modal && el.tagName !== 'SCRIPT') el.inert = on; });
  }
  function open(e) {
    var b = e.currentTarget;
    last = b;
    var lead = b.dataset.modalLead;
    mTitle.textContent = lead ? b.textContent.trim() : mDefault.title;
    mLead.innerHTML = lead ? lead + ' <b>Просто позвоните или напишите:</b>' : mDefault.lead;
    modal.hidden = false;
    setInert(true);
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close').focus();
    document.addEventListener('keydown', onKey);
  }
  function close() {
    modal.hidden = true;
    setInert(false);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (last) last.focus();
  }
  document.querySelectorAll('[data-modal]').forEach(function (b) { b.addEventListener('click', open); });

  // Перетекающая подсветка пунктов — 13.10, по референсу дизайнера (unlumen-ui «Highlight», mode parent + hover): одна плашка
  // под группой пунктов едет к пункту под курсором — пружина stiffness 1250, damping 40, mass 0.5, как у них; при уходе
  // из группы гаснет через 0,2 с. Меню шапки, выпадающие списки, оглавление услуг. Без мыши — выключено
  if (!isShot && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var HK = 1250, HC = 40, HM = 0.5;
    var highlight = function (box, items, padX, padY) {
      box.classList.add('hl-wrap');
      var pl = document.createElement('span'); pl.className = 'hl'; pl.setAttribute('aria-hidden', 'true'); box.insertBefore(pl, box.firstChild);
      var cur = null, tgt = null, vel = [0, 0, 0, 0], shown = false, hideT = 0, last = 0, run = false;
      var paint = function () { pl.style.transform = 'translate3d(' + cur[0].toFixed(2) + 'px,' + cur[1].toFixed(2) + 'px,0)'; pl.style.width = cur[2].toFixed(2) + 'px'; pl.style.height = cur[3].toFixed(2) + 'px'; };
      var step = function (t) {
        var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
        for (var i = 0, n = Math.ceil(dt / 0.002), h = dt / n; i < n; i++)
          for (var k = 0; k < 4; k++) { vel[k] += (-HK * (cur[k] - tgt[k]) - HC * vel[k]) / HM * h; cur[k] += vel[k] * h; }
        var done = true;
        for (k = 0; k < 4; k++) if (Math.abs(cur[k] - tgt[k]) > 0.05 || Math.abs(vel[k]) > 0.5) done = false;
        if (done) { cur = tgt.slice(); vel = [0, 0, 0, 0]; }
        paint(); run = !done;
        if (run) requestAnimationFrame(step);
      };
      box.querySelectorAll(items).forEach(function (it) {
        it.addEventListener('mouseenter', function () {
          clearTimeout(hideT);
          var b = box.getBoundingClientRect(), r = it.getBoundingClientRect(), px = padX(), py = padY();
          tgt = [r.left - b.left - px, r.top - b.top - py, r.width + px * 2, r.height + py * 2];
          if (!shown || reduce) { cur = tgt.slice(); vel = [0, 0, 0, 0]; paint(); shown = true; pl.classList.add('is-on'); return; }   // первое появление — на месте, проявлением
          if (!run) { run = true; last = performance.now(); requestAnimationFrame(step); }
        });
      });
      box.addEventListener('mouseleave', function () { hideT = setTimeout(function () { pl.classList.remove('is-on'); shown = false; }, 200); });
    };
    var rem = function (v) { return function () { return parseFloat(getComputedStyle(document.documentElement).fontSize) * v; }; };
    var nav = document.querySelector('.nav');
    if (nav) highlight(nav, ':scope > a, :scope > .mnav__trigger', rem(.875), rem(0));   // у пунктов свои поля .5rem
    document.querySelectorAll('.mnav__panel').forEach(function (m) { highlight(m, 'a.mnav__feature, a.mnav__link, a.mnav__also, .dir-link', rem(0), rem(0)); });
    // оглавление страниц услуг — как боковое меню unlumen-ui: шкала рисок слева, плашка под пунктом с курсором
    document.querySelectorAll('.sp-toc__list').forEach(function (l) { highlight(l, ':scope > li > a', rem(0), rem(0)); });
  }

  // Мерцающий скелет — 13.10, по референсу дизайнера (unlumen-ui «Shimmer Skeleton»): если фото грузится дольше 0,3 с,
  // его рамка становится серой плашкой с бликом (1,6 с, ease-in-out); после загрузки фото проявляется. Быстрые — без мигания
  document.querySelectorAll('main img').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    var box = img.parentElement;
    var t = setTimeout(function () { box.classList.add('sk'); img.classList.add('sk-img'); }, 300);
    var done = function () { clearTimeout(t); box.classList.remove('sk'); setTimeout(function () { img.classList.remove('sk-img'); }, 20); };
    img.addEventListener('load', done); img.addEventListener('error', done);
  });

  // Переход между страницами — 15.10, как на olympic.no (у них View Transitions + Barba, параметры — из их CSS):
  // уход — страница уезжает вверх на 12vh, сверху проявляется чёрная панель; приход — страница с +10vh встаёт на место,
  // чёрная панель уходит вверх шторкой (новая страница раскрывается снизу), 1.2s ease_dive; шапка всё время на месте.
  // Заголовок выезжает по словам, подводка и фото проявляются — пока шторка открывает первый экран
  (function () {
    var html = document.documentElement;
    var veil = document.querySelector('.page-veil');
    var page = document.querySelector('main.page');
    if (!veil || !page || isShot) return;
    var DIVE = 'cubic-bezier(.85, 0, .15, 1)', EIO = 'cubic-bezier(.42, 0, .58, 1)';
    var anim = function (el, kf, opt) { return el.animate(kf, Object.assign({ fill: 'forwards' }, opt)).finished; };
    // Заголовок по словам: слово в маске (.w), внутри выезжает снизу. Делим по обычным пробелам — неразрывные склеивают предлог со словом
    var split = function (el) {
      [].slice.call(el.childNodes).forEach(function (n) {
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
    };
    var enterContent = function () {
      var title = document.querySelector('main h1');
      if (title) { title.classList.add('js-page-title'); [].forEach.call(split(title), function (w, i) {
        w.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1000, easing: EIO, delay: 550 + 80 * i, fill: 'both' });
      }); }
      [].forEach.call(document.querySelectorAll('.hero-a__lead, .intro__row, .intro + .plate, main h1 ~ p'), function (d) {
        d.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1000, easing: EIO, delay: 750, fill: 'both' });
      });
      var img = document.querySelector('.hero-a__photo');
      if (img) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: EIO, delay: 500, fill: 'both' });
    };
    // Приход на страницу
    if (html.classList.contains('is-page-in')) {
      enterContent();
      page.animate([{ transform: 'translateY(10vh)' }, { transform: 'none' }], { duration: 1200, easing: DIVE, delay: 100, fill: 'both' });
      anim(veil, [{ opacity: 1, clipPath: 'inset(0 0 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 100% 0)' }], { duration: 1200, easing: DIVE, delay: 100 })
        .then(function () {
          html.classList.remove('is-page-in');
          veil.getAnimations().forEach(function (a) { a.cancel(); });
          page.getAnimations().forEach(function (a) { a.cancel(); });
        });
    }
    // Уход: любая ссылка на другую страницу сайта; якоря, телефон, почта, внешние сайты — без перехода
    var go = function (href) {
      if (html.classList.contains('is-page-out')) return;
      html.classList.add('is-page-out');
      try { sessionStorage.setItem('kt-page-veil', '1'); } catch (e) {}
      page.animate([{ transform: 'none' }, { transform: 'translateY(-12vh)' }], { duration: 700, easing: DIVE, delay: 60, fill: 'forwards' });
      anim(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: DIVE, delay: 60 })
        .then(function () { location.href = href; });
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || reduce) return;
      var url; try { url = new URL(a.href); } catch (er) { return; }   // a.href — уже полный адрес
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      go(url.href);
    });
    // Возврат кнопкой «Назад» из кэша браузера — страница не должна остаться под панелью
    addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      html.classList.remove('is-page-out', 'is-page-in');
      veil.getAnimations().forEach(function (a) { a.cancel(); });
      page.getAnimations().forEach(function (a) { a.cancel(); });
    });
  })();

  // 15.10 — прелоадер, как у образца polihim: знак по центру, линейка-шкала и проценты; ~1.4 с, затем гаснет
  (function () {
    var html = document.documentElement;
    if (!html.classList.contains('is-preload')) return;
    var p = document.createElement('div'); p.className = 'preloader'; p.setAttribute('aria-hidden', 'true');
    var mark = document.querySelector('.logo__mark'); if (mark) p.appendChild(mark.cloneNode(true));
    p.insertAdjacentHTML('beforeend', '<div class="preloader__ruler"><i class="preloader__fill"></i></div><span class="preloader__n">00</span>');
    document.body.appendChild(p);
    var fill = p.querySelector('.preloader__fill'), n = p.querySelector('.preloader__n'), ruler = p.querySelector('.preloader__ruler');
    var t0 = performance.now(), D = 1400, done = false;
    var finish = function () { if (done) return; done = true; html.classList.remove('is-preload'); p.classList.add('is-done'); setTimeout(function () { p.remove(); }, 600); };
    var step = function (t) {
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      fill.style.width = (e * 100) + '%'; n.textContent = String(Math.round(e * 100)).padStart(2, '0');
      n.style.left = (ruler.offsetLeft + ruler.offsetWidth * e) + 'px';
      if (k < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
    setTimeout(finish, 2500);   // страховка: вкладка в фоне — rAF не идёт
  })();

  // Панель концепта: акцент тепла
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('kt-accent'); } catch (e) {}
  var sw = document.querySelectorAll('[data-accent]');
  function setAccent(c) {
    root.style.setProperty('--accent', c);
    sw.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.accent === c); });
    try { localStorage.setItem('kt-accent', c); } catch (e) {}
  }
  sw.forEach(function (b) { b.addEventListener('click', function () { setAccent(b.dataset.accent); }); });
  if (sw.length) setAccent(saved && [].some.call(sw, function (b) { return b.dataset.accent === saved; }) ? saved : sw[0].dataset.accent);   // панели нет — акцент из CSS
})();
