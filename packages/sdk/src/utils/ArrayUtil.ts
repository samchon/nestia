/**
 * Array helpers of the SDK generator.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds a membership test and a sequential asynchronous map.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts They are plain helpers.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace ArrayUtil {
  /**
   * Reports whether the array contains every one of the items.
   *
   * Membership uses `includes`, so an `undefined` or `NaN` item is found when
   * the array holds it.
   *
   * @evidence contracts/common.md#principled-implementation `Array.prototype.includes` compares by SameValueZero and the result is the conjunction over the items.
   * @evidence contracts/common.md#clear-and-simple-design One `every` over `includes`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No item is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states the conjunction and the comparison.
   */
  export function has<T>(array: T[], ...items: T[]): boolean {
    return items.every((item) => array.includes(item));
  }

  /**
   * Maps the elements with an asynchronous function, one after another, and
   * returns the results in order.
   *
   * @evidence contracts/common.md#principled-implementation Each call is awaited before the next starts, so the order of the results is the order of the elements and a rejection stops the mapping.
   * @evidence contracts/common.md#clear-and-simple-design One loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No element is skipped or retried.
   * @evidence contracts/common.md#meaningful-documentation The comment states the sequential order.
   */
  export async function asyncMap<X, Y>(
    array: X[],
    closure: (input: X) => Promise<Y>,
  ): Promise<Y[]> {
    const ret: Y[] = [];
    for (const elem of array) ret.push(await closure(elem));
    return ret;
  }
}
