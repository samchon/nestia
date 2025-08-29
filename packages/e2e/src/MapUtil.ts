/**
 * A namespace providing utility functions for Map manipulation.
 *
 * This namespace contains helper functions for working with JavaScript Map
 * objects, providing convenient methods for common Map operations like
 * retrieving values with lazy initialization.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   ```typescript
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
 *   ```;
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
   *   ```typescript
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
   *     database: "myapp"
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
   *     generateIdentityMatrix(rows, cols)
   *   );
   *   ```;
   *
   * @template K - The type of keys in the Map
   * @template V - The type of values in the Map
   * @param map - The Map to retrieve from or update
   * @param key - The key to look up in the Map
   * @param value - A factory function that creates the value if key doesn't exist
   * @returns The existing value if found, or the newly created value
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
