/** @internal */
const SLASH = 0x2f;

/**
 * Normalize a route path to exactly one leading separator.
 *
 * `@nestia/sdk` always emits a leading-slash path, but a hand-written
 * {@link IFetchRoute.path} may omit it, and a server-composed path may carry
 * several. Interior separators are left alone: only the boundary is
 * normalized.
 *
 * @internal
 */
export const normalize_route_path = (path: string): string => {
  let start: number = 0;
  while (start < path.length && path.charCodeAt(start) === SLASH) ++start;
  return `/${path.slice(start)}`;
};

/**
 * Join a host address and a route path with exactly one separator.
 *
 * `IConnection.host` may or may not end with a separator, and the route path
 * may or may not begin with one; all four spellings must produce the same URL.
 * `new URL()` does not collapse a doubled separator inside a pathname, so the
 * join has to be exact — `http://localhost:3000/` plus `/health` must not
 * become `http://localhost:3000//health`, which most routers treat as an
 * unmapped path.
 *
 * Both boundaries are scanned rather than matched with a regular expression.
 * `host` is caller-supplied, and a trailing-separator pattern backtracks
 * polynomially over a run of separators, so a pathological host would cost
 * quadratic time on every request.
 *
 * @internal
 */
export const join_host_and_path = (host: string, path: string): string => {
  let end: number = host.length;
  while (end > 0 && host.charCodeAt(end - 1) === SLASH) --end;
  return `${host.slice(0, end)}${normalize_route_path(path)}`;
};
