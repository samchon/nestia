/**
 * Helpers for maps.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the get-or-create helper.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain helper.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace MapUtil {
  /**
   * Returns the value of a key, creating and storing it when the key is absent.
   *
   * Presence is tested with `has`, so a stored falsy value is not created
   * again.
   *
   * @evidence contracts/common.md#principled-implementation The generator runs once per key and its result is stored as it is.
   * @evidence contracts/common.md#clear-and-simple-design One check, one call, and one store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The stored value is returned unchanged.
   * @evidence contracts/common.md#meaningful-documentation The comment states the presence rule.
   */
  export function take<Key, T>(
    dict: Map<Key, T>,
    key: Key,
    generator: () => T,
  ): T {
    if (dict.has(key)) return dict.get(key) as T;

    const value: T = generator();
    dict.set(key, value);
    return value;
  }
}
