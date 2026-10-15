// Tekir Studios site: language toggle, mobile menu, copy buttons. No dependencies.
(function () {
  var root = document.documentElement;
  var KEY = 'tekir.lang';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ }
  }
  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-set-lang') === lang));
    }
  }

  // Single-language pages (legal) pin their language with data-fixed-lang.
  if (!root.hasAttribute('data-fixed-lang')) {
    var nav = (navigator.language || 'en').toLowerCase();
    apply(stored() || (nav.indexOf('tr') === 0 ? 'tr' : 'en'));
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-set-lang],[data-menu],[data-copy]') : null;
    if (!t) return;
    if (t.hasAttribute('data-set-lang')) {
      var lang = t.getAttribute('data-set-lang');
      store(lang);
      apply(lang);
    } else if (t.hasAttribute('data-menu')) {
      var navEl = document.querySelector('.nav');
      var open = navEl.classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
    } else if (t.hasAttribute('data-copy')) {
      var text = t.getAttribute('data-copy');
      var done = function () { t.textContent = t.getAttribute('data-done') || '✓'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectSibling(t); });
      } else {
        selectSibling(t);
      }
    }
  });

  function selectSibling(btn) {
    var code = btn.parentNode.querySelector('code');
    if (!code) return;
    var range = document.createRange();
    range.selectNodeContents(code);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
})();
