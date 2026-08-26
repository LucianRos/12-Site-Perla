const GALLERY_IMAGES = [
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-75-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-72-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-66-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-63-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-59-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-53-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-50-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-46-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-36-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-44-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-26-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-23-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-22-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-21-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-20-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-19-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/img-18-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.41-AM.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.40-AM.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.38-AM.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.40-AM-1.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.39-AM-1.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2022/10/WhatsApp-Image-2022-10-17-at-8.11.39-AM.jpeg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/03/041-042-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/03/035-036-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/03/029-030-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/03/021-022-scaled.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/11/rev1.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/11/rev2.jpg',
  'https://perla-restaurant.ro/wp-content/uploads/2023/11/rev3.jpg'
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
