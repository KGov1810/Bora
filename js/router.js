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
