import { loadScript } from './aem.js';

const GTM_ID = 'GTM-WVRTQJLJ';

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

gtag('consent', 'default', {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
});
window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
loadScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`, {
  async: '',
  nonce: document.querySelector('script[nonce]')?.nonce || '',
});
