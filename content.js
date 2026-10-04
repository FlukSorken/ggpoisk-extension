(function () {
  let lastHref = null;

  function addButton() {
    const href = window.location.href;
    if (href === lastHref) return;
    lastHref = href;

    const old = document.querySelector('.ggpoisk-btn');
    if (old) old.remove();

    const url = new URL(href);
    if (!/\/(film|series)\/\d+/.test(url.pathname)) return;

    const btn = document.createElement('a');
    btn.href = `https://kinokino.win${url.pathname}${url.search}`;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.textContent = '▶ Смотреть';
    btn.className = 'ggpoisk-btn';
    btn.title = 'Проверить зеркала и открыть';

    btn.addEventListener('click', async (e) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      if (btn.dataset.loading) return;

      btn.dataset.loading = '1';
      const originalText = btn.textContent;
      btn.textContent = 'Проверяем зеркала…';
      btn.classList.add('loading');

      const newTab = window.open('about:blank', '_blank');

      let target = btn.href;
      try {
        const res = await browser.runtime.sendMessage({
          type: 'resolve-mirror',
          path: url.pathname,
          search: url.search
        });
        if (res && res.url) target = res.url;
      } catch (_) {}

      btn.textContent = originalText;
      btn.classList.remove('loading');
      delete btn.dataset.loading;

      if (newTab) {
        newTab.location.href = target;
      } else {
        window.open(target, '_blank', 'noopener');
      }
    });

    document.body.appendChild(btn);
  }

  addButton();
  setInterval(addButton, 500);
})();