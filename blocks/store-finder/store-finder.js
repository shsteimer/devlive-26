import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { createTag, getLocale } from '../../scripts/shared.js';

const PROD_HOST = 'devlive.shsteimer.com';
const MILE_REGIONS = ['us', 'gb'];
const KM_PER_MILE = 1.609344;
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
    all: p.storesAll || 'All stores',
    unavailable: p.storesUnavailable || 'Store information is unavailable right now.',
    open: p.storeOpen || 'Open · closes {time}',
    opensToday: p.storeOpensToday || 'Closed · opens today at {time}',
    opens: p.storeOpens || 'Closed · opens {day} at {time}',
    away: p.distanceAway || '{distance} away',
  };
}

export function formatDay(day, lang) {
  const date = new Date(Date.UTC(2024, 0, 7 + DAY_INDEX[day]));
  return new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(date);
}

export function formatDistance(km, lang, region) {
  const miles = MILE_REGIONS.includes(region);
  const value = miles ? km / KM_PER_MILE : km;
  return new Intl.NumberFormat(lang, {
    style: 'unit', unit: miles ? 'mile' : 'kilometer', maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

export function countryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code;
  } catch (e) {
    return code;
  }
}

export function statusText(status, labels, lang) {
  if (status.open) return fill(labels.open, { time: status.closes });
  if (!status.opens) return '';
  const { day, time, today } = status.opens;
  return fill(today ? labels.opensToday : labels.opens, { day: formatDay(day, lang), time });
}

export function placeName(origin, lang) {
  return [origin?.city, origin?.country && countryName(origin.country, lang)].filter(Boolean).join(', ');
}

export function groupByCountry(stores, lang) {
  const groups = new Map();
  stores.forEach((store) => {
    if (!groups.has(store.country)) groups.set(store.country, []);
    groups.get(store.country).push(store);
  });
  return [...groups].map(([code, list]) => ({ name: countryName(code, lang), stores: list }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
}

function renderStore(store, level, ctx) {
  const map = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
  return createTag('li', { class: store.status.open ? 'open' : 'closed' }, [
    createTag(`h${level}`, {}, store.name),
    createTag('p', { class: 'store-finder-address' }, createTag('a', { href: map, target: '_blank', rel: 'noopener' }, store.address)),
    store.distanceKm !== undefined ? createTag('p', { class: 'store-finder-distance' }, fill(ctx.labels.away, { distance: formatDistance(store.distanceKm, ctx.lang, ctx.region) })) : null,
    createTag('p', { class: 'store-finder-status' }, statusText(store.status, ctx.labels, ctx.lang)),
  ]);
}

function renderGroups(stores, level, ctx) {
  return createTag('div', { class: 'store-finder-groups' }, groupByCountry(stores, ctx.lang).map((group) => createTag('section', {}, [
    createTag(`h${level}`, {}, group.name),
    createTag('ul', { class: 'store-finder-list' }, group.stores.map((store) => renderStore(store, level + 1, ctx))),
  ])));
}

async function fetchStores() {
  const url = new URL('/api/stores', apiOrigin() || window.location.origin);
  const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!resp.ok) throw new Error(resp.status);
  return resp.json();
}

export default async function decorate(block) {
  const [placeholders, data] = await Promise.all([
    fetchPlaceholders(),
    fetchStores().catch(() => null),
  ]);
  const ctx = {
    labels: getLabels(placeholders),
    lang: document.documentElement.lang || 'en',
    region: getLocale().region,
  };
  const { labels } = ctx;

  const content = [];
  const intro = block.firstElementChild?.firstElementChild;
  if (intro?.childNodes.length) content.push(createTag('div', { class: 'store-finder-intro' }, [...intro.childNodes]));

  if (!data?.stores?.length) {
    content.push(createTag('p', { class: 'store-finder-heading' }, labels.unavailable));
  } else if (data.nearest?.length) {
    const place = placeName(data.origin, ctx.lang);
    content.push(
      createTag('p', { class: 'store-finder-heading' }, place ? fill(labels.near, { place }) : labels.all),
      createTag('ol', { class: 'store-finder-list' }, data.nearest.map((store) => renderStore(store, 3, ctx))),
      createTag('details', { class: 'store-finder-all' }, [
        createTag('summary', {}, labels.all),
        renderGroups(data.stores, 3, ctx),
      ]),
    );
  } else {
    content.push(
      createTag('p', { class: 'store-finder-heading' }, labels.all),
      renderGroups(data.stores, 3, ctx),
    );
  }
  block.replaceChildren(...content);
}
