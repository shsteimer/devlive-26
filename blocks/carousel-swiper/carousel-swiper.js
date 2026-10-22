import {
  Swiper, A11y, Keyboard, Navigation, Pagination,
} from '../../vendor/swiper/swiper.js';
import { loadCSS } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

function createSlide(row) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';
  [...row.children].forEach((column, i) => {
    column.className = `carousel-swiper-slide-${i === 0 ? 'image' : 'content'}`;
    slide.append(column);
  });
  return slide;
}

export default async function decorate(block) {
  const [placeholders] = await Promise.all([
    fetchPlaceholders(),
    loadCSS(`${window.hlx.codeBasePath}/vendor/swiper/swiper.css`),
  ]);

  const container = document.createElement('div');
  container.className = 'swiper';
  const wrapper = document.createElement('div');
  wrapper.className = 'swiper-wrapper';
  wrapper.append(...[...block.children].map(createSlide));

  const prevEl = document.createElement('button');
  prevEl.type = 'button';
  prevEl.className = 'swiper-button-prev';
  const nextEl = document.createElement('button');
  nextEl.type = 'button';
  nextEl.className = 'swiper-button-next';
  const paginationEl = document.createElement('div');
  paginationEl.className = 'swiper-pagination';

  container.append(wrapper, prevEl, nextEl, paginationEl);
  block.replaceChildren(container);

  new Swiper(container, {
    modules: [A11y, Keyboard, Navigation, Pagination],
    loop: true,
    keyboard: { enabled: true },
    navigation: { prevEl, nextEl },
    pagination: { el: paginationEl, clickable: true },
    a11y: {
      containerRoleDescriptionMessage: placeholders.carousel || 'Carousel',
      prevSlideMessage: placeholders.previousSlide || 'Previous Slide',
      nextSlideMessage: placeholders.nextSlide || 'Next Slide',
      paginationBulletMessage: `${placeholders.showSlide || 'Show Slide'} {{index}}`,
    },
  });
}
