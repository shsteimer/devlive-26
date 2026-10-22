import STORES from './stores.js';
import { findStores } from './store-logic.js';

const ALLOWED_ORIGINS = [
  /^https:\/\/devlive\.shsteimer\.com$/,
  /^https:\/\/[a-z0-9-]+--devlive-26--shsteimer\.aem\.(?:page|live)$/,
  /^http:\/\/localhost:3000$/,
];
const MAX_AGE = 60;

const round = (value) => Math.round(value * 10) / 10;

function parseCoord(value, max) {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null;
}

export function getOrigin(url, cf = {}) {
  const lat = parseCoord(url.searchParams.get('lat'), 90);
  const lng = parseCoord(url.searchParams.get('lng'), 180);
  if (lat !== null && lng !== null) return { source: 'query', lat: round(lat), lng: round(lng) };
  const cfLat = parseCoord(cf.latitude ?? null, 90);
  const cfLng = parseCoord(cf.longitude ?? null, 180);
  if (cfLat !== null && cfLng !== null) {
    return {
      source: 'edge', lat: round(cfLat), lng: round(cfLng), city: cf.city, country: cf.country,
    };
  }
  return { source: 'none' };
}

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = { vary: 'Origin' };
  if (origin && ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-expose-headers'] = 'x-cache';
  }
  return headers;
}

function withHeaders(response, headers) {
  const resp = new Response(response.body, response);
  Object.entries(headers).forEach(([k, v]) => resp.headers.set(k, v));
  return resp;
}

async function handleStores(request, url, ctx) {
  const from = getOrigin(url, request.cf);
  const cacheKey = new URL('https://api.cache/stores');
  if (from.lat !== undefined) {
    cacheKey.searchParams.set('lat', from.lat);
    cacheKey.searchParams.set('lng', from.lng);
  }
  const cache = globalThis.caches?.default;
  const cached = await cache?.match(cacheKey);
  if (cached) {
    const body = await cached.json();
    return Response.json({ ...body, origin: from }, { headers: { ...Object.fromEntries(cached.headers), 'x-cache': 'HIT' } });
  }

  const body = {
    ...findStores(STORES, { from: from.lat !== undefined ? from : null }),
    generated: new Date().toISOString(),
  };
  const headers = { 'cache-control': `public, max-age=${MAX_AGE}` };
  if (cache) ctx?.waitUntil(cache.put(cacheKey, Response.json(body, { headers })));
  return Response.json({ ...body, origin: from }, { headers: { ...headers, 'x-cache': 'MISS' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: cors });
    if (url.pathname === '/api/stores') return withHeaders(await handleStores(request, url, ctx), cors);
    return new Response('Not Found', { status: 404, headers: cors });
  },
};
