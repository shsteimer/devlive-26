import { getPictures } from '../../scripts/shared.js';

export default function decorate(block) {
  const [picture] = getPictures(block);
  const content = document.createElement('div');
  content.className = 'hero-content';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    content.append(...[...cell.childNodes].filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.contains(picture))));
  });
  content.querySelectorAll('p:empty').forEach((p) => p.remove());

  const row = document.createElement('div');
  if (picture) {
    const media = document.createElement('div');
    media.className = 'hero-media';
    media.append(picture);
    row.append(media);
  } else {
    block.classList.add('no-image');
  }
  row.append(content);
  block.replaceChildren(row);
}
