import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { getLocale, getLocalizedPath, fetchIndex } from '../../scripts/shared.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function toggleAllNavSections(sections, expanded = false) {
  sections?.querySelectorAll('.nav-drop > button').forEach((button) => {
    button.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, false);
  button.setAttribute('aria-label', expanded ? button.dataset.openLabel : button.dataset.closeLabel);
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav.querySelector('.nav-sections');
  const expandedDrop = navSections?.querySelector('[aria-expanded="true"]');
  if (expandedDrop) {
    toggleAllNavSections(navSections);
    expandedDrop.focus();
  } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
    toggleMenu(nav, navSections, false);
    nav.querySelector('.nav-hamburger button').focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget) && isDesktop.matches) {
    toggleAllNavSections(nav.querySelector('.nav-sections'), false);
  }
}

function decorateSections(navSections) {
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
    const sub = navSection.querySelector(':scope > ul');
    if (!sub) return;
    navSection.classList.add('nav-drop');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    const label = navSection.querySelector(':scope > a, :scope > p, :scope > strong');
    button.textContent = (label ? label.textContent : navSection.firstChild.textContent).trim();
    if (label) label.remove();
    else navSection.firstChild.textContent = '';
    navSection.prepend(button);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (isDesktop.matches) toggleAllNavSections(navSections);
      button.setAttribute('aria-expanded', !expanded);
    });
  });
}

async function buildLocaleSwitcher(placeholders) {
  const locales = await fetchIndex('/locales.json');
  if (!locales.length) return null;
  const current = getLocale();
  const rest = current.prefix ? window.location.pathname.slice(current.prefix.length) : '/';

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', placeholders.selectRegion || 'Select region');
  const active = locales.find((l) => l.Code === current.code);
  button.textContent = active ? active.Code.toUpperCase() : current.code.toUpperCase();

  const list = document.createElement('ul');
  locales.forEach(({ Code, Name }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/${Code}${rest}`;
    a.lang = Code;
    a.hreflang = Code;
    a.textContent = Name;
    if (Code === current.code) a.setAttribute('aria-current', 'true');
    li.append(a);
    list.append(li);
  });

  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true');
  });
  wrapper.addEventListener('focusout', (e) => {
    if (!wrapper.contains(e.relatedTarget)) button.setAttribute('aria-expanded', 'false');
  });
  wrapper.append(button, list);
  return wrapper;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const fragment = await loadFragment(getLocalizedPath('nav', '/nav'));

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', placeholders.mainNavigation || 'Main');
  while (fragment?.firstElementChild) nav.append(fragment.firstElementChild);

  ['brand', 'sections', 'tools'].forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  nav.querySelectorAll('.button').forEach((link) => {
    link.className = '';
    link.closest('.button-container')?.classList.remove('button-container');
  });

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) decorateSections(navSections);

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navTools.querySelectorAll('a').forEach((a) => {
      if (!a.textContent.trim()) {
        const icon = a.querySelector('.icon');
        const name = icon ? [...icon.classList].find((c) => c.startsWith('icon-'))?.slice(5) : '';
        if (name) a.setAttribute('aria-label', placeholders[name] || name);
      }
    });
    const switcher = await buildLocaleSwitcher(placeholders);
    if (switcher) (navTools.querySelector('.default-content-wrapper') || navTools).append(switcher);
  }

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.dataset.openLabel = placeholders.openNavigation || 'Open navigation';
  hamburgerButton.dataset.closeLabel = placeholders.closeNavigation || 'Close navigation';
  hamburgerButton.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.append(hamburgerButton);
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));
  window.addEventListener('keydown', closeOnEscape);
  nav.addEventListener('focusout', closeOnFocusLost);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
