(function () {
  var parts = location.pathname.split('/').filter(Boolean);
  var pages = ['contact', 'evenimente', 'meniu-nunti', 'meniu-2', 'catering', 'meniul-zilei', 'galerie-photo', 'adauga-meniul-zilei', 'politica-confidentialitate'];
  var base = '/';
  if (parts.length && pages.indexOf(parts[0]) === -1 && parts[0] !== 'index.html') {
    base = '/' + parts[0] + '/';
  }
  var el = document.createElement('base');
  el.href = base;
  document.head.insertBefore(el, document.head.firstChild);
})();
