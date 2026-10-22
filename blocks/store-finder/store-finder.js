import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { createTag } from '../../scripts/shared.js';

const PROD_HOST = 'devlive.shsteimer.com';
const DAY_INDEX = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export function apiOrigin({ hostname } = window.location) {
  const override = window.localStorage?.getItem('apiOrigin');
  if (override) return override;
  return hostname === PROD_HOST ? '' : `https://${PROD_HOST}`;
}

export function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

function getLabels(p) {
  return {
    near: p.storesNear || 'Stores nearest to {place}',
    nearYou: p.storesNearYou || 'Stores nearest to you',
    all: p.storesAll || 'All stores',
    useLocation: p.useMyLocation || 'Use my location',
    locationError: p.locationError || 'We couldn’t get your location.',
    unavailable: p.storesUnavailable || 'Store information is unavailable right now.',
    open: p.storeOpen || 'Open · closes {time}',
    opensToday: p.storeOpensToday || 'Closed · opens today at {time}',
    opens: p.storeOpens || 'Closed · opens {day} at {time}',
    pickupToday: p.pickupToday || 'Click & collect: ready today by {time}',
    pickupLater: p.pickupLater || 'Click & collect: ready {day} by {time}',
    away: p.distanceAway || '{distance} away',
  };
}

export function formatDay(day, lang) {
  const date = new Date(Date.UTC(2024, 0, 7 + DAY_INDEX[day]));
  return new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(date);
}

export function formatDistance(km, lang) {
  return new Intl.NumberFormat(lang, {
    style: 'unit', unit: 'kilometer', maximumFractionDigits: km < 10 ? 1 : 0,
  }).format(km);
}

export function statusText(status, labels, lang) {
  if (status.open) return fill(labels.open, { time: status.closes });
  if (!status.opens) return '';
  const { day, time, today } = status.opens;
  return fill(today ? labels.opensToday : labels.opens, { day: formatDay(day, lang), time });
}

export function pickupText(pickup, labels, lang) {
  if (!pickup) return '';
  const { day, time, today } = pickup;
  return fill(today ? labels.pickupToday : labels.pickupLater, { day: formatDay(day, lang), time });
}

export function headingText(origin, labels) {
  if (origin?.source === 'browser') return labels.nearYou;
  if (origin?.source === 'edge' && origin.city) {
    return fill(labels.near, { place: [origin.city, origin.country].filter(Boolean).join(', ') });
  }
  return labels.all;
}

function renderStore(store, labels, lang) {
  const map = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
  return createTag('li', { class: store.status.open ? 'open' : 'closed' }, [
    createTag('h3', {}, store.name),
    createTag('p', { class: 'store-finder-address' }, createTag('a', { href: map, target: '_blank', rel: 'noopener' }, store.address)),
    store.distanceKm !== undefined ? createTag('p', { class: 'store-finder-distance' }, fill(labels.away, { distance: formatDistance(store.distanceKm, lang) })) : null,
    createTag('p', { class: 'store-finder-status' }, statusText(store.status, labels, lang)),
    store.pickup ? createTag('p', { class: 'store-finder-pickup' }, pickupText(store.pickup, labels, lang)) : null,
  ]);
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const labels = getLabels(placeholders);
  const lang = document.documentElement.lang || 'en';

  const intro = createTag('div', { class: 'store-finder-intro' });
  intro.append(...(block.firstElementChild?.firstElementChild?.childNodes || []));
  const heading = createTag('p', { class: 'store-finder-heading', role: 'status' });
  const locate = createTag('button', { type: 'button', class: 'button secondary' }, labels.useLocation);
  const list = createTag('ol', { class: 'store-finder-list' });
  const toolbar = createTag('div', { class: 'store-finder-toolbar' }, [heading, locate]);
  block.replaceChildren(...(intro.childNodes.length ? [intro] : []), toolbar, list);

  const load = async (coords) => {
    const url = new URL('/api/stores', apiOrigin() || window.location.origin);
    if (coords) {
      url.searchParams.set('lat', coords.latitude.toFixed(2));
      url.searchParams.set('lng', coords.longitude.toFixed(2));
    }
    block.setAttribute('aria-busy', 'true');
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) throw new Error(resp.status);
      const { origin, stores } = await resp.json();
      heading.textContent = headingText(origin, labels);
      list.replaceChildren(...stores.map((store) => renderStore(store, labels, lang)));
    } catch (e) {
      heading.textContent = labels.unavailable;
      list.replaceChildren();
    } finally {
      block.removeAttribute('aria-busy');
    }
  };

  if (!navigator.geolocation) locate.hidden = true;
  locate.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => load(coords),
      () => { heading.textContent = labels.locationError; },
      { maximumAge: 600000, timeout: 10000 },
    );
  });

  await load();
}
