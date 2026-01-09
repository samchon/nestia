/**
 * Utility namespace for Map operations and functional programming patterns.
 * 
 * Provides higher-order functions for working with Maps in a functional style,
 * particularly useful for caching and memoization patterns.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace MapUtil {
  /**
   * Creates a memoization function for a Map that gets or creates values lazily.
   * 
   * Returns a curried function that takes a Map and returns another function
   * that can retrieve or create values in that Map using a generator function.
   * This is useful for caching expensive computations or maintaining unique instances.
   * 
   * @param dict - The Map to operate on
   * @returns A function that takes a key and generator function
   */
  export const take =
    <Key, T>(dict: Map<Key, T>) =>
    (key: Key) =>
    (generator: () => T): T => {
      const oldbie: T | undefined = dict.get(key);
      if (oldbie) return oldbie;

      const value: T = generator();
      dict.set(key, value);
      return value;
    };
}
