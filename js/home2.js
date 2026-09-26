/* =========================================================
   FrostGuard Snow & Ice — home2.js (Home 2 · commercial focus)
   Theme + RTL toggles · sticky header · drawer nav · dropdown
   hero snowfall · scroll reveal · counters · fleet cards
   storm timeline progress · portal chart · quote form
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopMQ = window.matchMedia('(min-width: 1024px)')   /* matches the CSS desktop breakpoint */;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var isRTL = function () { return root.getAttribute('dir') === 'rtl'; };
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------- Hero snowfall (declared first so the theme toggle can refresh it) ---------- */
  var Snow = (function () {
    var canvas = $('#snowCanvas'), hero = $('#hero');
    if (!canvas || !hero) return { refresh: function () {} };
    var ctx = canvas.getContext('2d'), flakes = [], w, h, running = false, raf, rgb = '99,160,214', wind = 0, target = 0;
    function readColor() { rgb = (getComputedStyle(root).getPropertyValue('--snow-rgb') || rgb).trim().replace(/\s+/g, ''); }
    function flake(randomY) {
      var r = Math.random() * 2.6 + 0.8;
      return { x: Math.random() * w, y: randomY ? Math.random() * h : -10, r: r, vy: r * 0.32 + 0.25, sway: Math.random() * 0.8 + 0.2, ph: Math.random() * 6.28, o: Math.random() * 0.4 + 0.3 };
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth; h = hero.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = []; for (var i = 0, n = Math.round(Math.min(130, w / 11)); i < n; i++) flakes.push(flake(true));
      if (!running) draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      wind += (target - wind) * 0.02;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        if (running) {
          f.y += f.vy; f.x += Math.sin(t / 1600 + f.ph) * f.sway * 0.4 + wind * f.r * 0.4;
          if (f.y > h + 5) { flakes[i] = flake(false); continue; }
          if (f.x > w + 5) f.x = -5; else if (f.x < -5) f.x = w + 5;
        }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fillStyle = 'rgba(' + rgb + ',' + f.o + ')'; ctx.fill();
      }
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    readColor(); resize();
    window.addEventListener('resize', debounce(resize, 200));
    hero.addEventListener('mousemove', function (e) { target = (e.clientX / window.innerWidth - 0.5) * 1.6; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    else start();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    return { refresh: function () { readColor(); if (!running) draw(0); } };
  })();

  /* ---------- Theme toggle ---------- */
  var themeBtn = $('#themeToggle');
  function syncTheme() { themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  if (themeBtn) {
    syncTheme();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('fg-theme', next);
      syncTheme();
      themeBtn.classList.remove('is-spinning'); void themeBtn.offsetWidth; themeBtn.classList.add('is-spinning');
      Snow.refresh();
    });
  }

  /* ---------- RTL / LTR toggle ---------- */
  var dirBtn = $('#dirToggle');
  function syncDir() {
    $('.dir-toggle__label', dirBtn).textContent = isRTL() ? 'LTR' : 'RTL';
    dirBtn.setAttribute('aria-label', isRTL() ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
  }
  if (dirBtn) {
    syncDir();
    dirBtn.addEventListener('click', function () {
      var next = isRTL() ? 'ltr' : 'rtl';
      root.setAttribute('dir', next);
      store('fg-dir', next);
      syncDir();
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = $('#header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Drawer nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), navClose = $('#navClose'), overlay = $('#navOverlay');
  function openNav() {
    nav.classList.add('is-open'); overlay.classList.add('is-visible'); document.body.classList.add('nav-open');
    burger.setAttribute('aria-expanded', 'true');
    setTimeout(function () { navClose.focus(); }, 300);
  }
  function closeNav() {
    nav.classList.remove('is-open'); overlay.classList.remove('is-visible'); document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', openNav);
  navClose.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);
  desktopMQ.addEventListener('change', function (e) { if (e.matches) closeNav(); });

  /* ---------- Home dropdown ---------- */
  $$('.has-dropdown').forEach(function (item) {
    var btn = $('.nav__link--toggle', item), timer;
    function setOpen(open) { item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!item.classList.contains('is-open')); });
    item.addEventListener('mouseenter', function () { if (desktopMQ.matches) { clearTimeout(timer); setOpen(true); } });
    item.addEventListener('mouseleave', function () { if (desktopMQ.matches) timer = setTimeout(function () { setOpen(false); }, 160); });
    document.addEventListener('click', function (e) { if (desktopMQ.matches && !item.contains(e.target)) setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('is-open')) { closeNav(); burger.focus(); }
    $$('.has-dropdown.is-open').forEach(function (i) { i.classList.remove('is-open'); $('.nav__link--toggle', i).setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('.reveal');
  function markDone(el) {
    var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(function () { el.classList.add('is-done'); }, 1000 + d * 1000);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible'); markDone(en.target); io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible', 'is-done'); });
  }

  /* ---------- Counters ---------- */
  function runCounter(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10), suf = el.dataset.suffix || '';
    var fmt = function (n) { return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var start = null;
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1800, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else counters.forEach(runCounter);

  /* ---------- Storm timeline: progress line follows the scroll ---------- */
  var timeline = $('#timelineList');
  if (timeline) {
    var tlTick = false;
    function tlUpdate() {
      var r = timeline.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      timeline.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
      tlTick = false;
    }
    if (reduceMotion) timeline.style.setProperty('--progress', '1');
    else {
      window.addEventListener('scroll', function () { if (!tlTick) { tlTick = true; requestAnimationFrame(tlUpdate); } }, { passive: true });
      window.addEventListener('resize', debounce(tlUpdate, 150));
      tlUpdate();
    }
  }

  /* ---------- Portal chart: grow bars when visible ---------- */
  ['#dashMock'].forEach(function (sel) {
    var el = $(sel);
    if (!el) return;
    if ('IntersectionObserver' in window && !reduceMotion) {
      var lio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { el.classList.add('is-live'); lio.disconnect(); }
      }, { threshold: 0.35 });
      lio.observe(el);
    } else el.classList.add('is-live');
  });

  /* ---------- Quote form (front-end validation + confirmation) ---------- */
  var form = $('#quoteForm'), msg = $('#quoteMsg');
  if (form) {
    var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
    $$('input, select', form).forEach(function (f) {
      f.addEventListener('input', function () { f.closest('.field').classList.remove('is-invalid'); });
      f.addEventListener('change', function () { f.closest('.field').classList.remove('is-invalid'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('input, select', form).forEach(function (f) {
        var v = f.value.trim(), invalid = !v || (f.type === 'email' && !emailOk(v));
        f.closest('.field').classList.toggle('is-invalid', invalid);
        if (invalid && !bad) bad = f;
      });
      if (bad) {
        msg.textContent = 'Please fill in every field with valid details.';
        msg.classList.add('is-error');
        bad.focus();
        return;
      }
      msg.classList.remove('is-error');
      msg.textContent = 'Thanks! Your request has been received. We’ll email your site quote within 24 hours.';
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();