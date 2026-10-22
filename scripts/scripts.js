import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  toClassName,
} from './aem.js';
import { getLocale, isGatedPage, localizeLinks } from './shared.js';

const { searchParams } = new URL(window.location.href);

function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
   
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    if (h1.closest('.hero') || picture.closest('.hero') || h1.closest('.block')) return;
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

function buildAutoBlocks(main) {
  try {
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
             
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildHeroBlock(main);
  } catch (error) {
     
    console.error('Auto Blocking failed', error);
  }
}

export function decorateMain(main) {
  localizeLinks(main);
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

async function loadTheme() {
  const theme = toClassName(getMetadata('theme'));
  if (theme) await loadCSS(`${window.hlx.codeBasePath}/styles/themes/${theme}.css`);
}

async function loadEager(doc) {
  document.documentElement.lang = getLocale().htmlLang;
  decorateTemplateAndTheme();
  await loadTheme();

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) loadFonts();
  } catch (e) {
    // do nothing
  }
}

async function loadLazy(doc) {
  autolinkModals(doc);
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  const gated = isGatedPage() ? await import('./utils/gated-content.js') : null;
  gated?.initContentProtection();
  await loadSections(main);
  gated?.applyContentProtection();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

function loadDelayed() {
  import('./delayed.js');
}

export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

if (searchParams.get('dapreview')) {
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}
