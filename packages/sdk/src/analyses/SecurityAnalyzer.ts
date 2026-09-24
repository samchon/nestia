export namespace SecurityAnalyzer {
  /**
   * Joins lists of security requirements into one, as OpenAPI reads them.
   *
   * Each requirement is an alternative, any one of which suffices, and every
   * scheme of one requirement must hold, so each is kept as declared. Merging
   * them by scheme name turned `{ a, b }` (both) into `a` or `b`, and the
   * `read` or `write` scope alternatives of one scheme into both scopes. Only a
   * requirement repeating an earlier one, such as a controller's restated on
   * its method, is dropped; an empty one, anonymous access, is kept.
   */
  export const merge = (
    ...entire: Record<string, string[]>[]
  ): Record<string, string[]>[] => {
    const output: Record<string, string[]>[] = [];
    const visited: Set<string> = new Set();
    for (const requirement of entire) {
      const normalized: Record<string, string[]> = Object.fromEntries(
        Object.entries(requirement).map(([name, scopes]) => [
          name,
          [...new Set(scopes)],
        ]),
      );
      const key: string = JSON.stringify(
        Object.entries(normalized)
          .map(([name, scopes]) => [name, [...scopes].sort()] as const)
          .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)),
      );
      if (visited.has(key)) continue;
      visited.add(key);
      output.push(normalized);
    }
    return output;
  };
}
