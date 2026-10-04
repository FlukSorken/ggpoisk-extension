const ext = (typeof browser !== 'undefined') ? browser : chrome;

const DEFAULT_MIRRORS = ['kinokino.win', 'ggpoisk.ru', 'sspoisk.ru'];
// Эти домены уже прописаны в host_permissions манифеста,
// для них разрешение запрашивать не нужно.
const BUILTIN_HOSTS = ['kinokino.win', 'ggpoisk.ru', 'sspoisk.ru'];

const textarea = document.getElementById('mirrors');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const statusEl = document.getElementById('status');

function showStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
  if (!isError) {
    setTimeout(() => {
      if (statusEl.textContent === text) statusEl.textContent = '';
    }, 2500);
  }
}

function parseMirrors(text) {
  const seen = new Set();
  const result = [];
  for (const line of text.split('\n')) {
    let host = line.trim().toLowerCase();
    if (!host) continue;
    host = host.replace(/^https?:\/\//, '');   // убираем протокол
    host = host.replace(/\/.*$/, '');          // убираем путь
    host = host.replace(/:\d+$/, '');          // убираем порт
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) continue;
    if (seen.has(host)) continue;
    seen.add(host);
    result.push(host);
  }
  return result;
}

function needsNewPermission(mirrors) {
  return mirrors.some(h => !BUILTIN_HOSTS.some(b => h === b || h.endsWith('.' + b)));
}

async function load() {
  let mirrors = DEFAULT_MIRRORS;
  try {
    const data = await ext.storage.local.get('mirrors');
    if (Array.isArray(data.mirrors) && data.mirrors.length > 0) {
      mirrors = data.mirrors;
    }
  } catch (_) {}
  textarea.value = mirrors.join('\n');
}

async function save() {
  const mirrors = parseMirrors(textarea.value);
  if (mirrors.length === 0) {
    showStatus('Нужно указать хотя бы одно зеркало.', true);
    return;
  }

  // Если среди зеркал есть нестандартные — запрашиваем разрешение
  if (needsNewPermission(mirrors)) {
    try {
      const granted = await ext.permissions.request({ origins: ['*://*/*'] });
      if (!granted) {
        // Не блокируем сохранение — просто предупреждаем
        await ext.storage.local.set({ mirrors });
        showStatus('Сохранено, но без разрешения проверка новых зеркал может не работать.', true);
        return;
      }
    } catch (_) {
      // permissions API недоступен — сохраняем как есть
    }
  }

  await ext.storage.local.set({ mirrors });
  showStatus('Сохранено.');
}

saveBtn.addEventListener('click', save);

resetBtn.addEventListener('click', async () => {
  textarea.value = DEFAULT_MIRRORS.join('\n');
  await ext.storage.local.set({ mirrors: DEFAULT_MIRRORS });
  showStatus('Сброшено по умолчанию.');
});

load();