import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    const links = li.querySelectorAll('.cards-card-body a[href]');
    if (links.length) {
      li.classList.add('cards-card-linked');
      links[links.length - 1].classList.add('cards-card-link');
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    if (new URL(img.src, window.location).origin !== window.location.origin) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
