import { JSDOM, VirtualConsole } from 'jsdom';

export default function setupDom(url = 'http://localhost:3000/') {
  const virtualConsole = new VirtualConsole();
  virtualConsole.forwardTo(console, { jsdomErrors: 'none' });
  const { window } = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url, virtualConsole });
  window.hlx = { suppressLoadPage: true, codeBasePath: '' };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  global.window = window;
  global.document = window.document;
  global.MutationObserver = window.MutationObserver;
  global.DOMParser = window.DOMParser;
  global.CustomEvent = window.CustomEvent;
  global.IntersectionObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
  return window;
}
