/**
 * Helpers for security requirements.
 *
 * @evidence contracts/common.md#principled-implementation The namespace merges requirement lists into a canonical, duplicate-free list.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain helper.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
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
   *
   * @evidence contracts/common.md#principled-implementation Each requirement is normalized to unique scopes and keyed by its sorted schemes and sorted scopes, so equality does not depend on order, and the first occurrence keeps its position.
   * @evidence contracts/common.md#clear-and-simple-design One function with one key computation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality is defined by content.
   * @evidence contracts/common.md#meaningful-documentation The comment states the equality and the order.
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
