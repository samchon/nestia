/**
 * Compares two values through their JSON form and returns the accessors that
 * differ.
 *
 * The comparison walks the keys of the first value, skipping keys whose value
 * is `undefined` and keys the exception predicate accepts, so a key only the
 * second value has is not a difference. Values with a `toJSON` are compared by
 * it, functions are ignored, `null` differs from every object, and arrays must
 * have the same length. An empty result means no difference.
 *
 * Processing cost: The walker traverses the first value and matching
 * second-value positions, recording differing accessors. Object keys and
 * recursion require space proportional to visited structure and depth; toJSON
 * and exception callback costs belong to their implementations. Cyclic inputs
 * are unsupported.
 *
 * @evidence contracts/common.md#principled-implementation Each pair is first read through `toJSON`, then separated by type, by `null`, by array against non-array, and by key walking, so the differences are the accessors where the JSON values differ over the keys of the first value; reading through `toJSON` compares a `Date` by its instant instead of treating every two dates as equal.
 * @evidence contracts/common.md#clear-and-simple-design One curried function with three inner walkers (value, array, object) that append to one accessor list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The exception predicate is the caller's, and no key or type name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states the comparison rules and what the result means.
 */
export const json_equal_to =
  (exception: (key: string) => boolean) =>
  <T>(x: T) =>
  (y: T | null | undefined): string[] => {
    const container: string[] = [];
    const iterate =
      (accessor: string) =>
      (x: any) =>
      (y: any): void => {
        // compare what JSON holds: a Date has no keys of its own and would
        // equal every other Date, while its JSON form is the ISO string
        x = toJSON(x);
        y = toJSON(y);
        if (typeof x === "function" || typeof y === "function") return;
        else if (typeof x !== typeof y) container.push(accessor);
        // `typeof null` is "object", so the check above does not separate an
        // object from null. Settle every null pair here, before the Array and
        // Object branches walk into one: `null` is a JSON value, and comparing
        // it against an object is a difference at this accessor, exactly as it
        // already was when the two operands were swapped.
        else if (x === null || y === null) {
          if (x !== y) container.push(accessor);
        } else if (Array.isArray(x) !== Array.isArray(y))
          container.push(accessor);
        else if (Array.isArray(x)) array(accessor)(x)(y);
        else if (typeof x === "object") object(accessor)(x)(y);
        else if (x !== y) container.push(accessor);
      };
    const array =
      (accessor: string) =>
      (x: any[]) =>
      (y: any[]): void => {
        if (x.length !== y.length) container.push(`${accessor}.length`);
        x.forEach((xItem, i) => iterate(`${accessor}[${i}]`)(xItem)(y[i]));
      };
    const object =
      (accessor: string) =>
      (x: any) =>
      (y: any): void =>
        Object.keys(x)
          .filter((key) => x[key] !== undefined && !exception(key))
          .forEach((key) => iterate(`${accessor}.${key}`)(x[key])(y[key]));

    iterate("")(x)(y);
    return container;
  };

const toJSON = (value: any): any =>
  value !== null &&
  typeof value === "object" &&
  typeof value.toJSON === "function"
    ? value.toJSON()
    : value;
