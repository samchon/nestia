/**
 * Gaff comparator.
 *
 * `GaffComparator` is a set of comparator functions for `Array.sort()` function,
 * which can be used with {@link TestValidator.sort} function. If you want to see
 * how to use them, see the below example link.
 *
 * @example https://github.com/samchon/nestia-template/blob/master/src/test/features/api/bbs/test_api_bbs_article_index_sort.ts
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace GaffComparator {
  /**
   * String(s) comparator.
   *
   * @param getter Getter of string(s) from input
   * @returns Comparator function
   */
  export const strings =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T) => {
      const a: string[] = wrap(getter(x));
      const b: string[] = wrap(getter(y));

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? compare(a[idx], b[idx]) : 0;
    };

  /**
   * Date(s) comparator.
   *
   * @param getter Getter of date(s) from input
   * @returns Comparator function
   */
  export const dates =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T) => {
      const take = (v: T) =>
        wrap(getter(v)).map((str) => new Date(str).getTime());
      const a: number[] = take(x);
      const b: number[] = take(y);

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? a[idx] - b[idx] : 0;
    };

  /**
   * Number(s) comparator.
   *
   * @param closure Getter of number(s) from input
   * @returns Comparator function
   */
  export const numbers =
    <T>(closure: (input: T) => number | number[]) =>
    (x: T, y: T) => {
      const a: number[] = wrap(closure(x));
      const b: number[] = wrap(closure(y));

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? a[idx] - b[idx] : 0;
    };

  function compare(x: string, y: string) {
    return x.localeCompare(y);
  }

  function wrap<T>(elem: T | T[]): T[] {
    return Array.isArray(elem) ? elem : [elem];
  }
}
