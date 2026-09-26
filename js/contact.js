/* =========================================================
   FrostGuard Snow & Ice — Contact page
   Theme + direction toggles, drawer nav, dropdown, sticky header,
   scroll reveal, counters, banner video + snowfall, contact form,
   map fade-in, FAQ accordion.
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

  /* ---------- Banner background video ----------
     The <video> has autoplay/muted/loop/playsinline and a list of <source> files in the HTML,
     so the browser picks and plays a file on its own. This script only adds the extras. */
  var video = document.getElementById('heroVideo');
  if (video) {
    video.muted = true;                          // some browsers only autoplay when muted is set as a property too
    var saveData = navigator.connection && navigator.connection.saveData;
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: the poster frame stays */ });
    };
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    // every <source> failed (wrong path / missing file) → hide the video so the blue gradient shows
    var sources = video.querySelectorAll('source');
    if (sources.length) {
      sources[sources.length - 1].addEventListener('error', function () { video.classList.add('is-failed'); });
    }
    if (reduceMotion || saveData) {
      video.removeAttribute('autoplay');
      video.pause();                             // still poster frame only
    } else {
      tryPlay();
      // pause while the banner is off screen or the tab is hidden (saves battery and CPU)
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) tryPlay(); else video.pause();
        }, { threshold: 0.1 }).observe(video);
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) video.pause(); else if (video.getBoundingClientRect().bottom > 0) tryPlay();
      });
    }
  }

  /* ---------- Hero snowfall ---------- */
  var canvas = document.getElementById('snowCanvas');
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var flakes = [], w = 0, h = 0, dpr = 1, running = true;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(110, w / 11));
      flakes = [];
      for (var i = 0; i < count; i++) {
        flakes.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2.4 + .6, s: Math.random() * .8 + .3, drift: Math.random() * .6 - .3, a: Math.random() * .6 + .3, phase: Math.random() * Math.PI * 2 });
      }
    }
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.phase += .01;
        f.y += f.s;
        f.x += f.drift + Math.sin(f.phase) * .3;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4; else if (f.x < -4) f.x = w + 4;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + f.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    // pause when the banner is off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(draw); }
        else if (!vis) running = false;
      }).observe(canvas);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Map: fade in once loaded (grid + bouncing pin show until then) ---------- */
  var mapFrame = document.getElementById('mapFrame');
  if (mapFrame) {
    var showMap = function () { mapFrame.classList.add('is-loaded'); };
    mapFrame.addEventListener('load', showMap);
    setTimeout(showMap, 6000);   // never leave the map hidden if the load event is missed
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  var msg = document.getElementById('contactMsg');
  if (form && msg) {
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var PHONE = /^[+()\-.\s\d]{7,}$/;
    function say(text, ok) {
      msg.textContent = text;
      msg.classList.toggle('is-success', ok);
      msg.classList.toggle('is-error', !ok);
    }
    function fail(el, text) { el.classList.add('is-invalid'); el.focus(); say(text, false); }
    form.addEventListener('input', function (e) { e.target.classList.remove('is-invalid'); });
    form.addEventListener('change', function (e) { e.target.classList.remove('is-invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
      if (!f.name.value.trim()) return fail(f.name, 'Please enter your name.');
      if (!EMAIL.test(f.email.value.trim())) return fail(f.email, 'Please enter a valid email address.');
      if (f.phone.value.trim() && !PHONE.test(f.phone.value.trim())) return fail(f.phone, 'Please check your phone number.');
      if (!f.service.value) return fail(f.service, 'Please choose a service.');
      if (f.message.value.trim().length < 10) return fail(f.message, 'Please tell us a little more (at least 10 characters).');
      say('Thanks, ' + f.name.value.trim().split(' ')[0] + '! Your message is on its way. We will reply within the hour.', true);
      form.reset();
    });
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