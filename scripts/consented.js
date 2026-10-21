import { loadScript } from './aem.js';

const GTM_ID = '';
const CLARITY_ID = '';
const TAWK_ID = '';

if (GTM_ID) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`, { async: '' });
}

if (CLARITY_ID) {
  window.clarity = window.clarity || ((...args) => { (window.clarity.q = window.clarity.q || []).push(args); });
  loadScript(`https://www.clarity.ms/tag/${CLARITY_ID}`, { async: '' });
}

if (TAWK_ID) {
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  loadScript(`https://embed.tawk.to/${TAWK_ID}`, { async: '', crossorigin: '*' });
}
