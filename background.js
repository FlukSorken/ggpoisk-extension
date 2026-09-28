// Порядок проверки: сначала ggpoisk, потом sspoisk
const MIRRORS = ['ggpoisk.ru', 'sspoisk.ru'];
const TIMEOUT_MS = 4000;

async function pingMirror(host, path, search) {
  const url = `https://${host}${path}${search}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      cache: 'no-store',
      credentials: 'omit'
    });

    // 2xx после редиректов (ggpoisk → bulkikim) = зеркало живое
    return res.ok ? url : null;
  } catch (e) {
    // network error / timeout / abort
    return null;
  } finally {
    clearTimeout(timer);
  }
}

browser.runtime.onMessage.addListener(async (msg) => {
  if (!msg || msg.type !== 'resolve-mirror') return;

  const { path, search } = msg;

  for (const host of MIRRORS) {
    const url = await pingMirror(host, path, search);
    if (url) return { url, host, fallback: false };
  }

  // Ничего не ответило — отдаём первый, пусть браузер сам разбирается
  return {
    url: `https://${MIRRORS[0]}${path}${search}`,
    host: MIRRORS[0],
    fallback: true
  };
});