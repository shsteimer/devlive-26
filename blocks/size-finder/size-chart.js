const FIT_OFFSET = { snug: -0.3, regular: 0, roomy: 0.4 };

const toNumber = (value) => parseFloat(String(value ?? '').replace(',', '.'));

export function parseChart(rows = []) {
  return (rows || [])
    .map((row) => ({
      eu: String(row.EU ?? '').trim(),
      us: String(row.US ?? '').trim(),
      uk: String(row.UK ?? '').trim(),
      maxLength: toNumber(row['Foot length (cm)']),
    }))
    .filter((row) => row.eu && Number.isFinite(row.maxLength))
    .sort((a, b) => a.maxLength - b.maxLength);
}

export function findSize(chart, length, fit = 'regular') {
  if (!Number.isFinite(length) || length <= 0) return null;
  const target = length + (FIT_OFFSET[fit] ?? 0);
  return chart.find((row) => row.maxLength >= target - 1e-9) || null;
}
