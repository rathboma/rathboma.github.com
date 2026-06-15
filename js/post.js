// --- Terminal chrome for code blocks --------------------------------------
// Rouge emits two different shapes depending on whether it knows the lexer:
//   * known lexer  -> <div class="language-x highlighter-rouge"><div class="highlight"><pre>
//   * unknown/none -> bare <pre><code class="language-x">
// Normalize both into a single .code-block wrapper with a chrome bar
// (traffic-light dots + language label) so every block looks identical.
function decorateCodeBlocks() {
  var body = document.querySelector('.article-body');
  if (!body) return;

  var blocks = body.querySelectorAll('div.highlighter-rouge, figure.highlight, pre');
  Array.prototype.forEach.call(blocks, function (block) {
    // already wrapped, or a <pre> that lives inside a wrapper we'll handle
    if (block.closest('.code-block')) return;
    if (block.tagName === 'PRE' && block.closest('.highlighter-rouge, figure.highlight')) return;

    var langEl = block.matches('[class*="language-"]')
      ? block
      : block.querySelector('[class*="language-"]');
    var match = langEl && langEl.className.match(/language-([\w#+.-]+)/);
    var lang = match ? match[1] : '';
    if (lang === 'plaintext' || lang === 'text' || lang === 'plain') lang = '';

    var wrap = document.createElement('div');
    wrap.className = 'code-block';

    var bar = document.createElement('div');
    bar.className = 'code-block__bar';
    bar.innerHTML =
      '<span class="code-block__dot code-block__dot--r"></span>' +
      '<span class="code-block__dot code-block__dot--y"></span>' +
      '<span class="code-block__dot code-block__dot--g"></span>' +
      (lang ? '<span class="code-block__lang">' + lang + '</span>' : '');

    block.parentNode.insertBefore(wrap, block);
    wrap.appendChild(bar);
    wrap.appendChild(block);
  });
}

if (document.readyState !== 'loading') {
  decorateCodeBlocks();
} else {
  document.addEventListener('DOMContentLoaded', decorateCodeBlocks);
}

// --- Copy-link share button -----------------------------------------------
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
