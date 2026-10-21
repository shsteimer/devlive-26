import { loadScript } from './aem.js';
import { getConsent } from './consent-check.js';

const GTM_ID = 'GTM-WVRTQJLJ';

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

const consent = getConsent() === 'accepted' ? 'granted' : 'denied';
gtag('consent', 'default', {
  ad_storage: consent,
  ad_user_data: consent,
  ad_personalization: consent,
  analytics_storage: consent,
});
window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
loadScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`, {
  async: '',
  nonce: document.querySelector('script[nonce]')?.nonce || '',
});
