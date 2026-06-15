// Copy-link share button on articles.
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.js-copy-link');
  if (!btn) return;
  e.preventDefault();
  var url = btn.getAttribute('data-url') || window.location.href;
  var done = function () {
    var original = btn.innerHTML;
    btn.innerHTML = '&#10003;';
    setTimeout(function () { btn.innerHTML = original; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, function () {});
  } else {
    var tmp = document.createElement('input');
    tmp.value = url;
    document.body.appendChild(tmp);
    tmp.select();
    try { document.execCommand('copy'); done(); } catch (err) {}
    document.body.removeChild(tmp);
  }
});
