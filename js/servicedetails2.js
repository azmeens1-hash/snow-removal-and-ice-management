/* =========================================================
   FrostGuard Snow & Ice — Service details 2 (Commercial Plowing)
   Theme + direction toggles, drawer nav, dropdown, sticky header,
   scroll reveal, counters, step line, response bars, FAQ accordion.
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

  /* ---------- "How it works" connector line draws in when the steps appear ---------- */
  var stepsList = document.querySelector('.steps__list');
  if (stepsList) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { stepsList.classList.add('is-drawn'); obs.disconnect(); }
      }, { threshold: 0.4 }).observe(stepsList);
    } else {
      stepsList.classList.add('is-drawn');
    }
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