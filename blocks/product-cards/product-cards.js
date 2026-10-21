import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { getPictures } from '../../scripts/shared.js';

function buildCard(row) {
  const [imageCol, nameCol, categoryCol, priceCol, badgeCol] = [...row.children];
  const li = document.createElement('li');
  li.className = 'product-card';

  const media = document.createElement('div');
  media.className = 'product-card-image';
  const [picture] = getPictures(imageCol);
  if (picture) media.append(picture);
  const badge = badgeCol?.textContent.trim();
  if (badge) {
    const span = document.createElement('span');
    span.className = 'product-card-badge';
    span.textContent = badge;
    media.append(span);
  }

  const body = document.createElement('div');
  body.className = 'product-card-body';
  const link = nameCol?.querySelector('a');
  const name = document.createElement('h3');
  if (link) {
    link.className = '';
    link.closest('.button-container')?.replaceWith(link);
    name.append(link);
  } else {
    name.textContent = nameCol?.textContent.trim() || '';
  }
  body.append(name);
  [[categoryCol, 'product-card-category'], [priceCol, 'product-card-price']].forEach(([col, cls]) => {
    const text = col?.textContent.trim();
    if (!text) return;
    const p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    body.append(p);
  });

  li.append(media, body);
  return li;
}

function scrollByPage(list, dir) {
  list.scrollBy({ left: dir * list.clientWidth * 0.9, behavior: 'smooth' });
}

export default async function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => ul.append(buildCard(row)));
  block.replaceChildren(ul);

  if (block.classList.contains('carousel')) {
    const placeholders = await fetchPlaceholders();
    const nav = document.createElement('div');
    nav.className = 'product-cards-nav';
    [['prev', -1, placeholders.previous || 'Previous'], ['next', 1, placeholders.next || 'Next']].forEach(([cls, dir, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `product-cards-${cls}`;
      button.setAttribute('aria-label', label);
      button.addEventListener('click', () => scrollByPage(ul, dir));
      nav.append(button);
    });
    block.append(nav);
  }
}
