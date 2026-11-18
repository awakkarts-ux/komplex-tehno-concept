/* «Объекты»: фильтр по категориям услуг. Карточка с data-service="ustanovka" видна во вкладке «Установка» и в «Все услуги»;
   карточки-заглушки (data-service="") — только во «Все услуги». Если в категории пусто — плашка. Вкладку можно открыть по #ustanovka. */
(function () {
  'use strict';
  var bar = document.querySelector('[data-ftabs]');
  if (!bar) return;
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-grid] [data-service]'));
  var empty = document.querySelector('[data-empty]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reveal(btn, smooth) {
    // прокручиваем только саму ленту вкладок, не страницу
    var left = btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }

  function apply(key, smooth) {
    var shown = 0;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-filter') === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) reveal(t, smooth);
    });
    cards.forEach(function (c) {
      var ok = key === 'all' || (c.getAttribute('data-service') || '').split(' ').indexOf(key) > -1;
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var key = t.getAttribute('data-filter');
      apply(key, true);
      try { history.replaceState(null, '', key === 'all' ? location.pathname + location.search : '#' + key); } catch (e) {}
    });
  });

  var h = (location.hash || '').replace('#', '');
  var known = tabs.some(function (t) { return t.getAttribute('data-filter') === h; });
  apply(known ? h : 'all', false);
})();
