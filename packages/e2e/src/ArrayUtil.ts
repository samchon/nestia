/**
 * A namespace providing utility functions for array manipulation.
 *
 * This namespace contains utility functions for array operations including
 * asynchronous processing, filtering, mapping, and repetition tasks implemented
 * in functional programming style. Functions use direct parameter passing for
 * simplicity while maintaining functional programming principles.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   // Asynchronous filtering example
 *   const numbers = [1, 2, 3, 4, 5];
 *   const evenNumbers = await ArrayUtil.asyncFilter(
 *     numbers,
 *     async (num) => num % 2 === 0,
 *   );
 *   console.log(evenNumbers); // [2, 4]
 *
 * @evidence contracts/common.md#principled-implementation Every asynchronous operation reduces to `asyncRepeat`, which awaits one call per index in ascending order, so filtering, mapping, and iteration are sequential and order-preserving by construction; the synchronous helpers use loops and native methods, and `subsets` is a depth-first enumeration of the include or exclude choice per element.
 * @evidence contracts/common.md#clear-and-simple-design One small function per operation, derived from one primitive for the asynchronous family, with no shared state and one private count validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No function special-cases a value, a fixture, or a caller; ordering and short-circuiting follow from the loop and the native `some`.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose states the sequential, functional style, and each function documents its parameters, its result, and an example.
 */
export namespace ArrayUtil {
  /**
   * Filters an array by applying an asynchronous predicate function to each
   * element.
   *
   * Elements are processed sequentially, ensuring order is maintained. The
   * predicate function receives the element, index, and the full array as
   * parameters.
   *
   * @example
   *   const users = [
   *     { id: 1, name: "Alice", active: true },
   *     { id: 2, name: "Bob", active: false },
   *     { id: 3, name: "Charlie", active: true },
   *   ];
   *
   *   const activeUsers = await ArrayUtil.asyncFilter(
   *     users,
   *     async (user) => {
   *       // Async validation logic (e.g., API call)
   *       await new Promise((resolve) => setTimeout(resolve, 100));
   *       return user.active;
   *     },
   *   );
   *   console.log(activeUsers); // [{ id: 1, name: 'Alice', active: true }, { id: 3, name: 'Charlie', active: true }]
   *
   * @template Input - The type of elements in the input array
   * @param elements - The readonly array to filter
   * @param pred - The asynchronous predicate function to test each element
   * @returns A Promise resolving to the filtered array
   * @evidence contracts/common.md#principled-implementation The predicate runs on each element in order and the next call starts after the previous promise settles; an element is kept only when the awaited result is exactly `true`, which the `Promise<boolean>` type guarantees for well-typed callers, and a rejection stops the iteration and rejects the result.
   * @evidence contracts/common.md#clear-and-simple-design It composes `asyncForEach` with one push instead of reimplementing the loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate alone decides inclusion; no element is skipped or retried.
   * @evidence contracts/common.md#meaningful-documentation The comment states the sequential order, the predicate arguments, and the result, with an example.
   */
  export const asyncFilter = async <Input>(
    elements: readonly Input[],
    pred: (
      elem: Input,
      index: number,
      array: readonly Input[],
    ) => Promise<boolean>,
  ): Promise<Input[]> => {
    const ret: Input[] = [];
    await asyncForEach(elements, async (elem, index, array) => {
      const flag: boolean = await pred(elem, index, array);
      if (flag === true) ret.push(elem);
    });
    return ret;
  };

  /**
   * Executes an asynchronous function for each element in an array
   * sequentially.
   *
   * Unlike JavaScript's native forEach, this function processes asynchronous
   * functions sequentially and waits for all operations to complete. It
   * performs sequential processing rather than parallel processing, making it
   * suitable for operations where order matters.
   *
   * @example
   *   const urls = ["url1", "url2", "url3"];
   *
   *   await ArrayUtil.asyncForEach(urls, async (url, index) => {
   *     console.log(`Processing ${index}: ${url}`);
   *     const data = await fetch(url);
   *     await processData(data);
   *     console.log(`Completed ${index}: ${url}`);
   *   });
   *   console.log("All URLs processed sequentially");
   *
   * @template Input - The type of elements in the input array
   * @param elements - The readonly array to process
   * @param closure - The asynchronous function to execute for each element
   * @returns A Promise<void> that resolves when all operations complete
   * @evidence contracts/common.md#principled-implementation It maps each index of the array to a closure call through `asyncRepeat`, passing the element, the index, and the array, and discards the results; because the calls are awaited one after another, a rejection ends the iteration and propagates.
   * @evidence contracts/common.md#clear-and-simple-design A single delegation to the primitive.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The closure receives every element exactly once and no error is swallowed.
   * @evidence contracts/common.md#meaningful-documentation The comment contrasts it with the native forEach, states the sequential semantics, and gives an example.
   */
  export const asyncForEach = async <Input>(
    elements: readonly Input[],
    closure: (
      elem: Input,
      index: number,
      array: readonly Input[],
    ) => Promise<any>,
  ): Promise<void> => {
    await asyncRepeat(elements.length, (index) =>
      closure(elements[index]!, index, elements),
    );
  };

