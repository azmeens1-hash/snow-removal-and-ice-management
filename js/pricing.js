/* =========================================================
   FrostGuard Snow & Ice — Pricing page scripts
   Theme + direction toggles, drawer nav, dropdown, sticky header,
   scroll reveal, plan switches, estimate calculator, FAQ accordion.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var DESKTOP = window.matchMedia('(min-width: 1024px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById('themeToggle');
  function syncTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save('fg-theme', next);
      syncTheme();
      themeBtn.classList.remove('is-spinning');
      void themeBtn.offsetWidth;            // restart the spin animation
      themeBtn.classList.add('is-spinning');
    });
    themeBtn.addEventListener('animationend', function () { themeBtn.classList.remove('is-spinning'); });
  }
  syncTheme();

  /* ---------- Direction (RTL / LTR) toggle ---------- */
  var dirBtn = document.getElementById('dirToggle');
  function syncDir() {
    var rtl = root.getAttribute('dir') === 'rtl';
    if (!dirBtn) return;
    var label = dirBtn.querySelector('.dir-toggle__label');
    if (label) label.textContent = rtl ? 'LTR' : 'RTL';
    dirBtn.setAttribute('aria-label', rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
  }
  if (dirBtn) {
    dirBtn.addEventListener('click', function () {
      var next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
      root.setAttribute('dir', next);
      save('fg-dir', next);
      syncDir();
    });
  }
  syncDir();

  /* ---------- Drawer nav (tablet + mobile) ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var navClose = document.getElementById('navClose');
  var overlay = document.getElementById('navOverlay');

  function openNav() {
    nav.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.classList.add('nav-open');
    burger.setAttribute('aria-expanded', 'true');
    if (navClose) navClose.focus();
  }
  function closeNav(returnFocus) {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
    if (returnFocus) burger.focus();
  }
  if (nav && burger && overlay) {
    burger.addEventListener('click', openNav);
    if (navClose) navClose.addEventListener('click', function () { closeNav(true); });
    overlay.addEventListener('click', function () { closeNav(true); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { closeNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeNav(true); closeDropdowns(); } });
    DESKTOP.addEventListener('change', function (e) { if (e.matches) closeNav(false); });
  }

  /* ---------- Home dropdown ---------- */
  var dropdowns = document.querySelectorAll('.has-dropdown');
  function closeDropdowns(except) {
    dropdowns.forEach(function (d) {
      if (d === except) return;
      d.classList.remove('is-open');
      var t = d.querySelector('.nav__link--toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  dropdowns.forEach(function (item) {
    var toggle = item.querySelector('.nav__link--toggle');
    function set(open) {
      item.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    }
    if (toggle) toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !item.classList.contains('is-open');
      closeDropdowns(item);
      set(open);
    });
    item.addEventListener('mouseenter', function () { if (DESKTOP.matches) set(true); });
    item.addEventListener('mouseleave', function () { if (DESKTOP.matches) set(false); });
  });
  document.addEventListener('click', function (e) {
    if (DESKTOP.matches && !e.target.closest('.has-dropdown')) closeDropdowns();
  });

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('header');
  function onScrollHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 10); }

  /* ---------- Counters ---------- */
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count) || 0;
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    function format(v) {
      var s = v.toFixed(decimals);
      if (!decimals && target >= 1000) s = Math.round(v).toLocaleString('en-US');
      return s + suffix;
    }
    if (reduceMotion) { el.textContent = format(target); return; }
    var duration = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Scroll reveal (+ counters inside revealed blocks) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // once the entrance has played, switch to snappy hover transitions
        var delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
        setTimeout(function () { el.classList.add('is-done'); }, (delay + 0.95) * 1000);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible', 'is-done'); });
    counters.forEach(runCounter);
  }

  /* ---------- Scroll (one rAF per frame) ---------- */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScrollHeader(); ticking = false; });
  }, { passive: true });
  onScrollHeader();

  /* ---------- Plans: Residential / Commercial switch ---------- */
  var state = { audience: 'res', billing: 'full' };   // prices are always shown as a single seasonal payment
  var switches = document.querySelectorAll('.switch[data-group]');
  function placePill(sw) {
    var btn = sw.querySelector('.switch__btn.is-active');
    if (!btn) return;
    // size + position the sliding pill under the active button (works in LTR and RTL)
    sw.style.setProperty('--pill-w', btn.offsetWidth + 'px');
    sw.style.setProperty('--pill-x', (btn.offsetLeft - 5) + 'px');
  }
  function renderPrices() {
    document.querySelectorAll('.plan__price').forEach(function (price) {
      var raw = price.getAttribute('data-' + state.audience + '-' + state.billing);
      if (!raw) return;
      var parts = raw.split('|');
      price.classList.add('is-changing');
      setTimeout(function () {
        price.querySelector('strong').textContent = parts[0];
        price.querySelector('span').textContent = parts[1];
        price.classList.remove('is-changing');
      }, reduceMotion ? 0 : 220);
    });
    document.querySelectorAll('.plan__note[data-note]').forEach(function (note) {
      note.classList.add('is-changing');
      setTimeout(function () {
        var p = note.closest('.plan').querySelector('.plan__price');
        var isCustom = (p.getAttribute('data-' + state.audience + '-' + state.billing) || '').indexOf('Custom') === 0;
        note.textContent = isCustom ? 'Priced after a free site survey' : note.getAttribute('data-note');
        note.classList.remove('is-changing');
      }, reduceMotion ? 0 : 220);
    });
  }
  switches.forEach(function (sw) {
    var group = sw.getAttribute('data-group');
    sw.querySelectorAll('.switch__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sw.querySelectorAll('.switch__btn').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        state[group] = btn.getAttribute('data-value');
        placePill(sw);
        renderPrices();
      });
    });
  });
  function syncPills() { switches.forEach(placePill); }
  syncPills();
  window.addEventListener('resize', syncPills);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncPills);
  if (dirBtn) dirBtn.addEventListener('click', function () { setTimeout(syncPills, 0); });

  /* ---------- Estimate calculator ---------- */
  var calc = document.getElementById('calc');
  if (calc) {
    var typeEl = document.getElementById('calcType');
    var stormsEl = document.getElementById('calcStorms');
    var stormsOut = document.getElementById('calcStormsOut');
    var walkEl = document.getElementById('calcWalk');
    var iceEl = document.getElementById('calcIce');
    var pushOut = document.getElementById('calcPush');
    var seasonOut = document.getElementById('calcSeason');
    var barPush = document.getElementById('barPush');
    var barSeason = document.getElementById('barSeason');
    var verdict = document.getElementById('calcVerdict');
    var rowPush = pushOut.closest('.result-row');
    var rowSeason = seasonOut.closest('.result-row');
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var shown = { push: 0, season: 0 };

    function animateTo(el, key, target) {
      if (reduceMotion) { el.textContent = money(target); shown[key] = target; return; }
      var from = shown[key], start = null;
      (function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 500, 1), v = from + (target - from) * (1 - Math.pow(1 - p, 3));
        el.textContent = money(v);
        if (p < 1) requestAnimationFrame(step); else shown[key] = target;
      })(performance.now());
    }

    function update() {
      var parts = typeEl.value.split('|');
      var perVisit = +parts[0], seasonal = +parts[1];
      var storms = +stormsEl.value;
      if (walkEl.checked) { perVisit += 15; seasonal += 120; }
      if (iceEl.checked) { perVisit += 20; }              // ice is already included in the seasonal plan
      var push = perVisit * storms;
      stormsOut.textContent = storms;
      var fill = ((storms - stormsEl.min) / (stormsEl.max - stormsEl.min)) * 100;
      stormsEl.style.setProperty('--fill', fill + '%');

      animateTo(pushOut, 'push', push);
      animateTo(seasonOut, 'season', seasonal);
      var max = Math.max(push, seasonal);
      barPush.style.width = (push / max * 100) + '%';
      barSeason.style.width = (seasonal / max * 100) + '%';

      var diff = Math.abs(push - seasonal);
      rowSeason.classList.toggle('is-winner', seasonal <= push);
      rowPush.classList.toggle('is-winner', push < seasonal);
      if (seasonal <= push) verdict.innerHTML = 'The Seasonal plan saves you about <b>' + money(diff) + '</b> this winter.';
      else verdict.innerHTML = 'In a mild winter like this, Per-Push saves about <b>' + money(diff) + '</b>.';
    }
    [typeEl, stormsEl, walkEl, iceEl].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update); });
    update();
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  var accs = document.querySelectorAll('.acc');
  accs.forEach(function (acc) {
    var head = acc.querySelector('.acc__head');
    head.addEventListener('click', function () {
      var open = !acc.classList.contains('is-open');
      accs.forEach(function (a) {
        a.classList.remove('is-open');
        a.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
      });
      if (open) { acc.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();