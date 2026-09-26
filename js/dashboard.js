/* =========================================================
   FrostGuard Snow & Ice — dashboard.js (client portal)
   Views: overview · properties & enrollment · visit history
          salt & ice logs · contracts & renewal · invoices
   Theme + RTL toggles · drawer sidebar · modal · toast
   (Demo data lives in the DATA section — swap for an API later.)
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopMQ = window.matchMedia('(min-width: 1024px)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var isRTL = function () { return root.getAttribute('dir') === 'rtl'; };
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function icon(id, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + '><use href="#i-' + id + '"/></svg>'; }
  function fmtDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

  /* =======================================================
     DATA (demo) — 2025–26 season history, 2026–27 renewals
     ======================================================= */
  var properties = [
    { id: 'P-101', name: 'Northgate Plaza', addr: '48 Depot Lane, Northgate', type: 'Commercial lot', icon: 'truck', plan: 'Premium Seasonal', trigger: '1″', arrival: '2 hr', area: '42,000 sq ft', status: 'Active' },
    { id: 'P-102', name: 'Maple Ridge Residence', addr: '12 Birch Court, Maple Ridge', type: 'Residential driveway', icon: 'home', plan: 'Standard Seasonal', trigger: '2″', arrival: '4 hr', area: '2,400 sq ft', status: 'Active' },
    { id: 'P-103', name: 'Cedar Medical Walkways', addr: '301 Cedar Ave, Cedar Falls', type: 'Sidewalks & entries', icon: 'shield', plan: 'Sidewalk Plus', trigger: '0.5″', arrival: '3 hr', area: '6,800 sq ft', status: 'Starts Nov 1' }
  ];

  var storms = [
    { id: 'S-01', name: 'First Snow of the Season', date: 'Nov 18, 2025', short: 'Nov 18', snow: 3 },
    { id: 'S-02', name: 'Early December Storm', date: 'Dec 3, 2025', short: 'Dec 3', snow: 6 },
    { id: 'S-03', name: 'Solstice Squall', date: 'Dec 21, 2025', short: 'Dec 21', snow: 5 },
    { id: 'S-04', name: 'January Blizzard', date: 'Jan 9, 2026', short: 'Jan 9', snow: 11 },
    { id: 'S-05', name: 'Lake-Effect Band', date: 'Jan 27, 2026', short: 'Jan 27', snow: 7 },
    { id: 'S-06', name: 'Valentine’s Nor’easter', date: 'Feb 14, 2026', short: 'Feb 14', snow: 14 },
    { id: 'S-07', name: 'Late-Season Ice Storm', date: 'Mar 2, 2026', short: 'Mar 2', snow: 2, ice: true }
  ];

  var crews = ['Truck 12 · J. Alvarez', 'Truck 07 · M. Chen', 'Loader 3 · D. Brooks', 'Brine unit 2 · S. Okafor'];
  var times = ['3:40 AM', '5:12 AM', '6:05 AM', '7:30 AM', '9:45 AM', '11:20 AM', '1:55 PM', '4:10 PM'];

  /* visits: generated from each storm so the history stays consistent */
  var visits = [];
  storms.forEach(function (s, si) {
    var n = 0;
    function add(prop, service, crew, mins) {
      visits.push({ storm: s.id, prop: prop, service: service, crew: crew, mins: mins, time: times[(si + n) % times.length], status: 'Completed', id: s.id + '-' + (++n) });
    }
    if (s.ice) {
      add('P-101', 'Ice treatment', crews[3], 35);
      add('P-102', 'Ice treatment', crews[3], 15);
      return;
    }
    add('P-101', 'Brine pre-treatment', crews[3], 30);
    var pushes = Math.ceil(s.snow / 4);
    for (var i = 0; i < pushes; i++) add('P-101', 'Plow · lot & docks', crews[i % 2], 55 + (i * 5));
    if (s.snow >= 10) add('P-101', 'Snow haul-off', crews[2], 120);
    add('P-101', 'Salt application', crews[3], 25);
    add('P-102', 'Plow · driveway', crews[1], 20);
    if (s.snow >= 10) add('P-102', 'Plow · second pass', crews[1], 18);
  });

  /* salt log: one entry per treatment visit */
  var saltLog = [];
  var temps = [24, 19, 27, 12, 16, 21, 30];
  visits.forEach(function (v) {
    var s = storms.filter(function (x) { return x.id === v.storm; })[0];
    var si = storms.indexOf(s);
    if (v.service === 'Brine pre-treatment') saltLog.push({ storm: v.storm, date: s.short, year: s.date.slice(-4), time: v.time, prop: v.prop, material: 'Brine (23% NaCl)', amount: 1200 + si * 150, unit: 'L', area: 'Lot A & B, entries', temp: temps[si] + 6, by: v.crew });
    if (v.service === 'Salt application') saltLog.push({ storm: v.storm, date: s.short, year: s.date.slice(-4), time: v.time, prop: v.prop, material: 'Rock salt', amount: +(1.6 + s.snow * 0.12).toFixed(1), unit: 't', area: 'Lot A & B, fire lanes', temp: temps[si], by: v.crew });
    if (v.service === 'Ice treatment') saltLog.push({ storm: v.storm, date: s.short, year: s.date.slice(-4), time: v.time, prop: v.prop, material: v.prop === 'P-102' ? 'Pet-safe blend' : 'Rock salt', amount: v.prop === 'P-102' ? 0.2 : 2.8, unit: 't', area: v.prop === 'P-102' ? 'Driveway & front steps' : 'Entire lot', temp: 29, by: v.crew });
    if (v.prop === 'P-102' && v.service === 'Plow · driveway') saltLog.push({ storm: v.storm, date: s.short, year: s.date.slice(-4), time: v.time, prop: v.prop, material: 'Pet-safe blend', amount: 0.1, unit: 't', area: 'Walkway & steps', temp: temps[si], by: v.crew });
  });

  var contracts = [
    { id: 'C-101', prop: 'P-101', plan: 'Premium Seasonal', season: '2025–26', start: 'Nov 1, 2025', end: 'Apr 15, 2026', price: 2850, next: 2950, status: 'renew', auto: false },
    { id: 'C-102', prop: 'P-102', plan: 'Standard Seasonal', season: '2025–26', start: 'Nov 1, 2025', end: 'Apr 15, 2026', price: 1450, next: 1485, status: 'renew', auto: true },
    { id: 'C-103', prop: 'P-103', plan: 'Sidewalk Plus', season: '2026–27', start: 'Nov 1, 2026', end: 'Apr 15, 2027', price: 980, next: 980, status: 'upcoming', auto: true }
  ];

  var invoices = [
    { id: 'INV-2026-0901', date: 'Sep 1, 2026', due: 'Sep 15, 2026', desc: 'Enrollment & site mapping', prop: 'P-103', amount: 250, status: 'overdue' },
    { id: 'INV-2026-0915', date: 'Sep 15, 2026', due: 'Oct 15, 2026', desc: '2026–27 season deposit (1 of 3)', prop: 'P-101', amount: 983.33, status: 'due' },
    { id: 'INV-2026-0916', date: 'Sep 15, 2026', due: 'Oct 15, 2026', desc: '2026–27 season deposit (1 of 3)', prop: 'P-102', amount: 495, status: 'due' },
    { id: 'INV-2026-0301', date: 'Mar 1, 2026', due: 'Mar 15, 2026', desc: '2025–26 season, instalment 3 of 3', prop: 'P-101', amount: 950, status: 'paid' },
    { id: 'INV-2026-0302', date: 'Mar 1, 2026', due: 'Mar 15, 2026', desc: '2025–26 season, instalment 3 of 3', prop: 'P-102', amount: 483.34, status: 'paid' },
    { id: 'INV-2026-0216', date: 'Feb 16, 2026', due: 'Mar 2, 2026', desc: 'Snow haul-off after Feb 14 storm', prop: 'P-101', amount: 640, status: 'paid' },
    { id: 'INV-2026-0101', date: 'Jan 1, 2026', due: 'Jan 15, 2026', desc: '2025–26 season, instalment 2 of 3', prop: 'P-101', amount: 950, status: 'paid' },
    { id: 'INV-2026-0102', date: 'Jan 1, 2026', due: 'Jan 15, 2026', desc: '2025–26 season, instalment 2 of 3', prop: 'P-102', amount: 483.33, status: 'paid' },
    { id: 'INV-2025-1101', date: 'Nov 1, 2025', due: 'Nov 15, 2025', desc: '2025–26 season, instalment 1 of 3', prop: 'P-101', amount: 950, status: 'paid' },
    { id: 'INV-2025-1102', date: 'Nov 1, 2025', due: 'Nov 15, 2025', desc: '2025–26 season, instalment 1 of 3', prop: 'P-102', amount: 483.33, status: 'paid' }
  ];

  var notes = [
    { icon: 'file', title: 'Renewal window closes Oct 31', text: '2 contracts are waiting for 2026–27 renewal', unread: true },
    { icon: 'receipt', title: 'Invoice INV-2026-0901 is overdue', text: 'Cedar Medical enrollment · $250', unread: true },
    { icon: 'pin', title: 'Site mapping completed', text: 'Cedar Medical Walkways · Sep 12', unread: true },
    { icon: 'snow', title: 'Season report ready', text: 'Your 2025–26 service summary is ready to view', unread: false }
  ];

  var ENROLL_DEADLINE = new Date(2026, 9, 31);   // Oct 31, 2026
  var WINDOW_START = new Date(2026, 8, 1);       // Sep 1, 2026

  var propName = function (id) { var p = properties.filter(function (x) { return x.id === id; })[0]; return p ? p.name : id; };
  var state = { q: '', invFilter: 'all' };

  /* =======================================================
     THEME + RTL (same keys as the website)
     ======================================================= */
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

  /* =======================================================
     SIDEBAR DRAWER (< 1024px)
     ======================================================= */
  var side = $('#side'), burger = $('#burger'), sideOverlay = $('#sideOverlay');
  function openSide() { side.classList.add('is-open'); sideOverlay.classList.add('is-visible'); document.body.classList.add('side-open'); burger.setAttribute('aria-expanded', 'true'); setTimeout(function () { $('#sideClose').focus(); }, 250); }
  function closeSide() { side.classList.remove('is-open'); sideOverlay.classList.remove('is-visible'); document.body.classList.remove('side-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', openSide);
  $('#sideClose').addEventListener('click', closeSide);
  sideOverlay.addEventListener('click', closeSide);
  desktopMQ.addEventListener('change', function (e) { if (e.matches) closeSide(); });

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */
  var notif = $('.notif'), notifBtn = $('#notifBtn');
  function renderNotes() {
    $('#notifList').innerHTML = notes.map(function (n) {
      return '<li class="' + (n.unread ? 'is-unread' : '') + '"><span class="notif__ico">' + icon(n.icon) + '</span><span><strong>' + esc(n.title) + '</strong><small>' + esc(n.text) + '</small></span></li>';
    }).join('');
    $('.notif__dot').classList.toggle('is-hidden', !notes.some(function (n) { return n.unread; }));
  }
  notifBtn.addEventListener('click', function (e) { e.stopPropagation(); var open = !notif.classList.contains('is-open'); notif.classList.toggle('is-open', open); notifBtn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', function (e) { if (!notif.contains(e.target)) { notif.classList.remove('is-open'); notifBtn.setAttribute('aria-expanded', 'false'); } });
  $('#notifClear').addEventListener('click', function () { notes.forEach(function (n) { n.unread = false; }); renderNotes(); });

  /* =======================================================
     MODAL + TOAST
     ======================================================= */
  var modal = $('#modal'), modalBody = $('#modalBody'), lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
    setTimeout(function () { var f = $('select, input, .btn', modalBody) || $('.modal__close'); if (f) f.focus(); }, 60);
  }
  function closeModal() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); if (lastFocus) lastFocus.focus(); }
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) closeModal();
    else if (side.classList.contains('is-open')) { closeSide(); burger.focus(); }
    notif.classList.remove('is-open');
  });
  var toastTimer;
  function toast(msg) { $('#toastText').textContent = msg; var t = $('#toast'); t.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200); }

  /* =======================================================
     COUNTERS + "live" animations
     ======================================================= */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var fmt = function (n) { return pre + n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var start = null;
    (function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / 1400, 1); el.textContent = fmt(target * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  function goLive(scope) {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      $$('.chart, .hbars', scope).forEach(function (c) { c.classList.add('is-live'); });
      $$('[data-count]', scope).forEach(countUp);
    }); });
  }

  /* =======================================================
     HELPERS for status chips
     ======================================================= */
  function invChip(s) { return s === 'paid' ? '<span class="chip chip--ok">Paid</span>' : s === 'overdue' ? '<span class="chip chip--bad">Overdue</span>' : '<span class="chip chip--warn">Due</span>'; }
  function dueInvoices() { return invoices.filter(function (i) { return i.status !== 'paid'; }); }
  function balance() { return dueInvoices().reduce(function (a, i) { return a + i.amount; }, 0); }
  function daysLeft() { var d = Math.ceil((ENROLL_DEADLINE - new Date()) / 864e5); return Math.max(0, d); }
  function pendingRenewals() { return contracts.filter(function (c) { return c.status === 'renew'; }); }
  function matchQ(text) { return !state.q || text.toLowerCase().indexOf(state.q) > -1; }

  function updateCounts() {
    $('#countVisits').textContent = visits.length;
    var pr = pendingRenewals().length; $('#countRenew').textContent = pr; $('#countRenew').hidden = !pr;
    var d = dueInvoices().length; $('#countDue').textContent = d; $('#countDue').hidden = !d;
  }

  /* =======================================================
     VIEW: OVERVIEW
     ======================================================= */
  function renderOverview() {
    var totalSalt = saltLog.filter(function (s) { return s.unit === 't'; }).reduce(function (a, s) { return a + s.amount; }, 0);
    var active = properties.length;
    var k = [
      { icon: 'home', label: 'Enrolled properties', val: '<span data-count="' + active + '">0</span>', trend: properties.filter(function (p) { return p.status !== 'Active'; }).length + ' starting Nov 1' },
      { icon: 'snow', label: 'Visits last season', val: '<span data-count="' + visits.length + '">0</span>', trend: '100% on time' },
      { icon: 'drop', label: 'Salt applied (tonnes)', val: '<span data-count="' + totalSalt.toFixed(1) + '" data-decimals="1">0</span>', trend: '38% less with brine' },
      { icon: 'receipt', label: 'Balance due', val: '<span data-count="' + balance().toFixed(2) + '" data-prefix="$" data-decimals="2">0</span>', trend: dueInvoices().length + ' open invoices', warn: true }
    ];
    $('#kpis').innerHTML = k.map(function (x) {
      return '<article class="kpi"><div class="kpi__top"><span class="kpi__label">' + x.label + '</span><span class="kpi__icon">' + icon(x.icon) + '</span></div>' +
        '<strong class="kpi__value num">' + x.val + '</strong><span class="kpi__trend' + (x.warn ? ' kpi__trend--warn' : '') + '">' + x.trend + '</span></article>';
    }).join('');

    var max = Math.max.apply(null, storms.map(function (s) { return visits.filter(function (v) { return v.storm === s.id; }).length; }));
    $('#stormChart').innerHTML = storms.map(function (s) {
      var n = visits.filter(function (v) { return v.storm === s.id; }).length;
      return '<div class="bar" style="--h:' + (n / max).toFixed(3) + '"><span class="bar__tip">' + esc(s.name) + ' · ' + s.snow + '″ · ' + n + ' visits</span><span class="bar__val">' + n + '</span><span class="bar__fill"></span><span class="bar__label">' + s.short + '</span></div>';
    }).join('');
    $('#stormChart').classList.remove('is-live');

    var days = daysLeft(), total = Math.round((ENROLL_DEADLINE - WINDOW_START) / 864e5);
    $('#renewDays').dataset.count = days;
    var ring = $('#renewRing'); ring.style.setProperty('--p', 0);
    setTimeout(function () { ring.style.setProperty('--p', Math.round((1 - days / total) * 100)); }, 120);
    $('#renewList').innerHTML = contracts.map(function (c) {
      var chip = c.status === 'renewed' ? '<span class="chip chip--ok">Renewed</span>' : c.status === 'upcoming' ? '<span class="chip">Starts Nov 1</span>' : c.auto ? '<span class="chip">Auto-renew</span>' : '<span class="chip chip--warn">Action needed</span>';
      return '<li><span>' + esc(propName(c.prop)) + '</span>' + chip + '</li>';
    }).join('');

    var recent = visits.slice(-5).reverse();
    $('#recentFeed').innerHTML = recent.map(function (v) {
      var s = storms.filter(function (x) { return x.id === v.storm; })[0];
      var ic = /salt|brine|ice/i.test(v.service) ? 'drop' : 'truck';
      return '<li><span class="feed__ico">' + icon(ic) + '</span><span class="feed__body"><strong>' + esc(v.service) + ' · ' + esc(propName(v.prop)) + '</strong><small>' + esc(s.name) + ' · ' + s.short + ', ' + v.time + '</small></span><span class="chip chip--ok">Done</span></li>';
    }).join('');

    var due = dueInvoices();
    $('#dueBox').innerHTML = '<p class="due__amount num" data-count="' + balance().toFixed(2) + '" data-prefix="$" data-decimals="2">$0</p><p class="due__sub">' + due.length + ' open invoice' + (due.length === 1 ? '' : 's') + '</p>' +
      '<ul class="due__list">' + due.slice(0, 3).map(function (i) {
        return '<li><div><strong>' + i.id + '</strong><small>' + esc(propName(i.prop)) + ' · due ' + i.due + '</small></div><b class="num">' + money(i.amount) + '</b></li>';
      }).join('') + '</ul>' +
      (due.length ? '<button class="btn btn--primary btn--block" data-pay-all>' + icon('card') + 'Pay ' + money(balance()) + '</button>' : '<p class="due__sub">You’re all paid up. Thank you!</p>');
  }

  /* =======================================================
     VIEW: PROPERTIES & ENROLLMENT
     ======================================================= */
  function renderProps() {
    $('#propList').innerHTML = properties.map(function (p) {
      var chip = p.status === 'Active' ? '<span class="chip chip--ok">Active</span>' : '<span class="chip">' + esc(p.status) + '</span>';
      return '<article class="prop' + (p.isNew ? ' is-new' : '') + '"><div class="prop__media">' + icon(p.icon) + '<span class="prop__status">' + chip + '</span></div>' +
        '<div class="prop__body"><h3>' + esc(p.name) + '</h3><p class="prop__addr">' + icon('pin') + esc(p.addr) + '</p>' +
        '<div class="prop__meta"><div><small>Plan</small><strong>' + esc(p.plan) + '</strong></div><div><small>Trigger</small><strong>' + esc(p.trigger) + ' · ' + esc(p.arrival) + '</strong></div>' +
        '<div><small>Type</small><strong>' + esc(p.type) + '</strong></div><div><small>Area</small><strong>' + esc(p.area) + '</strong></div></div>' +
        '<div class="prop__actions"><a href="#visits" class="btn btn--outline btn--sm" data-prop-visits="' + p.id + '">Visits</a><a href="#contracts" class="btn btn--primary btn--sm">Contract</a></div></div></article>';
    }).join('') + '<button class="prop prop--add" data-goto-enroll><span>' + icon('plus') + 'Enroll another property</span></button>';
    properties.forEach(function (p) { delete p.isNew; });
  }

  var PLANS = { standard: { name: 'Standard Seasonal', base: 1450, trigger: '2″', arrival: '4 hr' }, premium: { name: 'Premium Seasonal', base: 2850, trigger: '1″', arrival: '2 hr' }, sidewalk: { name: 'Sidewalk Plus', base: 980, trigger: '0.5″', arrival: '3 hr' } };
  var TYPES = { res: { name: 'Residential driveway', mult: 1, icon: 'home' }, com: { name: 'Commercial lot', mult: 1.9, icon: 'truck' }, hoa: { name: 'HOA / condo community', mult: 1.6, icon: 'home' }, walk: { name: 'Sidewalks & entries', mult: .8, icon: 'shield' } };
  var ADDONS = { brine: { name: 'Brine pre-treatment', price: 240 }, petsafe: { name: 'Pet-safe de-icer', price: 180 }, haul: { name: 'Snow haul-off', price: 600 }, priority: { name: 'Priority route', price: 350 } };
  var form = $('#enrollForm');
  function planPrice(plan, type, area) { return Math.round(PLANS[plan].base * TYPES[type].mult * Math.max(1, Math.sqrt((area || 2500) / 2500)) / 5) * 5; }
  function quote() {
    var type = form.type.value, area = parseFloat(form.area.value) || 2500, plan = form.plan.value;
    $$('[data-plan-price]', form).forEach(function (b) { b.textContent = money(planPrice(b.dataset.planPrice, type, area)); });
    var lines = [{ name: PLANS[plan].name + ' · ' + TYPES[type].name, price: planPrice(plan, type, area) }];
    $$('input[name="addon"]:checked', form).forEach(function (a) { lines.push({ name: ADDONS[a.value].name, price: ADDONS[a.value].price }); });
    var total = lines.reduce(function (a, l) { return a + l.price; }, 0);
    $('#quoteLines').innerHTML = lines.map(function (l) { return '<li><span>' + esc(l.name) + '</span><b class="num">' + money(l.price) + '</b></li>'; }).join('');
    var t = $('#quoteTotal'); t.textContent = money(total); t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); setTimeout(function () { t.classList.remove('bump'); }, 300);
    return { total: total, plan: plan, type: type, area: area };
  }
  form.addEventListener('input', quote);
  form.addEventListener('change', quote);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    ['name', 'addr', 'area', 'start'].forEach(function (n) {
      var f = form[n], v = f.value.trim(), invalid = !v || (n === 'area' && parseFloat(v) < 500);
      f.closest('.field').classList.toggle('is-invalid', invalid);
      if (invalid && !bad) bad = f;
    });
    var msg = $('#enrollMsg');
    if (bad) { msg.textContent = 'Please complete the highlighted fields (area must be at least 500 sq ft).'; msg.classList.add('is-error'); bad.focus(); return; }
    var q = quote(), id = 'P-' + (101 + properties.length), start = new Date(form.start.value + 'T00:00');
    properties.push({ id: id, name: form.name.value.trim(), addr: form.addr.value.trim(), type: TYPES[q.type].name, icon: TYPES[q.type].icon, plan: PLANS[q.plan].name, trigger: PLANS[q.plan].trigger, arrival: PLANS[q.plan].arrival, area: Math.round(q.area).toLocaleString('en-US') + ' sq ft', status: 'Starts ' + start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isNew: true });
    contracts.push({ id: 'C-' + id.slice(2), prop: id, plan: PLANS[q.plan].name, season: '2026–27', start: fmtDate(start), end: 'Apr 15, 2027', price: q.total, next: q.total, status: 'upcoming', auto: true });
    var dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    invoices.unshift({ id: 'INV-2026-' + (1000 + invoices.length), date: fmtDate(new Date()), due: fmtDate(dueDate), desc: '2026–27 season deposit (1 of 3)', prop: id, amount: Math.round(q.total / 3 * 100) / 100, status: 'due' });
    notes.unshift({ icon: 'home', title: 'Property enrolled', text: form.name.value.trim() + ' · ' + PLANS[q.plan].name, unread: true });
    msg.classList.remove('is-error'); msg.textContent = '';
    form.reset(); $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); }); quote();
    renderProps(); populateFilters(); updateCounts(); renderNotes();
    toast('Property enrolled. Your deposit invoice is ready.');
    $('#propList').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
  $$('input, select', form).forEach(function (f) { f.addEventListener('input', function () { var fl = f.closest('.field'); if (fl) fl.classList.remove('is-invalid'); }); });

  /* =======================================================
     VIEW: VISIT HISTORY (grouped by storm)
     ======================================================= */
  function populateFilters() {
    var sf = $('#stormFilter'), keep = sf.value;
    sf.innerHTML = '<option value="all">All storms</option>' + storms.map(function (s) { return '<option value="' + s.id + '">' + s.short + ' · ' + esc(s.name) + '</option>'; }).join('');
    sf.value = keep || 'all';
    ['#propFilterV', '#propFilterS'].forEach(function (sel) {
      var el = $(sel), k = el.value;
      el.innerHTML = '<option value="all">All properties</option>' + properties.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('');
      el.value = k && $('option[value="' + k + '"]', el) ? k : 'all';
    });
  }
  function renderVisits() {
    var sf = $('#stormFilter').value, pf = $('#propFilterV').value, shown = 0;
    var html = storms.slice().reverse().filter(function (s) { return sf === 'all' || s.id === sf; }).map(function (s, i) {
      var rows = visits.filter(function (v) { return v.storm === s.id && (pf === 'all' || v.prop === pf) && matchQ(v.service + ' ' + propName(v.prop) + ' ' + v.crew + ' ' + s.name); });
      if (!rows.length) return '';
      shown += rows.length;
      return '<article class="storm' + (i === 0 || sf !== 'all' ? ' is-open' : '') + '">' +
        '<button class="storm__head" aria-expanded="' + (i === 0 || sf !== 'all') + '"><span class="storm__badge"><strong>' + s.snow + '″</strong><small>' + (s.ice ? 'ice' : 'snow') + '</small></span>' +
        '<span class="storm__info"><h3>' + esc(s.name) + '</h3><p>' + s.date + ' · ' + rows.length + ' visit' + (rows.length === 1 ? '' : 's') + ' · all completed</p></span><span class="storm__chev">' + icon('chev') + '</span></button>' +
        '<div class="storm__body"><div class="storm__inner"><div class="table-wrap"><table class="table"><thead><tr><th>Time</th><th>Property</th><th>Service</th><th>Crew</th><th>Duration</th><th>Status</th><th>Proof</th></tr></thead><tbody>' +
        rows.map(function (v) {
          return '<tr><td data-label="Time"><strong class="num">' + v.time + '</strong></td><td data-label="Property">' + esc(propName(v.prop)) + '</td><td data-label="Service">' + esc(v.service) + '</td><td data-label="Crew">' + esc(v.crew) + '</td><td data-label="Duration" class="num">' + v.mins + ' min</td><td data-label="Status"><span class="chip chip--ok">Completed</span></td>' +
            '<td data-label="Proof"><button class="photo-btn" data-photo="' + v.id + '">' + icon('camera') + 'Photos</button></td></tr>';
        }).join('') + '</tbody></table></div></div></div></article>';
    }).join('');
    $('#stormList').innerHTML = html || '<p class="card empty">No visits match your filters.</p>';
    $('#visitMeta').textContent = shown + ' visit' + (shown === 1 ? '' : 's') + ' shown';
  }
  $('#stormList').addEventListener('click', function (e) {
    var head = e.target.closest('.storm__head');
    if (head) { var st = head.parentElement, open = !st.classList.contains('is-open'); st.classList.toggle('is-open', open); head.setAttribute('aria-expanded', String(open)); return; }
    var ph = e.target.closest('[data-photo]');
    if (ph) {
      var v = visits.filter(function (x) { return x.id === ph.dataset.photo; })[0], s = storms.filter(function (x) { return x.id === v.storm; })[0];
      openModal('<h2 id="modalTitle">' + esc(v.service) + '</h2><p class="modal__sub">' + esc(propName(v.prop)) + ' · ' + s.date + ', ' + v.time + '</p>' +
        '<div class="photo-frame">' + icon('camera') + '<span>GPS verified · ' + s.short + ' ' + v.time + '</span></div>' +
        '<div class="modal__grid"><div class="contract__term-row"><span>Crew</span><b>' + esc(v.crew) + '</b></div><div class="contract__term-row"><span>Time on site</span><b>' + v.mins + ' min</b></div><div class="contract__term-row"><span>Snowfall at arrival</span><b>' + s.snow + '″</b></div></div>' +
        '<div class="modal__foot"><button class="btn btn--primary" data-close>Close</button></div>');
    }
  });
  ['#stormFilter', '#propFilterV'].forEach(function (s) { $(s).addEventListener('change', renderVisits); });

  /* =======================================================
     VIEW: SALT & ICE LOGS
     ======================================================= */
  function filteredSalt() { var pf = $('#propFilterS').value; return saltLog.filter(function (s) { return (pf === 'all' || s.prop === pf) && matchQ(s.material + ' ' + propName(s.prop) + ' ' + s.by + ' ' + s.date); }); }
  function renderSalt() {
    var mats = {};
    saltLog.forEach(function (s) { var m = mats[s.material] || (mats[s.material] = { n: 0, amt: 0, unit: s.unit }); m.n++; m.amt += s.amount; });
    var keys = Object.keys(mats), maxN = Math.max.apply(null, keys.map(function (k) { return mats[k].n; }));
    $('#materialBars').innerHTML = keys.map(function (k) {
      var m = mats[k], amt = m.unit === 't' ? m.amt.toFixed(1) + ' t' : Math.round(m.amt).toLocaleString('en-US') + ' L';
      return '<div class="hbar" style="--v:' + (m.n / maxN).toFixed(3) + '"><div class="hbar__top"><span>' + esc(k) + '</span><b class="num">' + m.n + ' applications · ' + amt + '</b></div><div class="hbar__track"><i></i></div></div>';
    }).join('');
    $('#materialBars').classList.remove('is-live');
    var tonnes = saltLog.filter(function (s) { return s.unit === 't'; }).reduce(function (a, s) { return a + s.amount; }, 0);
    var litres = saltLog.filter(function (s) { return s.unit === 'L'; }).reduce(function (a, s) { return a + s.amount; }, 0);
    $('#saltStats').innerHTML =
      '<div class="stat">' + icon('drop') + '<strong class="num" data-count="' + tonnes.toFixed(1) + '" data-decimals="1" data-suffix=" t">0</strong><small>Salt & de-icer</small></div>' +
      '<div class="stat">' + icon('refresh') + '<strong class="num" data-count="' + litres + '" data-suffix=" L">0</strong><small>Brine pre-treatment</small></div>' +
      '<div class="stat">' + icon('file') + '<strong class="num" data-count="' + saltLog.length + '">0</strong><small>Logged applications</small></div>' +
      '<div class="stat">' + icon('temp') + '<strong class="num">12–36°F</strong><small>Pavement temps treated</small></div>';
    renderSaltTable();
  }
  function renderSaltTable() {
    var rows = filteredSalt().slice().reverse();
    $('#saltTable tbody').innerHTML = rows.length ? rows.map(function (s) {
      return '<tr><td data-label="Date & time"><strong class="num">' + s.date + ', ' + s.year + '</strong><small class="num">' + s.time + '</small></td><td data-label="Property">' + esc(propName(s.prop)) + '</td><td data-label="Material">' + esc(s.material) + '</td>' +
        '<td data-label="Amount"><strong class="num">' + (s.unit === 'L' ? s.amount.toLocaleString('en-US') : s.amount) + ' ' + s.unit + '</strong></td><td data-label="Area">' + esc(s.area) + '</td><td data-label="Temp" class="num">' + s.temp + '°F</td><td data-label="Applied by">' + esc(s.by) + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty">No log entries match.</td></tr>';
  }
  $('#propFilterS').addEventListener('change', renderSaltTable);
  $('#exportCsv').addEventListener('click', function () {
    var rows = [['Date', 'Time', 'Property', 'Material', 'Amount', 'Unit', 'Area', 'Temp (F)', 'Applied by']].concat(filteredSalt().map(function (s) { return [s.date + ' ' + s.year, s.time, propName(s.prop), s.material, s.amount, s.unit, s.area, s.temp, s.by]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'frostguard-salt-log.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Salt log exported (' + (rows.length - 1) + ' entries).');
  });

  /* =======================================================
     VIEW: CONTRACTS & RENEWAL
     ======================================================= */
  function renderContracts() {
    $('#contractList').innerHTML = contracts.map(function (c) {
      var chip, action;
      if (c.status === 'renewed') { chip = '<span class="chip chip--ok">Renewed for 2026–27</span>'; action = '<button class="btn btn--outline btn--sm" data-view-contract="' + c.id + '">' + icon('eye') + 'View terms</button>'; }
      else if (c.status === 'upcoming') { chip = '<span class="chip">Starts ' + c.start + '</span>'; action = '<button class="btn btn--outline btn--sm" data-view-contract="' + c.id + '">' + icon('eye') + 'View terms</button>'; }
      else { chip = c.auto ? '<span class="chip">Auto-renews Oct 31</span>' : '<span class="chip chip--warn">Renewal due Oct 31</span>'; action = '<button class="btn btn--primary btn--sm" data-renew="' + c.id + '">' + icon('refresh') + 'Renew for 2026–27</button>'; }
      var done = c.status === 'renew' ? 100 : c.status === 'renewed' ? 0 : 0;
      return '<article class="contract' + (c.status === 'renewed' ? ' is-renewed' : '') + '">' +
        '<div class="contract__main"><span class="contract__ico">' + icon('file') + '</span><div><h3>' + esc(propName(c.prop)) + '</h3><p>' + esc(c.plan) + ' · ' + c.id + '</p>' + chip + '</div></div>' +
        '<div class="contract__term"><div class="contract__term-row"><span>Season</span><b>' + (c.status === 'renewed' ? '2026–27' : c.season) + '</b></div>' +
        '<div class="contract__term-row"><span>Term</span><b class="num">' + (c.status === 'renewed' ? 'Nov 1, 2026 – Apr 15, 2027' : c.start + ' – ' + c.end) + '</b></div>' +
        '<div class="progress" aria-hidden="true"><i style="--v:' + done + '%"></i></div>' +
        '<div class="contract__term-row"><span>' + (c.status === 'renew' ? '2026–27 price' : 'Season price') + '</span><b class="num">' + money(c.status === 'renew' ? c.next : c.price) + '</b></div></div>' +
        '<div class="contract__actions">' + action +
        '<label class="switch"><input type="checkbox" data-auto="' + c.id + '"' + (c.auto ? ' checked' : '') + '><span></span>Auto-renew</label></div></article>';
    }).join('');
  }
  $('#contractList').addEventListener('change', function (e) {
    var sw = e.target.closest('[data-auto]'); if (!sw) return;
    var c = contracts.filter(function (x) { return x.id === sw.dataset.auto; })[0]; c.auto = sw.checked;
    renderContracts(); toast('Auto-renew ' + (c.auto ? 'turned on' : 'turned off') + ' for ' + propName(c.prop) + '.');
  });
  $('#contractList').addEventListener('click', function (e) {
    var r = e.target.closest('[data-renew]'), v = e.target.closest('[data-view-contract]');
    if (r) openRenew(r.dataset.renew);
    if (v) {
      var c = contracts.filter(function (x) { return x.id === v.dataset.viewContract; })[0], p = properties.filter(function (x) { return x.id === c.prop; })[0];
      openModal('<h2 id="modalTitle">' + esc(p.name) + '</h2><p class="modal__sub">' + esc(c.plan) + ' · ' + c.id + '</p><div class="modal__grid">' +
        [['Snowfall trigger', p.trigger], ['Guaranteed arrival', p.arrival], ['Season', c.status === 'renewed' ? '2026–27' : c.season], ['Season price', money(c.price)], ['Billing', '3 instalments · Nov, Jan, Mar'], ['Auto-renew', c.auto ? 'On' : 'Off']].map(function (x) { return '<div class="contract__term-row"><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') +
        '</div><div class="modal__foot"><button class="btn btn--primary" data-close>Done</button></div>');
    }
  });
  function openRenew(id) {
    var c = contracts.filter(function (x) { return x.id === id; })[0];
    openModal('<h2 id="modalTitle">Renew ' + esc(propName(c.prop)) + '</h2><p class="modal__sub">Choose your plan and billing for the 2026–27 season (Nov 1, 2026 – Apr 15, 2027).</p>' +
      '<form id="renewForm" class="modal__grid">' +
      '<label class="field"><span>Plan</span><select name="plan"><option value="same">' + esc(c.plan) + ' (current) · ' + money(c.next) + '</option><option value="up">Upgrade to Premium Seasonal · ' + money(Math.round(c.next * 1.35)) + '</option></select></label>' +
      '<label class="field"><span>Term</span><select name="term"><option value="1">1 season</option><option value="2">2 seasons · save 5%</option></select></label>' +
      '<label class="field"><span>Billing</span><select name="bill"><option value="3">3 instalments (Nov, Jan, Mar)</option><option value="1">Pay in full · save 3%</option></select></label>' +
      '<div class="quote__total"><span>2026–27 total</span><strong id="renewTotal" class="num">' + money(c.next) + '</strong></div>' +
      '<div class="modal__foot"><button type="button" class="btn btn--outline" data-close>Cancel</button><button type="submit" class="btn btn--primary">' + icon('check') + 'Confirm renewal</button></div></form>');
    var rf = $('#renewForm');
    function calc() { var base = rf.plan.value === 'up' ? Math.round(c.next * 1.35) : c.next; var t = base * (rf.term.value === '2' ? .95 : 1) * (rf.bill.value === '1' ? .97 : 1); $('#renewTotal').textContent = money(Math.round(t)); return Math.round(t); }
    rf.addEventListener('change', calc);
    rf.addEventListener('submit', function (e) {
      e.preventDefault();
      var total = calc();
      if (rf.plan.value === 'up') { c.plan = 'Premium Seasonal'; var p = properties.filter(function (x) { return x.id === c.prop; })[0]; p.plan = 'Premium Seasonal'; p.trigger = '1″'; p.arrival = '2 hr'; }
      c.status = 'renewed'; c.price = total;
      notes.unshift({ icon: 'file', title: 'Contract renewed', text: propName(c.prop) + ' · 2026–27', unread: true });
      closeModal(); renderContracts(); renderProps(); updateCounts(); renderNotes();
      toast(propName(c.prop) + ' is renewed for 2026–27.');
    });
  }

  /* =======================================================
     VIEW: INVOICES
     ======================================================= */
  function renderInvoices() {
    var paid = invoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (a, i) { return a + i.amount; }, 0);
    var overdue = invoices.filter(function (i) { return i.status === 'overdue'; }).reduce(function (a, i) { return a + i.amount; }, 0);
    $('#invSummary').innerHTML = [
      { icon: 'receipt', label: 'Balance due', val: balance(), warn: dueInvoices().length + ' open invoices' },
      { icon: 'clock', label: 'Overdue', val: overdue, warn: overdue ? 'Please pay soon' : 'Nothing overdue', bad: overdue > 0 },
      { icon: 'check', label: 'Paid this year', val: paid, warn: invoices.filter(function (i) { return i.status === 'paid'; }).length + ' invoices settled', ok: true }
    ].map(function (x) {
      return '<article class="kpi"><div class="kpi__top"><span class="kpi__label">' + x.label + '</span><span class="kpi__icon">' + icon(x.icon) + '</span></div><strong class="kpi__value num" data-count="' + x.val.toFixed(2) + '" data-prefix="$" data-decimals="2">$0</strong><span class="kpi__trend' + (x.ok ? '' : ' kpi__trend--warn') + '">' + x.warn + '</span></article>';
    }).join('');
    renderInvTable();
  }
  function renderInvTable() {
    var f = state.invFilter;
    var rows = invoices.filter(function (i) { return (f === 'all' || (f === 'paid' ? i.status === 'paid' : i.status !== 'paid')) && matchQ(i.id + ' ' + i.desc + ' ' + propName(i.prop)); });
    $('#invTable tbody').innerHTML = rows.length ? rows.map(function (i) {
      return '<tr><td data-label="Invoice"><strong>' + i.id + '</strong></td><td data-label="Issued" class="num">' + i.date + '<small>Due ' + i.due + '</small></td><td data-label="Description">' + esc(i.desc) + '</td><td data-label="Property">' + esc(propName(i.prop)) + '</td>' +
        '<td data-label="Amount"><strong class="num">' + money(i.amount) + '</strong></td><td data-label="Status">' + invChip(i.status) + '</td>' +
        '<td data-label="Actions"><div class="t-actions"><button class="icon-btn" data-inv="' + i.id + '" aria-label="View ' + i.id + '">' + icon('eye') + '</button>' +
        (i.status !== 'paid' ? '<button class="btn btn--primary btn--sm" data-pay="' + i.id + '">Pay</button>' : '<button class="icon-btn" data-print="' + i.id + '" aria-label="Download ' + i.id + '">' + icon('download') + '</button>') + '</div></td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty">No invoices match.</td></tr>';
  }
  $('#invTabs').addEventListener('click', function (e) {
    var t = e.target.closest('.tab'); if (!t) return;
    $$('.tab', this).forEach(function (b) { var on = b === t; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    state.invFilter = t.dataset.filter; renderInvTable();
  });
  function invById(id) { return invoices.filter(function (i) { return i.id === id; })[0]; }
  function invoiceModal(i) {
    var lines = i.desc.indexOf('deposit') > -1 ? [['Seasonal plan, first instalment', i.amount]] : i.desc.indexOf('haul') > -1 ? [['Loader & truck, 2 hr', 460], ['Disposal fee', 180]] : i.desc.indexOf('mapping') > -1 ? [['Site survey & hazard marking', 175], ['Route set-up', 75]] : [['Seasonal plan instalment', i.amount]];
    openModal('<h2 id="modalTitle">' + i.id + '</h2><p class="modal__sub">' + esc(propName(i.prop)) + ' · issued ' + i.date + ' · due ' + i.due + ' · ' + invChip(i.status) + '</p>' +
      '<table class="inv-lines"><tbody>' + lines.map(function (l) { return '<tr><td>' + esc(l[0]) + '</td><td class="num">' + money(l[1]) + '</td></tr>'; }).join('') +
      '<tr class="total"><td>Total</td><td class="num">' + money(i.amount) + '</td></tr></tbody></table>' +
      '<div class="modal__foot"><button class="btn btn--outline" data-print-now>' + icon('download') + 'Download PDF</button>' + (i.status !== 'paid' ? '<button class="btn btn--primary" data-pay="' + i.id + '">' + icon('card') + 'Pay ' + money(i.amount) + '</button>' : '<button class="btn btn--primary" data-close>Close</button>') + '</div>');
  }
  function payModal(list) {
    var total = list.reduce(function (a, i) { return a + i.amount; }, 0);
    openModal('<h2 id="modalTitle">Pay ' + money(total) + '</h2><p class="modal__sub">' + list.map(function (i) { return i.id; }).join(', ') + '</p>' +
      '<div class="modal__grid"><div class="contract__term-row"><span>Payment method</span><b>Visa ending 4242</b></div><div class="contract__term-row"><span>Receipt sent to</span><b>jane@cooperprops.com</b></div></div>' +
      '<div class="modal__foot"><button class="btn btn--outline" data-close>Cancel</button><button class="btn btn--primary" data-confirm-pay="' + list.map(function (i) { return i.id; }).join(',') + '">' + icon('check') + 'Confirm payment</button></div>');
  }
  document.addEventListener('click', function (e) {
    var v = e.target.closest('[data-inv]'), p = e.target.closest('[data-pay]'), pa = e.target.closest('[data-pay-all]'), cp = e.target.closest('[data-confirm-pay]'), pr = e.target.closest('[data-print]'), pn = e.target.closest('[data-print-now]');
    if (v) invoiceModal(invById(v.dataset.inv));
    if (p) payModal([invById(p.dataset.pay)]);
    if (pa) payModal(dueInvoices());
    if (pr) { invoiceModal(invById(pr.dataset.print)); setTimeout(function () { window.print(); }, 450); }
    if (pn) window.print();
    if (cp) {
      var ids = cp.dataset.confirmPay.split(',');
      ids.forEach(function (id) { invById(id).status = 'paid'; });
      closeModal(); updateCounts(); renderInvoices(); renderOverview(); goLive($('.view:not([hidden])'));
      toast('Payment received. Thank you!');
    }
    var pv = e.target.closest('[data-prop-visits]');
    if (pv) { $('#propFilterV').value = pv.dataset.propVisits; }
    if (e.target.closest('[data-goto-enroll]')) { $('#enroll').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); setTimeout(function () { form.name.focus({ preventScroll: true }); }, 500); }
  });

  /* account modal */
  $('#userBtn').addEventListener('click', function () {
    openModal('<h2 id="modalTitle">Account</h2><p class="modal__sub">Cooper Properties LLC · client since 2021</p><form class="modal__grid" id="acctForm">' +
      '<label class="field"><span>Name</span><input type="text" value="Jane Cooper"></label><label class="field"><span>Email</span><input type="email" value="jane@cooperprops.com"></label><label class="field"><span>Phone for storm alerts</span><input type="tel" value="(555) 012-3456"></label>' +
      '<div class="modal__foot"><button type="button" class="btn btn--outline" data-close>Cancel</button><button type="submit" class="btn btn--primary">Save changes</button></div></form>');
    $('#acctForm').addEventListener('submit', function (e) { e.preventDefault(); closeModal(); toast('Account details saved.'); });
  });

  /* =======================================================
     ROUTER
     ======================================================= */
  var TITLES = {
    overview: ['Overview', 'Welcome back, Jane. Here’s your winter at a glance.'],
    properties: ['Properties & Enrollment', 'Your enrolled properties and seasonal plans'],
    visits: ['Visit History', 'Every visit, grouped by storm event'],
    salt: ['Salt & Ice Logs', 'Treatment records for insurance and compliance'],
    contracts: ['Contracts & Renewal', 'Renew for 2026–27 before October 31'],
    invoices: ['Invoices', 'Statements, balances and online payment']
  };
  var RENDER = { overview: renderOverview, properties: renderProps, visits: renderVisits, salt: renderSalt, contracts: renderContracts, invoices: renderInvoices };
  function route() {
    var v = (location.hash || '#overview').slice(1);
    if (v === 'enroll') { v = 'properties'; setTimeout(function () { $('#enroll').scrollIntoView(); }, 50); }
    if (!TITLES[v]) v = 'overview';
    $$('.view').forEach(function (s) { s.hidden = s.dataset.view !== v; });
    $$('.side__link[data-view]').forEach(function (a) { var on = a.dataset.view === v; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#pageTitle').textContent = TITLES[v][0]; $('#pageSub').textContent = TITLES[v][1];
    document.title = TITLES[v][0] + ' | FrostGuard Client Dashboard';
    RENDER[v]();
    var view = $('#view-' + v); view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    goLive(view);
    closeSide();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* global search: filters the current list, or jumps to visits/invoices */
  $('#globalSearch').addEventListener('input', function () {
    state.q = this.value.trim().toLowerCase();
    var v = (location.hash || '#overview').slice(1);
    if (v === 'visits') renderVisits(); else if (v === 'salt') renderSaltTable(); else if (v === 'invoices') renderInvTable();
  });
  $('#globalSearch').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var q = this.value.trim().toLowerCase(), target = /^inv|invoice|\$/.test(q) ? 'invoices' : 'visits';
    var v = (location.hash || '#overview').slice(1);
    if (v !== 'visits' && v !== 'salt' && v !== 'invoices') location.hash = target;
  });

  /* init */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  populateFilters(); quote(); updateCounts(); renderNotes(); route();
})();