  /**
   * Transforms each element of an array using an asynchronous function to
   * create a new array.
   *
   * Similar to JavaScript's native map but processes asynchronous functions
   * sequentially. Each element's transformation is completed before proceeding
   * to the next element, ensuring order is maintained.
   *
   * @example
   *   const userIds = [1, 2, 3, 4, 5];
   *
   *   const userDetails = await ArrayUtil.asyncMap(
   *     userIds,
   *     async (id, index) => {
   *       console.log(
   *         `Fetching user ${id} (${index + 1}/${userIds.length})`,
   *       );
   *       const response = await fetch(`/api/users/${id}`);
   *       return await response.json();
   *     },
   *   );
   *   console.log("All users fetched:", userDetails);
   *
   * @template Input - The type of elements in the input array
   * @template Output - The type of elements in the resulting array
   * @param elements - The readonly array to transform
   * @param closure - The asynchronous function that transforms each element
   * @returns A Promise resolving to the transformed array
   * @evidence contracts/common.md#principled-implementation The closure result of each element is pushed in iteration order, so the output order equals the input order, which holds because the calls are sequential.
   * @evidence contracts/common.md#clear-and-simple-design It composes `asyncForEach` with one push.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every element is transformed by the caller's closure, with no memoization or skipping.
   * @evidence contracts/common.md#meaningful-documentation The comment states the sequential order and the parameters, and the example calls the two-argument form the function has.
   */
  export const asyncMap = async <Input, Output>(
    elements: readonly Input[],
    closure: (
      elem: Input,
      index: number,
      array: readonly Input[],
    ) => Promise<Output>,
  ): Promise<Output[]> => {
    const ret: Output[] = [];
    await asyncForEach(elements, async (elem, index, array) => {
      const output: Output = await closure(elem, index, array);
      ret.push(output);
    });
    return ret;
  };

  /**
   * Executes an asynchronous function a specified number of times sequentially.
   *
   * Executes the function with indices from 0 to count-1 incrementally. Each
   * execution is performed sequentially, and all results are collected into an
   * array.
   *
   * @example
   *   // Generate random data 5 times
   *   const randomData = await ArrayUtil.asyncRepeat(5, async (index) => {
   *     await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 0.1 seconds
   *     return {
   *       id: index,
   *       value: Math.random(),
   *       timestamp: new Date().toISOString(),
   *     };
   *   });
   *   console.log("Generated data:", randomData);
   *
   * @template T - The type of the result from each execution
   * @param count - The number of times to repeat (integer from 0 to 2^32 - 1)
   * @param closure - The asynchronous function to execute repeatedly
   * @returns A Promise resolving to an array of results
   * @evidence contracts/common.md#principled-implementation A count outside the integer range 0 through 2^32 - 1 is refused with a `RangeError` before any callback, because JavaScript arrays cannot represent a larger length; otherwise the closure is awaited for each index from 0 to count minus one and the results are collected in order, so the cost is linear in the count with no index array.
   * @evidence contracts/common.md#clear-and-simple-design One validation and one loop; the validator is shared with `repeat`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The loop is the direct implementation of the documented behavior, and an invalid count is an error, not a coerced number.
   * @evidence contracts/common.md#meaningful-documentation The comment states the index range, the sequential execution, and the result, and the count must be a non-negative integer as documented.
   */
  export const asyncRepeat = async <T>(
    count: number,
    closure: (index: number) => Promise<T>,
  ): Promise<T[]> => {
    validate("asyncRepeat", count);
    const output: T[] = [];
    for (let index: number = 0; index < count; ++index)
      output.push(await closure(index));
    return output;
  };

  /**
   * Checks if at least one element in the array satisfies the given condition.
   *
   * Similar to JavaScript's native some() method. Returns true immediately when
   * the first element satisfying the condition is found.
   *
   * @example
   *   const numbers = [1, 3, 5, 7, 8, 9];
   *   const products = [
   *     { name: "Apple", price: 100, inStock: true },
   *     { name: "Banana", price: 50, inStock: false },
   *     { name: "Orange", price: 80, inStock: true },
   *   ];
   *
   *   const hasEvenNumber = ArrayUtil.has(numbers, (num) => num % 2 === 0);
   *   console.log(hasEvenNumber); // true (8 exists)
   *
   *   const hasExpensiveItem = ArrayUtil.has(
   *     products,
   *     (product) => product.price > 90,
   *   );
   *   console.log(hasExpensiveItem); // true (Apple costs 100)
   *
   *   const hasOutOfStock = ArrayUtil.has(
   *     products,
   *     (product) => !product.inStock,
   *   );
   *   console.log(hasOutOfStock); // true (Banana is out of stock)
   *
   * @template T - The type of elements in the array
   * @param elements - The readonly array to check
   * @param pred - The predicate function to test elements
   * @returns Boolean indicating if any element satisfies the condition
   * @evidence contracts/common.md#principled-implementation The native `some` implements the existential search and returns at the first satisfying element, and the predicate receives only the element.
   * @evidence contracts/common.md#clear-and-simple-design A one-expression delegation that keeps the native short-circuit visible.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate alone decides membership.
   * @evidence contracts/common.md#meaningful-documentation The comment states the short-circuit and gives examples.
   */
  export const has = <T>(
    elements: readonly T[],
    pred: (elem: T) => boolean,
  ): boolean => elements.some((elem) => pred(elem));

