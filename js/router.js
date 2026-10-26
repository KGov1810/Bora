/**
 * Resolves a location hash to a known route name.
 * Only the first path segment counts, so "#/lessons/12" resolves to "lessons".
 * Falls back to the default route for unknown or empty hashes.
 *
 * @param {string} hash - The location hash, e.g. "#/lessons".
 * @param {string[]} routes - The known route names.
 * @param {string} [defaultRoute='home'] - The route used when nothing matches.
 * @returns {string} The resolved route name.
 */
export function resolveRoute(hash, routes, defaultRoute = 'home') {
  const name = hash.replace(/^#\/?/, '').split('/')[0];
  return routes.includes(name) ? name : defaultRoute;
}

/**
 * Parses a location hash into a known route name and an optional parameter.
 * "#/lessons/a2-x" gives { name: 'lessons', param: 'a2-x' }. Segments after
 * the parameter are ignored. Unknown routes fall back to the default route,
 * without parameter.
 *
 * @param {string} hash - The location hash.
 * @param {string[]} routes - The known route names.
 * @param {string} [defaultRoute='home'] - The route used when nothing matches.
 * @returns {{ name: string, param: string | null }} The parsed route.
 */
export function parseRoute(hash, routes, defaultRoute = 'home') {
  const [name, rawParam = ''] = hash.replace(/^#\/?/, '').split('/');
  if (!routes.includes(name)) return { name: defaultRoute, param: null };
  let param = null;
  try {
    param = decodeURIComponent(rawParam) || null;
  } catch {
    param = null;
  }
  return { name, param };
}
