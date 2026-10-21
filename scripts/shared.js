import { getMetadata } from './aem.js';

const LOCALE_PATTERN = /^\/([a-z]{2}(?:-[a-z]{2})?)(?=\/|$)/;

export function getLocale(pathname = window.location.pathname) {
  const match = pathname.match(LOCALE_PATTERN);
  const code = match ? match[1] : '';
  return {
    code: code || 'en',
    prefix: code ? `/${code}` : '',
    lang: (code || 'en').split('-')[0],
  };
}

export function getLocalizedPath(metaName, fallback) {
  const meta = getMetadata(metaName);
  if (meta) return new URL(meta, window.location).pathname;
  return `${getLocale().prefix}${fallback}`;
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
