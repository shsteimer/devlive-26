import { getLocalizedPath } from '../../scripts/shared.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const fragment = await loadFragment(getLocalizedPath('footer', '/footer'));
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);
  footer.querySelector('.section:last-child')?.classList.add('footer-legal');
  block.append(footer);
}
