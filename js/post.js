// --- clipboard helper -----------------------------------------------------
function copyText(text, done) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () {});
  } else {
    var tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.style.position = 'fixed';
    tmp.style.left = '-5000px';
    document.body.appendChild(tmp);
    tmp.select();
    try { document.execCommand('copy'); done(); } catch (err) {}
    document.body.removeChild(tmp);
  }
}

// --- Terminal chrome for code blocks --------------------------------------
// Rouge emits two different shapes depending on whether it knows the lexer:
//   * known lexer  -> <div class="language-x highlighter-rouge"><div class="highlight"><pre>
//   * unknown/none -> bare <pre><code class="language-x">
// Normalize both into a single .code-block wrapper with a chrome bar
// (language label + copy button) so every block looks identical.
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
      (lang ? '<span class="code-block__lang">' + lang + '</span>' : '') +
      '<button type="button" class="code-block__copy" aria-label="Copy code">Copy</button>';

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

// --- click handling: copy-code + copy-link --------------------------------
document.addEventListener('click', function (e) {
  // copy a code block
  var copyBtn = e.target.closest('.code-block__copy');
  if (copyBtn) {
    e.preventDefault();
    var block = copyBtn.closest('.code-block');
    var codeEl = block && (block.querySelector('code') || block.querySelector('pre'));
    var text = codeEl ? codeEl.innerText.replace(/\n$/, '') : '';
    copyText(text, function () {
      copyBtn.classList.add('is-copied');
      copyBtn.textContent = 'Copied';
      setTimeout(function () {
        copyBtn.classList.remove('is-copied');
        copyBtn.textContent = 'Copy';
      }, 1500);
    });
    return;
  }

  // copy the article link (share row)
  var linkBtn = e.target.closest('.js-copy-link');
  if (linkBtn) {
    e.preventDefault();
    var url = linkBtn.getAttribute('data-url') || window.location.href;
    copyText(url, function () {
      var original = linkBtn.innerHTML;
      linkBtn.innerHTML = '&#10003;';
      setTimeout(function () { linkBtn.innerHTML = original; }, 1500);
    });
  }
});