  /**
   * Executes a function a specified number of times and collects the results
   * into an array.
   *
   * A synchronous repetition function that executes the given function for each
   * index (from 0 to count-1) and collects the results into an array.
   *
   * @example
   *   // Generate an array of squares from 1 to 5
   *   const squares = ArrayUtil.repeat(5, (index) => (index + 1) ** 2);
   *   console.log(squares); // [1, 4, 9, 16, 25]
   *
   *   // Generate an array of default user objects
   *   const users = ArrayUtil.repeat(3, (index) => ({
   *     id: index + 1,
   *     name: `User${index + 1}`,
   *     email: `user${index + 1}@example.com`,
   *   }));
   *   console.log(users);
   *   // [
   *   //   { id: 1, name: 'User1', email: 'user1@example.com' },
   *   //   { id: 2, name: 'User2', email: 'user2@example.com' },
   *   //   { id: 3, name: 'User3', email: 'user3@example.com' }
   *   // ]
   *
   * @template T - The type of the result from each execution
   * @param count - The number of times to repeat (integer from 0 to 2^32 - 1)
   * @param closure - The function to execute repeatedly
   * @returns An array of results
   * @evidence contracts/common.md#principled-implementation An invalid count is refused with a `RangeError`, and otherwise the closure is called for each index from 0 to count minus one and the results are collected in order, with cost linear in the count.
   * @evidence contracts/common.md#clear-and-simple-design The synchronous counterpart of `asyncRepeat`, sharing its validator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The loop implements the documented behavior directly.
   * @evidence contracts/common.md#meaningful-documentation The comment states the index range and the result, with examples.
   */
  export const repeat = <T>(
    count: number,
    closure: (index: number) => T,
  ): T[] => {
    validate("repeat", count);
    const output: T[] = [];
    for (let index: number = 0; index < count; ++index)
      output.push(closure(index));
    return output;
  };

  /**
   * Generates all possible subsets of a given array.
   *
   * Implements the mathematical concept of power set, generating 2^n subsets
   * from an array of n elements. Uses depth-first search (DFS) algorithm to
   * calculate all possible combinations of including or excluding each element.
   * Each element is included before it is excluded, so the first subset is the
   * whole array and the last one is empty.
   *
   * @example
   *   const numbers = [1, 2, 3];
   *   const allSubsets = ArrayUtil.subsets(numbers);
   *   console.log(allSubsets);
   *   // [
   *   //   [1, 2, 3],    // {1, 2, 3}
   *   //   [1, 2],       // {1, 2}
   *   //   [1, 3],       // {1, 3}
   *   //   [1],          // {1}
   *   //   [2, 3],       // {2, 3}
   *   //   [2],          // {2}
   *   //   [3],          // {3}
   *   //   []            // empty set
   *   // ]
   *
   *   const colors = ["red", "blue"];
   *   const colorSubsets = ArrayUtil.subsets(colors);
   *   console.log(colorSubsets);
   *   // [
   *   //   ['red', 'blue'],
   *   //   ['red'],
   *   //   ['blue'],
   *   //   []
   *   // ]
   *
   *   // Warning: Result size grows exponentially with array size
   *   // Example: 10 elements → 1,024 subsets, 20 elements → 1,048,576 subsets
   *
   * @template T - The type of elements in the array
   * @param array - The array to generate subsets from
   * @returns An array containing all possible subsets
   * @evidence contracts/common.md#principled-implementation A depth-first search decides for each position whether the element is in the subset, including it first, and each leaf materializes the chosen elements with `filter`, so the 2^n subsets appear in a fixed order, the whole array first and the empty array last; the recursion depth is the array length and the output size is exponential, which bounds the useful input size.
   * @evidence contracts/common.md#clear-and-simple-design One recursive function over a mask, with no options.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It enumerates every subset without sampling or a size cap, and the array is not mutated.
   * @evidence contracts/common.md#meaningful-documentation The comment states the power-set meaning, the exact enumeration order, and the exponential growth warning, and the examples show that order.
   */
  export const subsets = <T>(array: T[]): T[][] => {
    const check: boolean[] = new Array(array.length).fill(false);
    const output: T[][] = [];

    const dfs = (depth: number): void => {
      if (depth === check.length)
        output.push(array.filter((_v, idx) => check[idx]));
      else {
        check[depth] = true;
        dfs(depth + 1);

        check[depth] = false;
        dfs(depth + 1);
      }
    };
    dfs(0);
    return output;
  };

  const validate = (method: string, count: number): void => {
    if (!Number.isSafeInteger(count) || count < 0 || count > 0xffffffff)
      throw new RangeError(
        `ArrayUtil.${method}(): count must be a non-negative integer.`,
      );
  };
}
