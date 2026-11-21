(function () {
  var input = document.querySelector('form input[name="q"]');
  if (!input) return;
  var form = input.closest('form');

  function norm(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  var cards = [];
  [].slice.call(document.querySelectorAll('a[href^="entradas/"]')).forEach(function (a) {
    var c = a.closest('[class~="col"], [class*="col-"]') || a.closest('article, .card');
    if (c && cards.indexOf(c) < 0) cards.push(c);
  });
  if (!cards.length) return;

  var vacio = document.createElement('p');
  vacio.textContent = 'No se encontraron entradas con esa busqueda.';
  vacio.style.display = 'none';
  vacio.className = 'text-center my-4';
  cards[0].parentNode.appendChild(vacio);

  var pag = document.querySelector('.pagination');
  var pagBox = pag ? (pag.closest('nav') || pag) : null;

  function filtrar() {
    var q = norm(input.value.trim());
    var visibles = 0;
    cards.forEach(function (c) {
      var ok = !q || norm(c.textContent).indexOf(q) !== -1;
      c.style.display = ok ? '' : 'none';
      if (ok) visibles++;
    });
    vacio.style.display = visibles ? 'none' : '';
    if (pagBox) pagBox.style.display = q ? 'none' : '';
  }

  input.addEventListener('input', filtrar);
  form.addEventListener('submit', function (e) { e.preventDefault(); filtrar(); });

  var inicial = new URLSearchParams(location.search).get('q');
  if (inicial) { input.value = inicial; filtrar(); }
})();
