/**
 * The entries of a `URLSearchParams` or `FormData` as a plain object: a key
 * given once maps to its value, a repeated key to all of its values in order.
 *
 * @internal
 */
export const group_entries = <Value>(source: {
  keys(): Iterable<string>;
  getAll(key: string): Value[];
}): Record<string, Value | Value[]> => {
  const output: Record<string, Value | Value[]> = {};
  for (const key of new Set(source.keys())) {
    const values: Value[] = source.getAll(key);
    output[key] = values.length === 1 ? values[0]! : values;
  }
  return output;
};
