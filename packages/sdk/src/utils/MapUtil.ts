/**
 * Helpers for maps.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the get-or-create helper.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain helper.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
 */
export namespace MapUtil {
  /**
   * Returns the value of a key, creating and storing it when the key is absent.
   *
   * Presence is tested with `has`, so a stored falsy value is not created
   * again. The dictionary may be a `Map` or a `WeakMap`, so a cache keyed by
   * object identity can leave its entries to the garbage collector.
   *
   * @evidence contracts/common.md#principled-implementation The generator runs once per key and its result is stored as it is, in any dictionary with the three members it uses, so the retention of the entries stays the choice of the caller's dictionary.
   * @evidence contracts/common.md#clear-and-simple-design One check, one call, and one store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The stored value is returned unchanged.
   * @evidence contracts/common.md#meaningful-documentation The comment states the presence rule.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil.take reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
   */
  export function take<Key, T>(
    dict: IDictionary<Key, T>,
    key: Key,
    generator: () => T,
  ): T {
    if (dict.has(key)) return dict.get(key) as T;

    const value: T = generator();
    dict.set(key, value);
    return value;
  }

  /**
   * The members of a `Map` or a `WeakMap` that {@link take} reads and writes.
   *
   * @evidence contracts/common.md#principled-implementation The three members are the presence test, the read and the store that the get-or-create rule needs, and both `Map` and `WeakMap` provide them with these signatures.
   * @evidence contracts/common.md#clear-and-simple-design A structural type of three members, so no wrapper or second helper is needed for a weakly keyed cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the two dictionaries it admits and the operations it needs.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil.IDictionary reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
   */
  export interface IDictionary<Key, T> {
    /**
     * Whether the key is present, including a key whose value is `undefined`.
     *
     * @evidence contracts/common.md#principled-implementation Presence is a separate question from the stored value, which is what lets a stored falsy value count as present.
     * @evidence contracts/common.md#clear-and-simple-design One member with the signature that `Map` and `WeakMap` share.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a signature and adds no runtime behavior.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the member answers or does for {@link take}.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil.IDictionary.has reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
     */
    has(key: Key): boolean;

    /**
     * The value stored for the key, or `undefined` when it is absent.
     *
     * @evidence contracts/common.md#principled-implementation The read is only made after a presence test, so `undefined` here always means a stored value.
     * @evidence contracts/common.md#clear-and-simple-design One member with the signature that `Map` and `WeakMap` share.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a signature and adds no runtime behavior.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the member answers or does for {@link take}.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil.IDictionary.get reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
     */
    get(key: Key): T | undefined;

    /**
     * Stores the value for the key; the result is ignored.
     *
     * @evidence contracts/common.md#principled-implementation The store is the one effect of the get-or-create rule, and the return type is not read because `Map.set` and `WeakMap.set` return different receivers.
     * @evidence contracts/common.md#clear-and-simple-design One member with the signature that `Map` and `WeakMap` share.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a signature and adds no runtime behavior.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the member answers or does for {@link take}.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation MapUtil.IDictionary.set reads or initializes caller-supplied map entries; it neither interprets keys as native path identities nor owns a process boundary.
     */
    set(key: Key, value: T): unknown;
  }
}
