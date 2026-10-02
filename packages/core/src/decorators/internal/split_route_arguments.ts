/**
 * Splits the arguments of a route decorator into its path and its functor.
 *
 * A route decorator is called as `Route()`, `Route(path)`, `Route(functor)`, or
 * `Route(path, functor)`. The first argument is the path when it is absent, a
 * string, or an array of strings, and the functor otherwise.
 *
 * @internal
 */
export const split_route_arguments = <Functor>(
  args: any[],
): [string | string[] | undefined, Functor | null | undefined] => {
  const path: string | string[] | undefined | null =
    args[0] === undefined ||
    typeof args[0] === "string" ||
    Array.isArray(args[0])
      ? args[0]
      : null;
  return [path ?? undefined, path === null ? args[0] : args[1]];
};
