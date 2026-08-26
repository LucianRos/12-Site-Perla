const DAY_IDS = ['luni', 'marti', 'miercuri', 'joi', 'vineri'];
let menuData = null;

function getTodayDayId() {
  const day = new Date().getDay();
  if (day >= 1 && day <= 5) return DAY_IDS[day - 1];
  return 'luni';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ro-RO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

function getDayPreview(day) {
  const firstCategory = day.categories[0];
  if (!firstCategory?.items?.length) return 'Apasa pentru a vedea meniul';
  const preview = firstCategory.items.slice(0, 2).map(i => i.name).join(', ');
  return preview.length > 60 ? preview.slice(0, 57) + '...' : preview;
}

function renderDayCards(activeDayId) {
  const cardsEl = document.getElementById('menu-day-cards');
  const todayId = getTodayDayId();

  cardsEl.innerHTML = menuData.days.map(day => {
    const isActive = day.id === activeDayId;
    const isToday = day.id === todayId;
    return `
      <button type="button"
        class="menu-day-card${isActive ? ' active' : ''}${isToday ? ' today' : ''}"
        data-day="${day.id}"
        aria-pressed="${isActive}">
        <span class="menu-day-card-label">${day.label}</span>
        ${isToday ? '<span class="menu-day-card-badge">Astazi</span>' : ''}
        <span class="menu-day-card-preview">${getDayPreview(day)}</span>
      </button>
    `;
  }).join('');

  cardsEl.querySelectorAll('.menu-day-card').forEach(card => {
    card.addEventListener('click', () => selectDay(card.dataset.day));
  });
}

function renderDayMenu(day) {
  const detailEl = document.getElementById('menu-detail');
  const titleEl = document.getElementById('menu-detail-title');
  const contentEl = document.getElementById('menu-content');

  titleEl.textContent = day.label;
  contentEl.innerHTML = day.categories.map(cat => `
    <div class="menu-category">
      <h3>${cat.title}</h3>
      ${cat.items.map(item => `
        <div class="menu-item">
          <span class="menu-item-name">${item.name}</span>
          ${item.price != null ? `<span class="menu-item-price">${item.price} lei</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  detailEl.hidden = false;
  detailEl.classList.add('visible');
}

function selectDay(dayId, shouldScroll = true) {
  const day = menuData.days.find(d => d.id === dayId);
  if (!day) return;

  renderDayCards(dayId);
  renderDayMenu(day);

  if (shouldScroll) {
    const detail = document.getElementById('menu-detail');
    const top = detail.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '80', 10) - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}

function initPage(data) {
  menuData = data;

  const phoneEl = document.getElementById('menu-phone');
  const updatedEl = document.getElementById('menu-updated');

  if (phoneEl && data.orderPhone) {
    phoneEl.innerHTML = `Telefon comenzi: <a href="tel:${data.orderPhone}">${formatPhone(data.orderPhone)}</a>`;
  }
  if (updatedEl) {
    updatedEl.textContent = data.updatedAt ? `Ultima actualizare: ${formatDate(data.updatedAt)}` : '';
  }

  document.getElementById('menu-loading')?.remove();
  selectDay(getTodayDayId(), false);
}

async function loadMenu() {
  const cardsEl = document.getElementById('menu-day-cards');
  try {
    const res = await fetch('data/meniul-zilei.json');
    if (!res.ok) throw new Error('Eroare la incarcarea meniului');
    initPage(await res.json());
  } catch {
    document.getElementById('menu-loading')?.remove();
    cardsEl.innerHTML = `<p class="menu-error">Nu s-a putut incarca meniul. Deschideti site-ul printr-un server local (Live Server sau python -m http.server).</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadMenu);
