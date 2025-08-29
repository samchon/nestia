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
 *   ```typescript
 *   // Asynchronous filtering example
 *   const numbers = [1, 2, 3, 4, 5];
 *   const evenNumbers = await ArrayUtil.asyncFilter(numbers,
 *     async (num) => num % 2 === 0
 *   );
 *   console.log(evenNumbers); // [2, 4]
 *   ```;
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
   *   ```typescript
   *   const users = [
   *     { id: 1, name: 'Alice', active: true },
   *     { id: 2, name: 'Bob', active: false },
   *     { id: 3, name: 'Charlie', active: true }
   *   ];
   *
   *   const activeUsers = await ArrayUtil.asyncFilter(users,
   *     async (user) => {
   *       // Async validation logic (e.g., API call)
   *       await new Promise(resolve => setTimeout(resolve, 100));
   *       return user.active;
   *     }
   *   );
   *   console.log(activeUsers); // [{ id: 1, name: 'Alice', active: true }, { id: 3, name: 'Charlie', active: true }]
   *   ```;
   *
   * @template Input - The type of elements in the input array
   * @param elements - The readonly array to filter
   * @param pred - The asynchronous predicate function to test each element
   * @returns A Promise resolving to the filtered array
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
   *   ```typescript
   *   const urls = ['url1', 'url2', 'url3'];
   *
   *   await ArrayUtil.asyncForEach(urls, async (url, index) => {
   *   console.log(`Processing ${index}: ${url}`);
   *   const data = await fetch(url);
   *   await processData(data);
   *   console.log(`Completed ${index}: ${url}`);
   *   });
   *   console.log('All URLs processed sequentially');
   *   ```
   *
   * @template Input - The type of elements in the input array
   * @param elements - The readonly array to process
   * @param closure - The asynchronous function to execute for each element
   * @returns A Promise<void> that resolves when all operations complete
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
      closure(elements[index], index, elements),
    );
  };

  /**
   * Transforms each element of an array using an asynchronous function to
   * create a new array.
   *
   * Similar to JavaScript's native map but processes asynchronous functions
   * sequentially. Each element's transformation is completed before proceeding
   * to the next element, ensuring order is maintained. This function still
   * maintains the currying pattern for composition.
   *
   * @example
   *   ```typescript
   *   const userIds = [1, 2, 3, 4, 5];
   *
   *   const userDetails = await ArrayUtil.asyncMap(userIds)(
   *   async (id, index) => {
   *   console.log(`Fetching user ${id} (${index + 1}/${userIds.length})`);
   *   const response = await fetch(`/api/users/${id}`);
   *   return await response.json();
   *   }
   *   );
   *   console.log('All users fetched:', userDetails);
   *   ```
   *
   * @template Input - The type of elements in the input array
   * @param elements - The readonly array to transform
   * @returns A function that takes a transformation function and returns a
   *   Promise resolving to the transformed array
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
   *   ```typescript
   *   // Generate random data 5 times
   *   const randomData = await ArrayUtil.asyncRepeat(5, async (index) => {
   *     await new Promise(resolve => setTimeout(resolve, 100)); // Wait 0.1 seconds
   *     return {
   *       id: index,
   *       value: Math.random(),
   *       timestamp: new Date().toISOString()
   *     };
   *   });
   *   console.log('Generated data:', randomData);
   *   ```;
   *
   * @template T - The type of the result from each execution
   * @param count - The number of times to repeat (non-negative integer)
   * @param closure - The asynchronous function to execute repeatedly
   * @returns A Promise resolving to an array of results
   */
  export const asyncRepeat = async <T>(
    count: number,
    closure: (index: number) => Promise<T>,
  ): Promise<T[]> => {
    const indexes: number[] = new Array(count).fill(1).map((_, index) => index);
    const output: T[] = [];
    for (const index of indexes) output.push(await closure(index));
    return output;
  };

  /**
   * Checks if at least one element in the array satisfies the given condition.
   *
   * Similar to JavaScript's native some() method. Returns true immediately when
   * the first element satisfying the condition is found.
   *
   * @example
   *   ```typescript
   *   const numbers = [1, 3, 5, 7, 8, 9];
   *   const products = [
   *     { name: 'Apple', price: 100, inStock: true },
   *     { name: 'Banana', price: 50, inStock: false },
   *     { name: 'Orange', price: 80, inStock: true }
   *   ];
   *
   *   const hasEvenNumber = ArrayUtil.has(numbers, num => num % 2 === 0);
   *   console.log(hasEvenNumber); // true (8 exists)
   *
   *   const hasExpensiveItem = ArrayUtil.has(products, product => product.price > 90);
   *   console.log(hasExpensiveItem); // true (Apple costs 100)
   *
   *   const hasOutOfStock = ArrayUtil.has(products, product => !product.inStock);
   *   console.log(hasOutOfStock); // true (Banana is out of stock)
   *   ```;
   *
   * @template T - The type of elements in the array
   * @param elements - The readonly array to check
   * @param pred - The predicate function to test elements
   * @returns Boolean indicating if any element satisfies the condition
   */
  export const has = <T>(
    elements: readonly T[],
    pred: (elem: T) => boolean,
  ): boolean => elements.find(pred) !== undefined;

  /**
   * Executes a function a specified number of times and collects the results
   * into an array.
   *
   * A synchronous repetition function that executes the given function for each
   * index (from 0 to count-1) and collects the results into an array.
   *
   * @example
   *   ```typescript
   *   // Generate an array of squares from 1 to 5
   *   const squares = ArrayUtil.repeat(5, index => (index + 1) ** 2);
   *   console.log(squares); // [1, 4, 9, 16, 25]
   *
   *   // Generate an array of default user objects
   *   const users = ArrayUtil.repeat(3, index => ({
   *   id: index + 1,
   *   name: `User${index + 1}`,
   *   email: `user${index + 1}@example.com`
   *   }));
   *   console.log(users);
   *   // [
   *   //   { id: 1, name: 'User1', email: 'user1@example.com' },
   *   //   { id: 2, name: 'User2', email: 'user2@example.com' },
   *   //   { id: 3, name: 'User3', email: 'user3@example.com' }
   *   // ]
   *   ```
   *
   * @template T - The type of the result from each execution
   * @param count - The number of times to repeat (non-negative integer)
   * @param closure - The function to execute repeatedly
   * @returns An array of results
   */
  export const repeat = <T>(
    count: number,
    closure: (index: number) => T,
  ): T[] => new Array(count).fill("").map((_, index) => closure(index));

  /**
   * Generates all possible subsets of a given array.
   *
   * Implements the mathematical concept of power set, generating 2^n subsets
   * from an array of n elements. Uses depth-first search (DFS) algorithm to
   * calculate all possible combinations of including or excluding each
   * element.
   *
   * @example
   *   ```typescript
   *   const numbers = [1, 2, 3];
   *   const allSubsets = ArrayUtil.subsets(numbers);
   *   console.log(allSubsets);
   *   // [
   *   //   [],           // empty set
   *   //   [3],          // {3}
   *   //   [2],          // {2}
   *   //   [2, 3],       // {2, 3}
   *   //   [1],          // {1}
   *   //   [1, 3],       // {1, 3}
   *   //   [1, 2],       // {1, 2}
   *   //   [1, 2, 3]     // {1, 2, 3}
   *   // ]
   *
   *   const colors = ['red', 'blue'];
   *   const colorSubsets = ArrayUtil.subsets(colors);
   *   console.log(colorSubsets);
   *   // [
   *   //   [],
   *   //   ['blue'],
   *   //   ['red'],
   *   //   ['red', 'blue']
   *   // ]
   *
   *   // Warning: Result size grows exponentially with array size
   *   // Example: 10 elements → 1,024 subsets, 20 elements → 1,048,576 subsets
   *   ```;
   *
   * @template T - The type of elements in the array
   * @param array - The array to generate subsets from
   * @returns An array containing all possible subsets
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
}
