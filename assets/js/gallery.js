const GALLERY_IMAGES = [
  'assets/img/img-72.jpg',
  'assets/img/img-59.jpg',
  'assets/img/img-65.jpg',
  'assets/img/img-47.jpg',
  'assets/img/img-36.jpg',
  'assets/img/img-28.jpg',
  'assets/img/img-23.jpg',
  'assets/img/img-21.jpg',
  'assets/img/img-19-1920x2764.jpg',
  'assets/img/img-12.jpg',
  'assets/img/WhatsApp-Image-2022-10-17-at-8.11.41-AM-1-1920x1440.jpeg',
  'assets/img/WhatsApp-Image-2022-10-17-at-8.11.38-AM-150x150.jpeg'
];

function initGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  GALLERY_IMAGES.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `<img src="${src}" alt="Perla Restaurant - foto ${i + 1}" loading="lazy">`;
    item.addEventListener('click', () => openLightbox(src));
    grid.appendChild(item);
  });

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Închide">&times;</button>
    <img src="" alt="Perla Restaurant">
  `;
  document.body.appendChild(lightbox);

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  function openLightbox(src) {
    lightbox.querySelector('img').src = src;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}
