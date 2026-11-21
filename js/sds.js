(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Barra superior: sombra al hacer scroll */
  var nav = document.querySelector('.sds-nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Red de sensores (canvas): nodos que se conectan y paquetes de datos que viajan */
  function initMesh(cv) {
    var ctx = cv.getContext('2d');
    var w = 0, h = 0, nodes = [], packets = [], raf = 0, running = false;
    function size() {
      var r = cv.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(46, Math.max(16, (w * h) / 22000)));
      nodes = []; packets = [];
      for (var i = 0; i < n; i++) {
        nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .18,
          vy: (Math.random() - .5) * .18, r: 1.6 + Math.random() * 1.8, p: Math.random() * 6.28 });
      }
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var md = Math.min(170, Math.max(110, w / 7)), edges = [], i, j, a, b, d;
      if (!reduce) {
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i]; a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
      }
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i]; b = nodes[j];
          d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < md) {
            edges.push([i, j]);
            ctx.strokeStyle = 'rgba(141,198,63,' + (0.24 * (1 - d / md)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var pulse = reduce ? 0 : (Math.sin(t / 900 + a.p) + 1) / 2;
        ctx.fillStyle = 'rgba(141,198,63,' + (0.55 + 0.35 * pulse) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + pulse * 0.6, 0, 6.283); ctx.fill();
      }
      if (!reduce) {
        if (edges.length && packets.length < 9 && Math.random() < 0.04) {
          var e = edges[(Math.random() * edges.length) | 0];
          packets.push({ a: e[0], b: e[1], t: 0 });
        }
        packets = packets.filter(function (p) {
          p.t += 0.018;
          if (p.t >= 1) return false;
          var A = nodes[p.a], B = nodes[p.b];
          var x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
          var g = ctx.createRadialGradient(x, y, 0, x, y, 9);
          g.addColorStop(0, 'rgba(183,227,106,.95)'); g.addColorStop(1, 'rgba(183,227,106,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
          return true;
        });
      }
    }
    function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(cv);
    } else { start(); }
  }
  document.querySelectorAll('canvas[data-mesh]').forEach(initMesh);

  /* Cronograma: selector de día (abre el día de hoy si coincide con la semana) */
  document.querySelectorAll('[data-days]').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[data-day]'));
    var panels = [].slice.call(root.querySelectorAll('[data-panel]'));
    function show(id) {
      tabs.forEach(function (t) {
        var on = t.dataset.day === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== id; });
    }
    var d = new Date();
    var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var today = tabs.filter(function (t) { return t.dataset.day === iso; })[0];
    if (today) today.classList.add('is-today');
    show((today || tabs[0]).dataset.day);
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.day); }); });
  });

  /* Galería: visor ampliado */
  var lb = document.createElement('div');
  lb.className = 'lightbox'; lb.hidden = true;
  lb.innerHTML = '<button class="lb-close" type="button" aria-label="Cerrar">&times;</button><img alt=""><p></p>';
  document.body.appendChild(lb);
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-lightbox]');
    if (a) {
      e.preventDefault();
      lb.querySelector('img').src = a.href;
      lb.querySelector('p').textContent = a.dataset.caption || '';
      lb.hidden = false; document.body.style.overflow = 'hidden';
      return;
    }
    if (!lb.hidden && (e.target === lb || e.target.closest('.lb-close'))) closeLb();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* Avisos: se cierran solos */
  document.querySelectorAll('[data-toast]').forEach(function (t, i) {
    setTimeout(function () {
      t.classList.add('is-leaving');
      setTimeout(function () { t.remove(); }, 350);
    }, 4500 + i * 600);
  });

  /* Vista previa de imágenes elegidas en los formularios */
  document.querySelectorAll('input[type=file][data-preview]').forEach(function (inp) {
    var box = document.querySelector(inp.dataset.preview);
    if (!box) return;
    inp.addEventListener('change', function () {
      box.innerHTML = '';
      [].slice.call(inp.files, 0, 12).forEach(function (f) {
        if (f.type.indexOf('image/') !== 0) return;
        var img = document.createElement('img');
        img.src = URL.createObjectURL(f); img.alt = f.name;
        box.appendChild(img);
      });
    });
  });

  /* Barras de progreso del panel */
  document.querySelectorAll('.meter i[data-w]').forEach(function (m) {
    requestAnimationFrame(function () { m.style.width = m.dataset.w + '%'; });
  });
})();
