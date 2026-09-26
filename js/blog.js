/* =========================================================
   FrostGuard Snow & Ice — Blog page
   Theme + direction toggles, drawer nav, dropdown, sticky header,
   scroll reveal, category filter, newsletter form.
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


  /* ---------- Blog: category filter ---------- */
  var filters = document.querySelectorAll('.filter');
  var posts = document.querySelectorAll('.post');
  var empty = document.getElementById('postsEmpty');
  var filterTimer;
  function applyFilter(cat) {
    clearTimeout(filterTimer);
    var shown = 0;
    posts.forEach(function (p) {
      var match = cat === 'all' || p.dataset.cat === cat;
      if (match) shown++;
      p.classList.remove('is-showing');
      if (!match && !p.classList.contains('is-hidden')) p.classList.add('is-hiding');
    });
    filterTimer = setTimeout(function () {
      posts.forEach(function (p) {
        var match = cat === 'all' || p.dataset.cat === cat;
        p.classList.remove('is-hiding');
        if (match) {
          var wasHidden = p.classList.contains('is-hidden');
          p.classList.remove('is-hidden');
          // make sure filtered-in cards are visible even if they never scrolled into view
          p.classList.add('is-visible', 'is-done');
          if (wasHidden || !reduceMotion) { void p.offsetWidth; p.classList.add('is-showing'); }
        } else {
          p.classList.add('is-hidden');
        }
      });
      if (empty) empty.hidden = shown > 0;
    }, reduceMotion ? 0 : 300);
  }
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-active')) return;
      filters.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      applyFilter(btn.dataset.filter);
    });
  });
  posts.forEach(function (p) { p.addEventListener('animationend', function () { p.classList.remove('is-showing'); }); });

  /* ---------- Blog: newsletter form ---------- */
  var form = document.getElementById('newsForm');
  var msg = document.getElementById('newsMsg');
  if (form && msg) {
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function say(text, ok) {
      msg.textContent = text;
      msg.classList.toggle('is-success', ok);
      msg.classList.toggle('is-error', !ok);
    }
    form.addEventListener('input', function (e) { e.target.classList.remove('is-invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email;
      name.classList.remove('is-invalid'); email.classList.remove('is-invalid');
      if (!name.value.trim()) { name.classList.add('is-invalid'); name.focus(); say('Please enter your name.', false); return; }
      if (!EMAIL.test(email.value.trim())) { email.classList.add('is-invalid'); email.focus(); say('Please enter a valid email address.', false); return; }
      say('Thanks, ' + name.value.trim().split(' ')[0] + '! You’re subscribed to FrostGuard winter tips.', true);
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();