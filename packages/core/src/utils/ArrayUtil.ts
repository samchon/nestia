/**
 * Array helpers of the core runtime.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the one membership helper the adapters use.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain helper with no special cases.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace ArrayUtil {
  /**
   * Reports whether the array contains every one of the items.
   *
   * Membership is decided by `Array.prototype.includes`, so an item that is
   * `undefined` or `NaN` is found when the array holds it.
   *
   * @evidence contracts/common.md#principled-implementation `Array.prototype.includes` compares by SameValueZero, so the result is the conjunction over the items of membership, an item that is `undefined` or `NaN` is found when the array holds it, and no items yields true; an earlier `find` compared the found element with `undefined` and could not report an `undefined` member.
   * @evidence contracts/common.md#clear-and-simple-design One `every` over `includes`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No item is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states the conjunction and the comparison rule.
   */
  export function has<T>(array: T[], ...items: T[]): boolean {
    return items.every((item) => array.includes(item));
  }
}
