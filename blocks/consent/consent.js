import { setConsent } from '../../scripts/consent-check.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const [textRow, buttonRow] = block.children;
  const [acceptCell, declineCell] = buttonRow ? [...buttonRow.children] : [];

  const text = document.createElement('div');
  text.className = 'consent-text';
  text.append(...(textRow?.firstElementChild?.childNodes || []));

  const buttons = document.createElement('div');
  buttons.className = 'consent-buttons';
  [
    ['accepted', acceptCell?.textContent.trim() || placeholders.acceptCookies || 'Accept all'],
    ['declined', declineCell?.textContent.trim() || placeholders.declineCookies || 'Decline'],
  ].forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => setConsent(value));
    buttons.append(button);
  });

  block.replaceChildren(text, buttons);
}
