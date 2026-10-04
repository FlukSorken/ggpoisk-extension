// Универсальный доступ к API (на случай Chrome-версии в будущем)
const ext = (typeof browser !== 'undefined') ? browser : chrome;

const DEFAULT_MIRRORS = ['kinokino.win', 'ggpoisk.ru', 'sspoisk.ru'];
const TIMEOUT_MS = 1500;

async function getMirrors() {
  try {
    const data = await ext.storage.local.get('mirrors');
    if (Array.isArray(data.mirrors) && data.mirrors.length > 0) {
      return data.mirrors;
    }
  } catch (_) {}
  return DEFAULT_MIRRORS;
}

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
    return res.ok ? url : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

ext.runtime.onMessage.addListener(async (msg) => {
  if (!msg || msg.type !== 'resolve-mirror') return;

  const { path, search } = msg;
  const mirrors = await getMirrors();

  for (const host of mirrors) {
    const url = await pingMirror(host, path, search);
    if (url) return { url, host, fallback: false };
  }

  // Ничего не ответило — отдаём первый из списка
  return {
    url: `https://${mirrors[0]}${path}${search}`,
    host: mirrors[0],
    fallback: true
  };
});