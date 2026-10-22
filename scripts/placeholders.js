/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { toCamelCase } from './aem.js';
import { getLocale } from './shared.js';

/**
 * Loads one placeholders sheet as a key/text map.
 * @param {string} path Folder of the sheet
 * @returns {Promise<object>} Placeholders, empty if missing
 */
async function loadSheet(path) {
  try {
    const resp = await fetch(`${path}/placeholders.json`);
    if (!resp.ok) return {};
    const { data = [] } = await resp.json();
    return Object.fromEntries(data
      .filter((placeholder) => placeholder.Key)
      .map((placeholder) => [toCamelCase(placeholder.Key.trim()), (placeholder.Text || '').trim()]));
  } catch (e) {
    return {};
  }
}

/**
 * Gets placeholders object. Region sheets override their language sheet.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders(prefix = getLocale().prefix || 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    const path = prefix === 'default' ? '' : prefix;
    const parent = path.split('/').slice(0, -1).join('/');
    window.placeholders[prefix] = Promise.all([parent ? loadSheet(parent) : {}, loadSheet(path)])
      .then(([base, own]) => {
        window.placeholders[prefix] = { ...base, ...own };
        return window.placeholders[prefix];
      });
  }
  return window.placeholders[prefix];
}
