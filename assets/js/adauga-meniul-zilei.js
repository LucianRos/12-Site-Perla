const MENU_URL = 'data/meniul-zilei.json';
const CONFIG_ENV_URL = 'config.env';
const AUTH_KEY = 'perla_admin_auth';
const API = {
  login: 'api/login.php',
  logout: 'api/logout.php',
  check: 'api/check-auth.php',
  save: 'api/save-meniul-zilei.php',
  facebookText: 'api/facebook-menu-text.php',
  facebookPost: 'api/post-facebook-meniul-zilei.php'
};

const DEFAULT_CATEGORIES = [
  { title: 'Meniu de baza (400 gr/ml)', items: [{ name: '', price: null }] },
  { title: 'Meniu italian (300 gr)', items: [{ name: '', price: null }] },
  { title: 'Meniu fitness (300 gr)', items: [{ name: '', price: null }] },
  { title: 'Salata (150 gr)', items: [{ name: '', price: null }] },
  { title: 'Desert (aprox. 150 gr)', items: [{ name: '', price: null }] }
];

const DAY_NAMES = {
  luni: 'Luni',
  marti: 'Marti',
  miercuri: 'Miercuri',
  joi: 'Joi',
  vineri: 'Vineri'
};

let menuData = null;
let activeDayIndex = 0;
let usePhpBackend = null;

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function detectPhpBackend() {
  if (usePhpBackend !== null) return usePhpBackend;
  try {
    const res = await fetch(API.check, { credentials: 'same-origin' });
    const data = await parseJsonResponse(res);
    usePhpBackend = data !== null && typeof data.authenticated === 'boolean';
  } catch {
    usePhpBackend = false;
  }
  return usePhpBackend;
}

function parseEnvFile(text) {
  const vars = {};
  text.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return vars;
}

