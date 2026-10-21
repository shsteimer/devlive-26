import { getMetadata } from './aem.js';

const LOCALE_PATTERN = /^\/([a-z]{2})(?:\/([a-z]{2}))?(?=\/|$)/;

export function getLocale(pathname = window.location.pathname) {
  const [, lang, region] = pathname.match(LOCALE_PATTERN) || [];
  return {
    lang: lang || 'en',
    region: region || '',
    prefix: [lang, region].filter(Boolean).map((s) => `/${s}`).join(''),
    htmlLang: region ? `${lang}-${region.toUpperCase()}` : (lang || 'en'),
  };
}

export function localizeLinks(el) {
  const { prefix } = getLocale();
  if (!prefix) return;
  el.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location);
    if (url.origin !== window.location.origin || a.closest('[data-no-localize]')) return;
    const match = url.pathname.match(LOCALE_PATTERN);
    if (!match || url.pathname.startsWith(`${prefix}/`) || url.pathname === prefix) return;
    a.href = `${prefix}${url.pathname.slice(match[0].length)}${url.search}${url.hash}`;
  });
}

export function getLocalizedPath(metaName, fallback) {
  const meta = getMetadata(metaName);
  if (meta) return new URL(meta, window.location).pathname;
  return `${getLocale().prefix}${fallback}`;
}

export function isGatedPage() {
  return String(getMetadata('gated') || '').trim().toLowerCase() === 'true';
}

export function createTag(tag, attributes = {}, content = null) {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.setAttribute(key, String(value));
  });
  if (content !== null && content !== undefined) {
    if (Array.isArray(content)) content.forEach((item) => item != null && el.append(item));
    else el.append(content);
  }
  return el;
}

export async function fetchIndex(path = '/query-index.json') {
  window.indexCache = window.indexCache || {};
  if (!window.indexCache[path]) {
    window.indexCache[path] = fetch(path)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return window.indexCache[path];
}

export function getPictures(el) {
  if (!el) return [];
  return [...el.querySelectorAll('picture, img')].filter((node) => node.tagName === 'PICTURE' || !node.closest('picture'));
}
