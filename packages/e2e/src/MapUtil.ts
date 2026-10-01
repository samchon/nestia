/**
 * A namespace providing utility functions for Map manipulation.
 *
 * This namespace contains helper functions for working with JavaScript Map
 * objects, providing convenient methods for common Map operations like
 * retrieving values with lazy initialization.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   // Create a cache with lazy initialization
 *   const cache = new Map<string, ExpensiveObject>();
 *
 *   const obj = MapUtil.take(cache, "key1", () => {
 *     console.log("Creating expensive object...");
 *     return new ExpensiveObject();
 *   });
 *
 *   // Subsequent calls return cached value without re-creating
 *   const sameObj = MapUtil.take(cache, "key1", () => new ExpensiveObject());
 *   console.log(obj === sameObj); // true
 *
 * @evidence contracts/common.md#principled-implementation The namespace offers the get-or-create pattern over the native `Map`, whose `has` distinguishes an absent key from a stored `undefined`.
 * @evidence contracts/common.md#clear-and-simple-design One function, without options or state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses only the public Map methods.
 * @evidence contracts/common.md#meaningful-documentation The comment states the lazy initialization pattern with an example.
 */
export namespace MapUtil {
  /**
   * Retrieves a value from a Map or creates it using a lazy initialization
   * function.
   *
   * This function implements the "get or create" pattern for Maps. If the key
   * exists in the Map, it returns the existing value. Otherwise, it calls the
   * provided factory function to create a new value, stores it in the Map, and
   * returns it. The factory function is only called when the key doesn't exist,
   * enabling lazy initialization and caching patterns.
   *
   * @example
   *   // Simple caching example
   *   const userCache = new Map<number, User>();
   *
   *   const user = MapUtil.take(userCache, userId, () => {
   *     // This expensive operation only runs if userId is not cached
   *     return fetchUserFromDatabase(userId);
   *   });
   *
   *   // Configuration object caching
   *   const configs = new Map<string, Config>();
   *
   *   const dbConfig = MapUtil.take(configs, "database", () => ({
   *     host: "localhost",
   *     port: 5432,
   *     database: "myapp",
   *   }));
   *
   *   // Lazy computation results
   *   const computationCache = new Map<string, number>();
   *
   *   const result = MapUtil.take(computationCache, "fibonacci-40", () => {
   *     console.log("Computing fibonacci(40)...");
   *     return fibonacci(40); // Only computed once
   *   });
   *
   *   // Using with complex keys
   *   const cache = new Map<[number, number], Matrix>();
   *   const key: [number, number] = [rows, cols];
   *
   *   const matrix = MapUtil.take(cache, key, () =>
   *     generateIdentityMatrix(rows, cols),
   *   );
   *
   * @template K - The type of keys in the Map
   * @template V - The type of values in the Map
   * @param map - The Map to retrieve from or update
   * @param key - The key to look up in the Map
   * @param value - A factory function that creates the value if key doesn't
   *   exist
   * @returns The existing value if found, or the newly created value
   * @evidence contracts/common.md#principled-implementation The key is looked up with `has`, so an existing value, even `undefined`, is returned without calling the factory; otherwise the factory is called once, its value is stored, and the same value is returned.
   * @evidence contracts/common.md#clear-and-simple-design A single check, one factory call, and one store.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory result is stored as returned, with no copying or expiry.
   * @evidence contracts/common.md#meaningful-documentation The comment states when the factory runs and documents the parameters with several examples.
   */
  export function take<K, V>(map: Map<K, V>, key: K, value: () => V): V {
    if (map.has(key)) {
      return map.get(key) as V;
    }
    const newValue = value();
    map.set(key, newValue);
    return newValue;
  }
}
