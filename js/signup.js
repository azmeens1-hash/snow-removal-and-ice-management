/* =========================================================
   FrostGuard Snow & Ice — signup.js
   Theme + RTL toggles · snowfall · show/hide password
   password strength · validation · demo sign-up + social sign-up
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var isRTL = function () { return root.getAttribute('dir') === 'rtl'; };
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- Theme + RTL (same keys as the website) ---------- */
  var themeBtn = $('#themeToggle'), dirBtn = $('#dirToggle');
  function syncTheme() { themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  function syncDir() { $('.dir-toggle__label', dirBtn).textContent = isRTL() ? 'LTR' : 'RTL'; dirBtn.setAttribute('aria-label', isRTL() ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout'); }
  syncTheme(); syncDir();
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('fg-theme', next); syncTheme();
    themeBtn.classList.remove('is-spinning'); void themeBtn.offsetWidth; themeBtn.classList.add('is-spinning');
  });
  dirBtn.addEventListener('click', function () { var next = isRTL() ? 'ltr' : 'rtl'; root.setAttribute('dir', next); store('fg-dir', next); syncDir(); });

  /* ---------- Snowfall on the brand panel ---------- */
  (function () {
    var canvas = $('#snowCanvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d'), flakes = [], w, h, raf, running = false;
    function flake(y) { var r = Math.random() * 2.4 + .8; return { x: Math.random() * w, y: y ? Math.random() * h : -8, r: r, vy: r * .35 + .3, ph: Math.random() * 6.3, o: Math.random() * .5 + .3 }; }
    function size() {
      var box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width; h = box.height; if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = []; for (var i = 0, n = Math.round(Math.min(120, w / 8)); i < n; i++) flakes.push(flake(true));
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f, i) {
        if (running) { f.y += f.vy; f.x += Math.sin(t / 1500 + f.ph) * .4; if (f.y > h + 5) flakes[i] = flake(false); }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,' + f.o + ')'; ctx.fill();
      });
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    size();
    window.addEventListener('resize', function () { clearTimeout(size.t); size.t = setTimeout(size, 200); });
    if (!reduceMotion) { running = true; raf = requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!reduceMotion) { running = true; raf = requestAnimationFrame(loop); } });
  })();

  /* ---------- Show / hide password ---------- */
  var pw = $('#password'), eye = $('#togglePw');
  eye.addEventListener('click', function () {
    var show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    pw.focus();
  });

  /* ---------- Password strength ---------- */
  var meter = $('#strength');
  function score(v) { var n = 0; if (v.length >= 8) n++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) n++; if (/\d/.test(v)) n++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) n++; return v ? Math.max(1, n) : 0; }
  pw.addEventListener('input', function () { meter.dataset.level = score(pw.value); });

  /* ---------- Validation ---------- */
  var form = $('#signupForm'), name = $('#name'), email = $('#email'), msg = $('#formMsg'), btn = $('#signupBtn');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setState(input, errEl, text) {
    var field = input.closest('.field');
    field.classList.remove('is-invalid'); void field.offsetWidth;
    field.classList.toggle('is-invalid', !!text);
    field.classList.toggle('is-valid', !text && input.value.trim() !== '');
    input.setAttribute('aria-invalid', String(!!text));
    errEl.textContent = text || '';
  }
  function checkName() { var v = name.value.trim(); var t = !v ? 'Please enter your name.' : v.length < 2 ? 'Please enter your full name.' : ''; setState(name, $('#nameError'), t); return !t; }
  function checkEmail() { var v = email.value.trim(); var t = !v ? 'Please enter your email address.' : !EMAIL_RE.test(v) ? 'That email doesn’t look right. Check for typos.' : ''; setState(email, $('#emailError'), t); return !t; }
  function checkPw() { var v = pw.value; var t = !v ? 'Please create a password.' : v.length < 8 ? 'Use at least 8 characters.' : !/\d/.test(v) || !/[A-Z]/.test(v) ? 'Add at least one number and one capital letter.' : ''; setState(pw, $('#pwError'), t); return !t; }
  [[name, checkName], [email, checkEmail], [pw, checkPw]].forEach(function (p) {
    p[0].addEventListener('blur', function () { if (p[0].value) p[1](); });
    p[0].addEventListener('input', function () { if (p[0].closest('.field').classList.contains('is-invalid')) p[1](); });
  });

  function finish(text) {
    msg.classList.remove('is-error'); msg.textContent = text;
    setTimeout(function () { location.href = 'dashboard.html#properties'; }, 1000);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = [checkName(), checkEmail(), checkPw()].every(Boolean);
    if (!ok) {
      msg.classList.add('is-error');
      msg.textContent = 'Please fix the highlighted fields.';
      var first = $('[aria-invalid="true"]', form); if (first) first.focus(); return;
    }
    btn.classList.add('is-loading'); $('.btn__text', btn).textContent = 'Creating account…';
    msg.textContent = '';
    // Demo only: replace with your real sign-up request.
    setTimeout(function () { finish('Account created! Taking you to enroll your first property…'); }, 900);
  });

  /* ---------- Brand icons: show once they've loaded (letter badge stays if offline) ---------- */
  var MARKS = { Google: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/google.svg', Apple: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/apple.svg' };
  document.querySelectorAll('.social__btn').forEach(function (b) {
    var img = new Image();
    img.onload = function () { b.classList.add('has-mark'); };
    img.src = MARKS[b.dataset.provider];
  });

  /* ---------- Social sign-in (demo) ---------- */
  document.querySelectorAll('.social__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.dataset.provider;
      b.classList.add('is-loading');
      msg.classList.remove('is-error'); msg.textContent = 'Connecting to ' + p + '…';
      // Demo only: start your Google / Apple OAuth flow here.
      setTimeout(function () { finish('Signed up with ' + p + '. Taking you to your dashboard…'); }, 900);
    });
  });
})();