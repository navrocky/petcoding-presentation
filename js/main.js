(function () {
  var api = impress();
  api.init();

  var steps = Array.prototype.slice.call(document.querySelectorAll('#impress .step.slide'));
  var bar = document.querySelector('.progress div');
  var orbs = Array.prototype.slice.call(document.querySelectorAll('.orb'));

  // Орбы плывут против движения «камеры» с разной скоростью — параллакс
  document.addEventListener('impress:stepenter', function (e) {
    var i = steps.indexOf(e.target);
    if (i >= 0 && bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
    var x = parseFloat(e.target.getAttribute('data-x')) || 0;
    var y = parseFloat(e.target.getAttribute('data-y')) || 0;
    orbs.forEach(function (o) {
      var k = parseFloat(o.getAttribute('data-k'));
      o.style.translate = (-x * k / 40) + 'px ' + (-y * k / 40) + 'px';
    });
  });

  // Рисуем только соседей (±2) текущего слайда и того, куда летим: остальные скрыты (см. .near в CSS)
  function markNear(list) {
    steps.forEach(function (st, i) {
      var near = list.some(function (el) { var j = steps.indexOf(el); return j >= 0 && Math.abs(i - j) <= 2; });
      st.classList.toggle('near', near);
    });
  }
  document.addEventListener('impress:stepleave', function (e) { markNear([e.target, e.detail.next]); });
  document.addEventListener('impress:stepenter', function (e) { markNear([e.target]); });
  markNear([document.querySelector('#impress .step.active')]);  // первый stepenter был ещё в init()

  // O — обзор всей «полки»
  document.addEventListener('keydown', function (e) {
    if (e.key === 'o' || e.key === 'O' || e.key === 'щ' || e.key === 'Щ') api.goto('overview');
  });
})();

// Облака CloudMus летят на зрителя из-за логотипа — как в шапке cloudmus.app
(function () {
  var slide = document.getElementById('cloudmus');
  var box = slide && slide.querySelector('.cm-clouds');
  var logo = slide && slide.querySelector('.hero-logo');
  if (!box || !logo) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // формы облаков с сайта: [cx, cy, r] кругов
  var SH = [
    [[3.4,9.4,2.9],[7.2,6.6,3.8],[11.4,7.6,3],[13,10,2.4],[8.2,9.6,3]],
    [[3.6,9.6,2.8],[6.6,6.8,3.4],[10.6,6,3.4],[13,9.4,2.6],[8.6,9.8,2.9]],
    [[2.9,10.2,2.5],[6,8.2,3],[9.6,7,3.4],[13,9.6,2.6],[7.8,10.2,2.5],[11,10.4,2.4]],
    [[3.8,10,2.6],[6.4,8,2.8],[10,6.4,3.8],[13.2,9.8,2.4],[9,10,2.8]]
  ];
  var NS = 'http://www.w3.org/2000/svg', CW = 160, ZF = 14, ZN = 0.35, SPEED = 1.6;
  var pool = [], clouds = [], raf = 0, last = 0, acc = 0;

  for (var i = 0; i < 28; i++) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0.3 2.6 15.3 10.2');
    var g = document.createElementNS(NS, 'g');
    var warm = i % 3 === 0;
    g.setAttribute('fill', warm ? 'rgb(255,140,95)' : 'rgb(255,240,232)');
    SH[i % 4].forEach(function (c) {
      var ci = document.createElementNS(NS, 'circle');
      ci.setAttribute('cx', c[0]); ci.setAttribute('cy', c[1]); ci.setAttribute('r', c[2]);
      g.appendChild(ci);
    });
    svg.appendChild(g);
    box.appendChild(svg);
    pool.push({ el: svg, warm: warm, used: false });
  }

  var zc = 1000;
  function spawn(z0) {
    var p = pool.find(function (q) { return !q.used; });
    if (!p) return;
    p.used = true; p.el.style.zIndex = String(--zc);
    var a = Math.random() * Math.PI * 2, r = 0.9 + Math.random() * 2.6;
    clouds.push({ p: p, x: Math.cos(a) * r * 1.5, y: Math.sin(a) * r * 0.85, z: z0 || ZF,
      s: 0.6 + Math.random() * 0.8, rot: (Math.random() - .5) * 14, flip: Math.random() < .5 ? -1 : 1 });
  }
  for (i = 0; i < 22; i++) spawn(ZN + 0.5 + Math.random() * (ZF - ZN - 0.5));

  function tick(now) {
    raf = requestAnimationFrame(tick);
    var dt = Math.min(50, now - last); last = now;
    // координаты в системе слайда: offset* не зависят от 3D-трансформаций impress
    var W = box.clientWidth, H = box.clientHeight;
    var cx = logo.offsetLeft + logo.offsetWidth / 2, cy = logo.offsetTop + logo.offsetHeight / 2;
    var fl = Math.min(W, H * 1.6) * 0.55;

    acc += dt * SPEED * 0.0035;
    while (acc > 1 && clouds.length < 28) { spawn(); acc -= 1; }
    for (var j = clouds.length - 1; j >= 0; j--) {
      var c = clouds[j];
      c.z -= SPEED * dt * 0.0011;
      if (c.z < ZN) { c.p.used = false; c.p.el.style.opacity = '0'; clouds.splice(j, 1); }
    }
    clouds.forEach(function (c) {
      var k = fl / c.z, x = cx + c.x * k, y = cy + c.y * k, f = c.s * k * 0.09 * 17.3 / CW;
      // у краёв слайда облака гаснут, а не обрезаются
      var ext = f * CW / 2;
      var vg = Math.max(0, Math.min(1, Math.min(x + ext, W - x + ext) / (W * .22), Math.min(y + ext, H - y + ext) / (H * .22)));
      var alpha = Math.min(1, (ZF - c.z) / 4) * Math.min(1, (c.z - ZN) / 1.2) * 0.12 * vg * (c.p.warm ? 1.35 : 0.8);
      var big = f * CW / W, st = c.p.el.style;
      if (alpha <= 0.003 || big > 1.3) { st.opacity = '0'; return; }
      st.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + c.rot.toFixed(1) + 'deg) scale(' + (f * c.flip).toFixed(3) + ',' + f.toFixed(3) + ')';
      st.opacity = (alpha * Math.min(1, (1.3 - big) / 0.5)).toFixed(3);
    });
  }

  // крутим анимацию, пока слайд открыт: стартуем уже в начале перелёта к нему,
  // а при уходе останавливаем только после окончания перелёта
  var duration = parseInt(document.getElementById('impress').getAttribute('data-transition-duration'), 10) || 1000;
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener('impress:stepleave', function (e) {
    if (e.detail.next === slide) start();
    else if (e.target === slide) setTimeout(function () { if (!slide.classList.contains('active')) stop(); }, duration + 100);
  });
  document.addEventListener('impress:stepenter', function (e) { if (e.target === slide) start(); });
})();

// Бэклог-титры едут, только пока слайд открыт (play-state в CSS по .active).
// После ухода, когда слайд уже скрылся, отматываем их в начало — следующий вход начнётся снизу.
(function () {
  var slide = document.getElementById('plans');
  var crawl = slide && slide.querySelector('.crawl-inner');
  if (!crawl) return;
  var duration = parseInt(document.getElementById('impress').getAttribute('data-transition-duration'), 10) || 1000;
  document.addEventListener('impress:stepleave', function (e) {
    if (e.target !== slide) return;
    setTimeout(function () {
      if (slide.classList.contains('active')) return;
      crawl.getAnimations().forEach(function (a) { a.currentTime = 0; });
    }, duration + 100);
  });
})();
