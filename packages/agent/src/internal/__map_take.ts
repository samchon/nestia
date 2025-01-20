/**
 * @internal
 */
export const __map_take = <Key, T>(
  dict: Map<Key, T>,
  key: Key,
  generator: () => T,
): T => {
  const oldbie: T | undefined = dict.get(key);
  if (oldbie) return oldbie;

  const value: T = generator();
  dict.set(key, value);
  return value;
};
