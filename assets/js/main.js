async function loadComponent(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (res.ok) el.innerHTML = await res.text();
  } catch (e) {
    console.warn(`Could not load ${url}`);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadComponent('site-header', '/components/header.html'),
    loadComponent('site-footer', '/components/footer.html')
  ]);

  initNavigation();
  if (typeof initGallery === 'function') initGallery();
});

function initNavigation() {
  const header = document.getElementById('header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  const dropdown = document.querySelector('.nav-dropdown');

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  dropdownToggle?.addEventListener('click', () => {
    dropdown?.classList.toggle('open');
    const open = dropdownToggle.getAttribute('aria-expanded') === 'true';
    dropdownToggle.setAttribute('aria-expanded', !open);
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('open');
      navToggle?.classList.remove('active');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === page) link.classList.add('active');
    });
  }
}