async function loadPasswordFromEnv() {
  const res = await fetch(CONFIG_ENV_URL);
  if (!res.ok) throw new Error('Nu s-a putut citi config.env');
  const vars = parseEnvFile(await res.text());
  if (!vars.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD lipseste din config.env');
  return vars.ADMIN_PASSWORD;
}

function isAuthenticatedLocal() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function setAuthenticatedLocal(value) {
  if (value) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

async function checkAuth() {
  if (await detectPhpBackend()) {
    try {
      const res = await fetch(API.check, { credentials: 'same-origin' });
      const data = await parseJsonResponse(res);
      return data?.authenticated === true;
    } catch {
      return false;
    }
  }
  return isAuthenticatedLocal();
}

async function login(password) {
  if (await detectPhpBackend()) {
    const res = await fetch(API.login, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await parseJsonResponse(res);
    if (!data) throw new Error('Serverul PHP nu raspunde. Folosesc modul local (Live Server).');
    if (!res.ok) throw new Error(data.error || 'Parola incorecta');
    return;
  }

  const expected = await loadPasswordFromEnv();
  if (password !== expected) throw new Error('Parola incorecta');
  setAuthenticatedLocal(true);
}

async function logout() {
  if (await detectPhpBackend()) {
    try {
      await fetch(API.logout, { method: 'POST', credentials: 'same-origin' });
    } catch { /* ignore */ }
  }
  setAuthenticatedLocal(false);
}

function cloneDefaults() {
  return DEFAULT_CATEGORIES.map(cat => ({
    title: cat.title,
    items: cat.items.map(item => ({ ...item }))
  }));
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function showLogin() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('editor-section').style.display = 'none';
}

function showEditor() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('editor-section').style.display = 'block';
  document.getElementById('order-phone').value = menuData.orderPhone || '';
  renderEditor();
}

function normalizeKey(name) {
  return (name || '').trim().toLowerCase();
}

function buildProductCatalog(data) {
  const map = new Map();

  (data.productCatalog || []).forEach(product => {
    const name = (product.name || '').trim();
    if (!name) return;
    map.set(normalizeKey(name), { name, price: product.price ?? null });
  });

  data.days.forEach(day => {
    day.categories.forEach(cat => {
      cat.items.forEach(item => {
        const name = (item.name || '').trim();
        if (!name) return;
        const key = normalizeKey(name);
        const price = item.price ?? null;
        if (!map.has(key)) {
          map.set(key, { name, price });
        } else if (price != null) {
          map.set(key, { name, price });
        }
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ro'));
}

function syncProductCatalog() {
  menuData.productCatalog = buildProductCatalog(menuData);
  updateCatalogCount();
}

function addProductToCatalog(name, price) {
  const trimmed = (name || '').trim();
  if (!trimmed || !menuData) return;

  if (!menuData.productCatalog) menuData.productCatalog = [];
  const key = normalizeKey(trimmed);
  const existing = menuData.productCatalog.find(p => normalizeKey(p.name) === key);
  if (existing) {
    if (price != null) existing.price = price;
  } else {
    menuData.productCatalog.push({ name: trimmed, price: price ?? null });
  }

  menuData.productCatalog.sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  updateCatalogCount();
}

function updateCatalogCount() {
  const el = document.getElementById('catalog-count');
  if (!el || !menuData?.productCatalog) return;
  const count = menuData.productCatalog.length;
  el.textContent = `${count} produse salvate in lista — scrie numele preparatului pentru sugestii autocomplete`;
}

function filterProductCatalog(query) {
  const catalog = menuData?.productCatalog || [];
  const q = query.trim().toLowerCase();
  if (!q) return catalog.slice(0, 15);
  return catalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 15);
}

function bindProductAutocomplete(wrap) {
  const input = wrap.querySelector('[data-field="name"]');
  const list = wrap.querySelector('.autocomplete-list');
  const priceInput = wrap.closest('.admin-item')?.querySelector('[data-field="price"]');
  let activeIndex = -1;

  function hideList() {
    list.hidden = true;
    list.innerHTML = '';
    activeIndex = -1;
  }

  function renderList(items) {
    if (!items.length) {
      hideList();
      return;
    }
    list.innerHTML = items.map((product, i) => `
      <li data-index="${i}" class="${i === activeIndex ? 'active' : ''}">
        <span>${escapeAttr(product.name)}</span>
        ${product.price != null ? `<span class="ac-price">${product.price} lei</span>` : ''}
      </li>
    `).join('');
    list.hidden = false;
  }

  function selectProduct(product) {
    input.value = product.name;
    if (priceInput && product.price != null) priceInput.value = product.price;
    syncFromDOM();
    addProductToCatalog(product.name, product.price);
    hideList();
  }

  input.addEventListener('input', () => renderList(filterProductCatalog(input.value)));
  input.addEventListener('focus', () => renderList(filterProductCatalog(input.value)));

  input.addEventListener('blur', () => {
    setTimeout(() => {
      hideList();
      const name = input.value.trim();
      if (name) {
        const price = priceInput?.value === '' ? null : parseFloat(priceInput.value);
        addProductToCatalog(name, price);
        syncFromDOM();
      }
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('li');
    if (list.hidden || !items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      renderList(filterProductCatalog(input.value));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderList(filterProductCatalog(input.value));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const filtered = filterProductCatalog(input.value);
      if (filtered[activeIndex]) selectProduct(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      hideList();
    }
  });

  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const li = e.target.closest('li');
    if (!li) return;
    const filtered = filterProductCatalog(input.value);
    const product = filtered[parseInt(li.dataset.index)];
    if (product) selectProduct(product);
  });
}

async function loadMenuData() {
  const res = await fetch(MENU_URL);
  if (!res.ok) throw new Error('Nu s-a putut incarca meniul');
  menuData = await res.json();
  ensureDayCategories();
  if (!menuData.productCatalog || menuData.productCatalog.length === 0) {
    menuData.productCatalog = buildProductCatalog(menuData);
  }
  updateCatalogCount();
}

function ensureDayCategories() {
  menuData.days.forEach(day => {
    if (!Array.isArray(day.categories) || day.categories.length === 0) {
      day.categories = cloneDefaults();
    }
  });
}

function syncGlobalFields() {
  menuData.orderPhone = document.getElementById('order-phone').value.trim();
}

function getDayDisplayName(day) {
  return DAY_NAMES[day.id] || day.id || 'Zi';
}

function parseDateFromLabel(label) {
  const match = (label || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function buildDayLabel(dayId, isoDate) {
  const dayName = DAY_NAMES[dayId] || dayId;
  if (!isoDate) return dayName;
  const [year, month, day] = isoDate.split('-');
  return `${dayName} ${parseInt(day, 10)}.${parseInt(month, 10)}.${year}`;
}

function syncDayLabelFromDOM() {
  const dateInput = document.querySelector('[data-field="day-date"]');
  const day = menuData?.days?.[activeDayIndex];
  if (!day) return;
  day.label = buildDayLabel(day.id, dateInput?.value || '');
}

function updateActiveDayTabLabel() {
  const tab = document.querySelector(`.admin-day-tab[data-index="${activeDayIndex}"]`);
  if (tab && menuData?.days?.[activeDayIndex]) {
    tab.textContent = menuData.days[activeDayIndex].label || `Zi ${activeDayIndex + 1}`;
  }
}

function syncFromDOM() {
  syncDayLabelFromDOM();
  const day = menuData.days[activeDayIndex];
  document.querySelectorAll('.admin-category').forEach(catEl => {
    const catIndex = parseInt(catEl.dataset.cat);
    const titleInput = catEl.querySelector('[data-field="title"]');
    if (titleInput) day.categories[catIndex].title = titleInput.value;

    catEl.querySelectorAll('.admin-item').forEach(itemEl => {
      const itemIndex = parseInt(itemEl.dataset.item);
      const nameInput = itemEl.querySelector('[data-field="name"]');
      const priceInput = itemEl.querySelector('[data-field="price"]');
      const item = day.categories[catIndex].items[itemIndex];
      if (nameInput) item.name = nameInput.value;
      if (priceInput) {
        item.price = priceInput.value === '' ? null : parseFloat(priceInput.value);
      }
    });
  });
}

function renderDayTabs() {
  const el = document.getElementById('admin-day-tabs');
  el.innerHTML = menuData.days.map((day, i) =>
    `<button type="button" class="admin-day-tab${i === activeDayIndex ? ' active' : ''}" data-index="${i}">${day.label}</button>`
  ).join('');
  el.querySelectorAll('.admin-day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      syncFromDOM();
      syncGlobalFields();
      activeDayIndex = parseInt(btn.dataset.index);
      renderEditor();
    });
  });
}

function renderCategory(cat, catIndex) {
  return `
    <div class="admin-category" data-cat="${catIndex}">
      <div class="admin-category-header">
        <input type="text" value="${escapeAttr(cat.title)}" data-field="title" placeholder="Titlu categorie">
        <button type="button" class="admin-btn admin-btn-danger" data-action="delete-category" data-cat="${catIndex}">Sterge categorie</button>
      </div>
      <div class="admin-items">
        ${cat.items.map((item, itemIndex) => `
          <div class="admin-item" data-cat="${catIndex}" data-item="${itemIndex}">
            <div class="autocomplete-wrap">
              <input type="text" value="${escapeAttr(item.name)}" data-field="name" placeholder="Preparat — scrie sau selecteaza" autocomplete="off">
              <ul class="autocomplete-list" hidden></ul>
            </div>
            <input type="number" value="${item.price ?? ''}" data-field="price" placeholder="Pret (lei)" min="0" step="1">
            <button type="button" class="admin-btn admin-btn-danger" data-action="delete-item" data-cat="${catIndex}" data-item="${itemIndex}">×</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="admin-btn" data-action="add-item" data-cat="${catIndex}">+ Adauga preparat</button>
    </div>
  `;
}

function renderEditor() {
  renderDayTabs();
  const day = menuData.days[activeDayIndex];
  const dayName = getDayDisplayName(day);
  const isoDate = parseDateFromLabel(day.label);
  document.getElementById('admin-day-label').innerHTML = `
    <label for="day-date-input">Data meniului (afisat pe site)</label>
    <div class="admin-day-label-row">
      <span class="admin-day-name">${escapeAttr(dayName)}</span>
      <input type="date" id="day-date-input" data-field="day-date" value="${escapeAttr(isoDate)}">
    </div>
  `;
  document.getElementById('admin-categories').innerHTML =
    day.categories.map((cat, i) => renderCategory(cat, i)).join('');
  bindEditorEvents();
}

function bindEditorEvents() {
  document.querySelectorAll('.admin-item .autocomplete-wrap').forEach(bindProductAutocomplete);

  const dateInput = document.querySelector('[data-field="day-date"]');
  if (dateInput) {
    dateInput.addEventListener('input', () => {
      syncDayLabelFromDOM();
      updateActiveDayTabLabel();
    });
    dateInput.addEventListener('change', () => {
      syncDayLabelFromDOM();
      updateActiveDayTabLabel();
    });
  }

  document.getElementById('admin-categories').querySelectorAll('input[data-field="title"], input[data-field="price"]').forEach(input => {
    input.addEventListener('input', syncFromDOM);
    input.addEventListener('change', syncFromDOM);
  });

  document.getElementById('admin-categories').querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      syncFromDOM();
      const action = btn.dataset.action;
      const catIndex = parseInt(btn.dataset.cat);
      const itemIndex = parseInt(btn.dataset.item);

      if (action === 'delete-category') {
        if (confirm('Stergi aceasta categorie?')) {
          menuData.days[activeDayIndex].categories.splice(catIndex, 1);
        }
      } else if (action === 'delete-item') {
        menuData.days[activeDayIndex].categories[catIndex].items.splice(itemIndex, 1);
      } else if (action === 'add-item') {
        menuData.days[activeDayIndex].categories[catIndex].items.push({ name: '', price: null });
      }
      renderEditor();
    });
  });
}

function resetCategoriesToDefault() {
  if (!confirm('Inlocuiesti categoriile zilei curente cu cele implicite?')) return;
  syncFromDOM();
  menuData.days[activeDayIndex].categories = cloneDefaults();
  renderEditor();
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.days || !Array.isArray(data.days)) throw new Error('JSON invalid');
      menuData = data;
      ensureDayCategories();
      if (!menuData.productCatalog) menuData.productCatalog = buildProductCatalog(menuData);
      activeDayIndex = 0;
      showMessage('JSON importat cu succes. Verifica datele si apasa Salveaza.', 'success');
      showEditor();
    } catch (err) {
      showMessage('Fisier JSON invalid: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function downloadMenuJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meniul-zilei.json';
  a.click();
  URL.revokeObjectURL(url);
}

function showMessage(text, type) {
  const msgEl = document.getElementById('admin-message');
  msgEl.textContent = text;
  msgEl.className = type === 'error' ? 'admin-error' : 'admin-success';
}

async function copyFacebookMenuText() {
  if (!(await detectPhpBackend())) {
    showMessage('Copierea textului Facebook necesita PHP pe server.', 'error');
    return;
  }
  try {
    const res = await fetch(API.facebookText, { credentials: 'same-origin' });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data?.error || 'Eroare');
    await navigator.clipboard.writeText(data.text);
    showMessage('Text copiat pentru Facebook. Lipeste in Meta Business Suite.', 'success');
  } catch (err) {
    showMessage(err.message || 'Nu s-a putut copia textul', 'error');
  }
}

async function postFacebookMenu(force = false) {
  if (!(await detectPhpBackend())) {
    showMessage('Postarea pe Facebook necesita PHP pe server.', 'error');
    return;
  }
  if (!force && !confirm('Postezi meniul zilei pe pagina Facebook Perla?')) return;

  try {
    const url = force ? `${API.facebookPost}?force=1` : API.facebookPost;
    const res = await fetch(url, { method: 'POST', credentials: 'same-origin' });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data?.error || 'Eroare la postare');

    if (data.skipped) {
      showMessage(data.reason || 'Postare omisa.', 'success');
      return;
    }
    showMessage(`Postat pe Facebook: ${data.label}`, 'success');
  } catch (err) {
    showMessage(err.message || 'Nu s-a putut posta pe Facebook', 'error');
  }
}

async function saveMenu() {
  syncFromDOM();
  syncGlobalFields();
  syncProductCatalog();
  menuData.updatedAt = new Date().toISOString();

  document.getElementById('admin-message').textContent = '';
  document.getElementById('admin-message').className = '';

  if (await detectPhpBackend()) {
    try {
      const res = await fetch(API.save, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData)
      });
      const data = await parseJsonResponse(res);
      if (!data) throw new Error('no-php');
      if (!res.ok) {
        showMessage(data.error || 'Eroare la salvare', 'error');
        return;
      }
      menuData.updatedAt = data.updatedAt;
      showMessage(`Meniul a fost salvat (${new Date(data.updatedAt).toLocaleString('ro-RO')})`, 'success');
      return;
    } catch {
      /* fall through to download */
    }
  }

  downloadMenuJson(menuData);
  showMessage(
    'Fisierul meniul-zilei.json a fost descarcat. Inlocuieste manual fisierul din folderul data/ (Live Server nu poate salva direct pe disc).',
    'success'
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  try {
    if (await checkAuth()) {
      await loadMenuData();
      showEditor();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    try {
      await login(document.getElementById('password').value);
      await loadMenuData();
      showEditor();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  document.getElementById('reset-categories').addEventListener('click', resetCategoriesToDefault);
  document.getElementById('add-category').addEventListener('click', () => {
    syncFromDOM();
    menuData.days[activeDayIndex].categories.push({ title: 'Categorie noua', items: [{ name: '', price: null }] });
    renderEditor();
  });
  document.getElementById('import-json').addEventListener('change', (e) => {
    if (e.target.files[0]) importJsonFile(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('save-menu').addEventListener('click', saveMenu);
  document.getElementById('copy-facebook').addEventListener('click', copyFacebookMenuText);
  document.getElementById('post-facebook').addEventListener('click', () => postFacebookMenu(false));
  document.getElementById('logout').addEventListener('click', async () => {
    await logout();
    menuData = null;
    showLogin();
  });
});
