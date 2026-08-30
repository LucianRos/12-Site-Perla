let menuData = null;

function parseDayDate(label) {
  const match = label.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDayToday(day) {
  const dayDate = parseDayDate(day.label);
  if (!dayDate) return false;
  const today = getTodayDate();
  return dayDate.getTime() === today.getTime();
}

function getTodayDayId(days) {
  return days.find(isDayToday)?.id ?? null;
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

function renderDayCards(activeDayId) {
  const cardsEl = document.getElementById('menu-day-cards');

  cardsEl.innerHTML = menuData.days.map(day => {
    const isActive = day.id === activeDayId;
    const isToday = isDayToday(day);
    return `
      <button type="button"
        class="menu-day-card${isActive ? ' active' : ''}${isToday ? ' today' : ''}"
        data-day="${day.id}"
        aria-pressed="${isActive}">
        <span class="menu-day-card-label">${day.label}</span>
        ${isToday ? '<span class="menu-day-card-badge">Astazi</span>' : ''}
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
  const todayId = getTodayDayId(menuData.days);
  selectDay(todayId || menuData.days[0]?.id, false);
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
