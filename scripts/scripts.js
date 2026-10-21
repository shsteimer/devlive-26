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
} from './aem.js';
import {
  initMartech, martechEager, martechLazy, martechDelayed,
} from '../plugins/martech/src/index.js';
import { getLocale } from './shared.js';

const { searchParams } = new URL(window.location.href);
const IS_EDITOR = searchParams.has('dapreview') || searchParams.has('quick-edit');

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
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

async function loadEager(doc) {
  document.documentElement.lang = getLocale().lang;
  decorateTemplateAndTheme();

  const martechLoaded = !IS_EDITOR && initMartech(
    {
      datastreamId: 'd73be188-bc37-4ede-a5da-8aa7cd1e343b',
      orgId: '138A07885EE042D20A495CFA@AdobeOrg',
      defaultConsent: 'in',
    },
    {
      personalization: !!getMetadata('target'),
      launchUrls: ['https://assets.adobedtm.com/ace20f3fb313/d4fa519d75cf/launch-452113bfea88.min.js'],
    },
  );

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await Promise.all([
      martechLoaded && martechLoaded.then(martechEager),
      loadSection(main.querySelector('.section'), waitForFirstImage),
    ]);
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
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  if (!IS_EDITOR) await martechLazy();
}

function loadDelayed() {
  window.setTimeout(() => {
    if (!IS_EDITOR) martechDelayed();
    import('./delayed.js');
  }, 3000);
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
