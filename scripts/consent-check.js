import { getLocalizedPath } from './shared.js';

const MAX_AGE = 60 * 60 * 24 * 365;
let consentedLoaded = false;
let banner;

export function getConsent(search = window.location.search, cookie = document.cookie) {
  const param = new URLSearchParams(search).get('consent');
  if (param !== null) {
    return ['accept', 'accepted', 'true', '1', 'yes'].includes(param.toLowerCase()) ? 'accepted' : 'declined';
  }
  return cookie.match(/(?:^|;\s*)consent=(accepted|declined)(?:;|$)/)?.[1] || null;
}

function applyConsent(consent) {
  const consented = consent === 'accepted';
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented && !consentedLoaded) {
    consentedLoaded = true;
    import('./consented.js');
  }
}

export function setConsent(consent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `consent=${consent}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  banner?.then((el) => el?.remove());
  banner = null;
  applyConsent(consent);
}

async function buildBanner() {
  const { loadFragment } = await import('../blocks/fragment/fragment.js');
  const fragment = await loadFragment(getLocalizedPath('consent', '/consent'));
  const block = fragment?.querySelector('.consent');
  if (!block) return null;
  const aside = document.createElement('aside');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.id = heading.id || 'consent-heading';
    aside.setAttribute('aria-labelledby', heading.id);
  }
  aside.append(block);
  document.body.prepend(aside);
  return aside;
}

async function showBanner(focus = false) {
  if (!banner) banner = buildBanner();
  const el = await banner;
  if (focus) el?.querySelector('button')?.focus();
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link || !new URL(link.href).pathname.endsWith('/consent')) return;
  e.preventDefault();
  showBanner(true);
});

const consent = getConsent();
if (consent) applyConsent(consent);
else if (!document.querySelector('main .consent')) showBanner();
