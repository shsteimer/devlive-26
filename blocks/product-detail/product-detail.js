import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { getMetadata } from '../../scripts/aem.js';
import { getPictures } from '../../scripts/shared.js';

const FIELDS = ['images', 'name', 'category', 'price', 'description', 'colors', 'sizes', 'details'];

function readFields(block) {
  const fields = {};
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (FIELDS[i]) fields[FIELDS[i]] = cells[cells.length - 1];
  });
  return fields;
}

function splitList(cell) {
  return (cell?.textContent || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function buildGallery(cell) {
  const gallery = document.createElement('div');
  gallery.className = 'product-detail-gallery';
  const pictures = getPictures(cell);
  const main = document.createElement('div');
  main.className = 'product-detail-main-image';
  if (pictures[0]) main.append(pictures[0].cloneNode(true));
  gallery.append(main);

  if (pictures.length > 1) {
    const thumbs = document.createElement('div');
    thumbs.className = 'product-detail-thumbs';
    pictures.forEach((pic, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', i === 0);
      const img = pic.tagName === 'IMG' ? pic : pic.querySelector('img');
      button.setAttribute('aria-label', img?.alt || `${i + 1}`);
      button.append(pic);
      button.addEventListener('click', () => {
        main.replaceChildren(pic.cloneNode(true));
        main.querySelector('img')?.setAttribute('loading', 'eager');
        thumbs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === button));
      });
      thumbs.append(button);
    });
    gallery.append(thumbs);
  }
  return gallery;
}

function buildOptions(name, label, values, swatch = false) {
  const group = document.createElement('fieldset');
  group.className = `product-detail-options product-detail-${name}`;
  const legend = document.createElement('legend');
  legend.textContent = label;
  group.append(legend);
  const list = document.createElement('div');
  values.forEach((value, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.setAttribute('aria-pressed', swatch && i === 0);
    button.addEventListener('click', () => {
      list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === button));
      group.classList.remove('invalid');
    });
    list.append(button);
  });
  group.append(list);
  return group;
}

function addSchema(fields, image) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fields.name?.textContent.trim(),
    description: fields.description?.textContent.trim(),
    image: image?.currentSrc || image?.src,
    category: fields.category?.textContent.trim(),
    brand: { '@type': 'Brand', name: getMetadata('og:site_name') || 'Veloxa' },
  });
  document.head.append(script);
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const fields = readFields(block);

  const info = document.createElement('div');
  info.className = 'product-detail-info';

  const category = fields.category?.textContent.trim();
  if (category) {
    const p = document.createElement('p');
    p.className = 'product-detail-category';
    p.textContent = category;
    info.append(p);
  }
  const h1 = document.createElement('h1');
  h1.textContent = fields.name?.textContent.trim() || '';
  info.append(h1);
  const price = fields.price?.textContent.trim();
  if (price) {
    const p = document.createElement('p');
    p.className = 'product-detail-price';
    p.textContent = price;
    info.append(p);
  }
  if (fields.description) {
    const desc = document.createElement('div');
    desc.className = 'product-detail-description';
    desc.append(...fields.description.childNodes);
    info.append(desc);
  }

  const colors = splitList(fields.colors);
  if (colors.length) info.append(buildOptions('colors', placeholders.color || 'Color', colors, true));
  const sizes = splitList(fields.sizes);
  const sizeGroup = sizes.length ? buildOptions('sizes', placeholders.selectSize || 'Select size', sizes) : null;
  if (sizeGroup) info.append(sizeGroup);

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'product-detail-add';
  add.textContent = placeholders.addToBag || 'Add to bag';
  const status = document.createElement('p');
  status.className = 'product-detail-status';
  status.setAttribute('role', 'status');
  add.addEventListener('click', () => {
    if (sizeGroup && !sizeGroup.querySelector('[aria-pressed="true"]')) {
      sizeGroup.classList.add('invalid');
      status.textContent = placeholders.selectSizeError || 'Please select a size.';
      return;
    }
    status.textContent = placeholders.addedToBag || 'Added to bag.';
  });
  info.append(add, status);

  if (fields.details?.textContent.trim()) {
    const details = document.createElement('details');
    details.className = 'product-detail-details';
    const summary = document.createElement('summary');
    summary.textContent = placeholders.productDetails || 'Details';
    details.append(summary, ...fields.details.childNodes);
    info.append(details);
  }

  const gallery = buildGallery(fields.images);
  block.replaceChildren(gallery, info);
  const firstImg = gallery.querySelector('img');
  if (firstImg) firstImg.loading = 'eager';
  addSchema(fields, firstImg);
}
