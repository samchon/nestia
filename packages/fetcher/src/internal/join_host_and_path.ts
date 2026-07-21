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
export const normalize_route_path = (path: string): string =>
  `/${path.replace(/^\/+/, "")}`;

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
 * @internal
 */
export const join_host_and_path = (host: string, path: string): string =>
  `${host.replace(/\/+$/, "")}${normalize_route_path(path)}`;
