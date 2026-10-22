export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const PICKUP_LEAD_MINUTES = 120;

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function localNow(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    day: DAYS.indexOf(parts.weekday.toLowerCase()),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function* upcomingDays(store, now) {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = DAYS[(now.day + offset) % 7];
    const hours = store.hours[day];
    if (hours) {
      yield {
        day, offset, open: toMinutes(hours[0]), close: toMinutes(hours[1]),
      };
    }
  }
}

export function openStatus(store, date) {
  const now = localNow(date, store.timeZone);
  for (const { day, offset, open, close } of upcomingDays(store, now)) {
    if (offset === 0 && now.minutes >= open && now.minutes < close) {
      return { open: true, closes: toTime(close) };
    }
    if (offset > 0 || now.minutes < open) {
      return { open: false, opens: { day, time: toTime(open), today: offset === 0 } };
    }
  }
  return { open: false };
}

export function pickupTime(store, date, lead = PICKUP_LEAD_MINUTES) {
  const now = localNow(date, store.timeZone);
  for (const { day, offset, open, close } of upcomingDays(store, now)) {
    const ready = (offset === 0 ? Math.max(now.minutes, open) : open) + lead;
    if (ready <= close) return { day, time: toTime(ready), today: offset === 0 };
  }
  return null;
}

export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function findStores(stores, { from, date = new Date(), limit } = {}) {
  const result = stores.map(({
    id, name, brand, address, lat, lng, ...store
  }) => ({
    id,
    name,
    brand,
    address,
    lat,
    lng,
    ...(from && { distanceKm: Math.round(distanceKm(from, { lat, lng }) * 10) / 10 }),
    status: openStatus(store, date),
    pickup: pickupTime(store, date),
  }));
  result.sort(from
    ? (a, b) => a.distanceKm - b.distanceKm
    : (a, b) => a.name.localeCompare(b.name));
  return limit ? result.slice(0, limit) : result;
}
