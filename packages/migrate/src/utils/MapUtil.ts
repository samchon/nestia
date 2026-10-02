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
   * Returns the value of a key, creating and storing it with the generator when
   * the key is absent.
   *
   * @evidence contracts/common.md#principled-implementation Presence is tested with `has`, so a stored falsy value is returned and not created again, and the generator runs once per key.
   * @evidence contracts/common.md#clear-and-simple-design One check, one generator call, and one store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The stored value is returned as it is.
   * @evidence contracts/common.md#meaningful-documentation The comment states when the generator runs.
   */
  export const take =
    <Key, T>(dict: Map<Key, T>) =>
    (key: Key) =>
    (generator: () => T): T => {
      if (dict.has(key)) return dict.get(key) as T;

      const value: T = generator();
      dict.set(key, value);
      return value;
    };
}
