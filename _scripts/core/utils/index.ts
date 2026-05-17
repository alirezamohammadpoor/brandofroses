/**
 * Checks if `value` is the language type of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 */
export function isObject(value: unknown): boolean {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

/**
 * Check if we're running the theme inside the theme editor
 */
export function isThemeEditor(): boolean {
  return window.Shopify?.designMode ?? false
}

/**
 * Constructs an object of key / value pairs out of the parameters of the query string
 */
export function getQueryParams(): Record<string, string | boolean> {
  const queryParams = {}
  const params = new URLSearchParams(window.location.search)

  for (const [key, value] of Array.from(params.entries())) {
    queryParams[key] = value || true
  }

  return queryParams
}

/**
 * Performs a post request by way of a form submit
 * Pulled from Shopify's shopify_common.js
 */
export function postLink(t: string, e: { method?: string, parameters?: Record<string, string> } = {}): void {
  const n = (e = e || {}).method || 'post';
  const i = e.parameters || {};
  const o = document.createElement('form');

  for (const r in o.setAttribute('method', n), o.setAttribute('action', t), i) {
    const l = document.createElement('input');
    l.setAttribute('type', 'hidden');
    l.setAttribute('name', r);
    l.setAttribute('value', i[r]);
    o.appendChild(l);
  }

  document.body.appendChild(o);
  o.submit();
  document.body.removeChild(o);
}

export function clamp(num: number, a: number, b: number): number {
  return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
}

export function targetBlankExternalLinks(): void {
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href')

    if (href && link.hostname !== location.hostname && !href.includes('mailto:')) {
      link.target = '_blank'
      link.setAttribute('aria-describedby', 'a11y-new-window-message')
    }
  })
}

/**
 * Checks if the given value is a valid number.
 */
export function isNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Detects if the current device supports touch events.
 */
export const isTouch = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return 'ontouchstart' in window ||
         navigator.maxTouchPoints > 0
}
