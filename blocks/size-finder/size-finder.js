import {
  html, useState, useMemo, useId, createRoot,
} from '../../vendor/react/react.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { parseChart, findSize } from './size-chart.js';

const FITS = ['snug', 'regular', 'roomy'];

function getLabels(placeholders) {
  return {
    footLength: placeholders.footLength || 'Foot length (cm)',
    measureHint: placeholders.measureHint || 'Measure from your heel to your longest toe.',
    fit: placeholders.fit || 'Fit',
    snug: placeholders.fitSnug || 'Snug',
    regular: placeholders.fitRegular || 'Regular',
    roomy: placeholders.fitRoomy || 'Roomy',
    yourSize: placeholders.yourSize || 'Your size',
    enterLength: placeholders.enterFootLength || 'Enter your foot length to see your size.',
    outOfRange: placeholders.sizeOutOfRange || 'We don’t have a size for that length.',
  };
}

function SizeFinder({ chart, labels }) {
  const id = useId();
  const [length, setLength] = useState('');
  const [fit, setFit] = useState('regular');
  const size = useMemo(() => findSize(chart, parseFloat(length), fit), [chart, length, fit]);

  let result = html`<p>${labels.enterLength}</p>`;
  if (length && !size) result = html`<p>${labels.outOfRange}</p>`;
  if (size) {
    result = html`
      <p className="size-finder-result-label">${labels.yourSize}</p>
      <dl>
        <div><dt>EU</dt><dd>${size.eu}</dd></div>
        <div><dt>US</dt><dd>${size.us}</dd></div>
        <div><dt>UK</dt><dd>${size.uk}</dd></div>
      </dl>`;
  }

  return html`
    <form className="size-finder-form" onSubmit=${(e) => e.preventDefault()}>
      <label htmlFor=${`${id}-length`}>${labels.footLength}</label>
      <input
        id=${`${id}-length`}
        type="number"
        inputMode="decimal"
        min="15"
        max="35"
        step="0.1"
        value=${length}
        aria-describedby=${`${id}-hint`}
        onInput=${(e) => setLength(e.target.value)}
      />
      <p id=${`${id}-hint`} className="size-finder-hint">${labels.measureHint}</p>
      <fieldset>
        <legend>${labels.fit}</legend>
        ${FITS.map((value) => html`
          <label key=${value}>
            <input
              type="radio"
              name=${`${id}-fit`}
              value=${value}
              checked=${fit === value}
              onChange=${() => setFit(value)}
            />
            ${labels[value]}
          </label>`)}
      </fieldset>
    </form>
    <output className="size-finder-result" htmlFor=${`${id}-length`} aria-live="polite">${result}</output>`;
}

async function loadChart(href) {
  if (!href) return [];
  try {
    const resp = await fetch(href);
    return resp.ok ? parseChart((await resp.json()).data) : [];
  } catch (e) {
    return [];
  }
}

export default async function decorate(block) {
  const [textRow, sourceRow] = block.children;
  const [placeholders, chart] = await Promise.all([
    fetchPlaceholders(),
    loadChart(sourceRow?.querySelector('a')?.href),
  ]);

  const intro = document.createElement('div');
  intro.className = 'size-finder-intro';
  intro.append(...(textRow?.firstElementChild?.childNodes || []));

  const app = document.createElement('div');
  app.className = 'size-finder-app';
  block.replaceChildren(intro, app);

  createRoot(app).render(html`<${SizeFinder} chart=${chart} labels=${getLabels(placeholders)} />`);
}
