import { RandomGenerator } from "./RandomGenerator";
import { json_equal_to } from "./internal/json_equal_to";

/**
 * A comprehensive collection of E2E validation utilities for testing
 * applications.
 *
 * TestValidator provides type-safe validation functions for common testing
 * scenarios including condition checking, equality validation, error testing,
 * HTTP error validation, pagination testing, search functionality validation,
 * and sorting validation.
 *
 * Most functions use direct parameter passing for simplicity, while some
 * maintain currying patterns for advanced composition. All provide detailed
 * error messages for debugging failed assertions.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   // Basic condition testing
 *   TestValidator.predicate(
 *     "user should be authenticated",
 *     user.isAuthenticated,
 *   );
 *
 *   // Equality validation
 *   TestValidator.equals("API response should match expected", x, y);
 *
 *   // Error validation
 *   TestValidator.error("should throw on invalid input", () =>
 *     assertInput(""),
 *   );
 *
 * @evidence contracts/common.md#principled-implementation Each validator runs a check and throws an `Error` whose message begins with `Bug on <title>`, returning a promise only when its input is asynchronous, so the same function serves synchronous and asynchronous tests; the comparison helpers read values through their JSON form, which is the form an HTTP API delivers.
 * @evidence contracts/common.md#clear-and-simple-design One function per assertion kind, sharing the JSON comparison (`json_equal_to`) and two small module helpers (`is_promise` and `is_sorted`), with the curried forms only where a request must be prepared once and run twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Assertions compare the values they are given; none consults a fixture, an entity name, or an environment.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose lists the assertion families and the error message convention, with examples.
 */
export namespace TestValidator {
  /**
   * Validates that a given condition evaluates to true.
   *
   * Supports synchronous boolean values, synchronous functions returning
   * boolean, and asynchronous functions returning Promise<boolean>. The return
   * type is automatically inferred based on the input type.
   *
   * @example
   *   // Synchronous boolean
   *   TestValidator.predicate("user should exist", user !== null);
   *
   *   // Synchronous function
   *   TestValidator.predicate(
   *     "array should be empty",
   *     () => arr.length === 0,
   *   );
   *
   *   // Asynchronous function
   *   await TestValidator.predicate(
   *     "database should be connected",
   *     async () => await db.ping(),
   *   );
   *
   * @param title - Descriptive title used in error messages when validation
   *   fails
   * @param condition - The condition to validate (boolean, function, or async
   *   function)
   * @returns Void or Promise<void> based on the input type
   * @throws Error with descriptive message when condition is not satisfied
   * @evidence contracts/common.md#principled-implementation A boolean, a function returning a boolean, or a function returning a promise of a boolean is evaluated, and only the exact value `true` passes; a false result throws the same `Error` in all three forms, and the asynchronous form rejects with it.
   * @evidence contracts/common.md#clear-and-simple-design One function whose three branches differ only in when the value is available.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The check is on the value the caller gives, with no truthiness coercion.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the three forms, the parameters, the return type rule, and the thrown error, with examples.
   */
  export function predicate<
    T extends boolean | (() => boolean) | (() => Promise<boolean>),
  >(
    title: string,
    condition: T,
  ): T extends () => Promise<boolean> ? Promise<void> : void {
    const message = () =>
      `Bug on ${title}: expected condition is not satisfied.`;

    // SCALAR
    if (typeof condition === "boolean") {
      if (condition !== true) throw new Error(message());
      return undefined as any;
    }

    // CLOSURE
    const output: boolean | Promise<boolean> = condition();
    if (typeof output === "boolean") {
      if (output !== true) throw new Error(message());
      return undefined as any;
    }

    // ASYNCHRONOUS
    return new Promise<void>((resolve, reject) => {
      output
        .then((flag) => {
          if (flag === true) resolve();
          else reject(new Error(message()));
        })
        .catch(reject);
    }) as any;
  }

  /**
   * Validates deep equality between two values using JSON comparison.
   *
   * Performs recursive comparison of objects and arrays through their JSON
   * form. The comparison walks the keys of the first value, so a key that only
   * the second value has is ignored, which is why the second value may be a
   * subtype of the first. Keys whose value in the first value is `undefined`
   * are skipped, and arrays must have the same length. Supports an optional
   * exception filter to ignore specific keys during comparison. Useful for
   * validating API responses, data transformations, and object state changes.
   *
   * @example
   *   // Basic equality
   *   TestValidator.equals(
   *     "response should match expected",
   *     expectedUser,
   *     actualUser,
   *   );
   *
   *   // Ignore timestamps in comparison
   *   TestValidator.equals(
   *     "user data should match",
   *     expectedUser,
   *     actualUser,
   *     (key) => key === "updatedAt",
   *   );
   *
   *   // Validate API response structure
   *   TestValidator.equals(
   *     "API response structure",
   *     { id: 1, name: "John" },
   *     { id: 1, name: "John" },
   *   );
   *
   *   // Type-safe nullable comparisons
   *   const nullableData: { name: string } | null = getData();
   *   TestValidator.equals("nullable check", nullableData, null);
   *
   * @param title - Descriptive title used in error messages when values differ
   * @param X - The first value to compare
   * @param y - The second value to compare (can be null or undefined)
   * @param exception - Optional filter function to exclude specific keys from
   *   comparison
   * @throws Error with detailed diff information when values are not equal
   * @evidence contracts/common.md#principled-implementation Both values are compared through `json_equal_to`, which walks the keys of the first value, so the second value may carry extra keys and the typing `Y extends X` states that; the differing accessors are listed in the error with both values serialized.
   * @evidence contracts/common.md#clear-and-simple-design A thin wrapper over the shared comparison that adds the message.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exception filter is the caller's; the function contains no key name of its own.
   * @evidence contracts/common.md#meaningful-documentation The comment states the JSON form, the key-walking rule with its consequence for extra keys, the array length rule, and the exception filter, with examples.
   */
  export function equals<X, Y extends X = X>(
    title: string,
    X: X,
    y: Y | null | undefined,
    exception?: (key: string) => boolean,
  ): void {
    const diff: string[] = json_equal_to(exception ?? (() => false))(X)(y);
    if (diff.length)
      throw new Error(
        [
          `Bug on ${title}: found different values - [${diff.join(", ")}]:`,
          "\n",
          JSON.stringify({ x: X, y }, null, 2),
        ].join("\n"),
      );
  }

  /**
   * Validates deep inequality between two values using JSON comparison.
   *
   * Performs recursive comparison of objects and arrays to ensure they are NOT
   * equal, by the same rules as {@link equals}: only the keys of the first value
   * are compared, so a key that only the second value has does not make them
   * different. Supports an optional exception filter to ignore specific keys
   * during comparison. Useful for validating that data has changed, objects are
   * different, or mutations have occurred.
   *
   * @example
   *   // Basic inequality
   *   TestValidator.notEquals(
   *     "user should be different after update",
   *     originalUser,
   *     updatedUser,
   *   );
   *
   *   // Ignore timestamps in comparison
   *   TestValidator.notEquals(
   *     "user data should differ",
   *     originalUser,
   *     modifiedUser,
   *     (key) => key === "updatedAt",
   *   );
   *
   *   // Validate state changes
   *   TestValidator.notEquals(
   *     "state should have changed",
   *     initialState,
   *     currentState,
   *   );
   *
   *   // Type-safe nullable comparisons
   *   const mutableData: { count: number } | null = getMutableData();
   *   TestValidator.notEquals("should have changed", mutableData, null);
   *
   * @param title - Descriptive title used in error messages when values are
   *   equal
   * @param x - The first value to compare
   * @param y - The second value to compare (can be null or undefined)
   * @param exception - Optional filter function to exclude specific keys from
   *   comparison
   * @throws Error when values are equal (indicating validation failure)
   * @evidence contracts/common.md#principled-implementation It runs the same comparison as `equals` and fails when the comparison finds no difference, so two values differing only by extra keys of the second are considered equal and fail.
   * @evidence contracts/common.md#clear-and-simple-design A thin wrapper over the shared comparison with the opposite outcome.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exception filter is the caller's; the function contains no key name of its own.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the rules are those of `equals`, and gives examples.
   */
  export function notEquals<X, Y extends X = X>(
    title: string,
    x: X,
    y: Y | null | undefined,
    exception?: (key: string) => boolean,
  ): void {
    const diff: string[] = json_equal_to(exception ?? (() => false))(x)(y);
    if (diff.length === 0)
      throw new Error(
        [
          `Bug on ${title}: values should be different but are equal:`,
          "\n",
          JSON.stringify({ x, y }, null, 2),
        ].join("\n"),
      );
  }

  /**
   * Validates that a function throws an error or rejects when executed.
   *
   * Expects the provided function to fail. If the function executes
   * successfully without throwing an error or rejecting, this validator will
   * throw an exception. Supports both synchronous and asynchronous functions.
   *
   * @example
   *   // Synchronous error validation
   *   TestValidator.error("should reject invalid email", () =>
   *     validateEmail("invalid-email"),
   *   );
   *
   *   // Asynchronous error validation
   *   await TestValidator.error(
   *     "should reject unauthorized access",
   *     async () => await api.functional.getSecretData(),
   *   );
   *
   *   // Validate input validation
   *   TestValidator.error("should throw on empty string", () =>
   *     processRequiredInput(""),
   *   );
   *
   * @param title - Descriptive title used in error messages when no error
   *   occurs
   * @param task - The function that should throw an error or reject
   * @returns Void or Promise<void> based on the input type
   * @throws Error when the task function does not throw an error or reject
   * @evidence contracts/common.md#principled-implementation The task is run inside a `try` so that only its own throw counts, a promise is awaited and a rejection counts as the expected error, and a task that neither throws nor rejects raises the failure outside the `try`, so the failure cannot be swallowed.
   * @evidence contracts/common.md#clear-and-simple-design One function with a synchronous and an asynchronous path selected by the returned value.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Any error satisfies it, as documented, and no error type is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states that an exception is required, the return type rule, and the thrown error, with examples.
   */
  export function error<T>(
    title: string,
    task: () => T,
  ): T extends Promise<any> ? Promise<void> : void {
    const message = () => `Bug on ${title}: exception must be thrown.`;
    // only the task's own throw is caught: the failure below must escape
    let output: T;
    try {
      output = task();
    } catch {
      return undefined as any;
    }
    if (is_promise(output))
      return new Promise<void>((resolve, reject) =>
        output.catch(() => resolve()).then(() => reject(new Error(message()))),
      ) as any;
    throw new Error(message());
  }

  /**
   * Validates that a function throws an HTTP error with specific status codes.
   *
   * Specialized error validator for HTTP operations. Validates that the
   * function throws an HttpError with one of the specified status codes. Useful
   * for testing API endpoints, authentication, and authorization logic.
   *
   * @example
   *   // Validate 401 Unauthorized
   *   await TestValidator.httpError(
   *     "should return 401 for invalid token",
   *     401,
   *     async () =>
   *       await api.functional.getProtectedResource("invalid-token"),
   *   );
   *
   *   // Validate multiple possible error codes
   *   await TestValidator.httpError(
   *     "should return client error",
   *     [400, 404, 422],
   *     async () => await api.functional.updateNonexistentResource(data),
   *   );
   *
   *   // Validate server errors
   *   TestValidator.httpError(
   *     "should handle server errors",
   *     [500, 502, 503],
   *     () => callFaultyEndpoint(),
   *   );
   *
   * @param title - Descriptive title used in error messages
   * @param status - Expected status code(s), can be a single number or array
   * @param task - The function that should throw an HttpError
   * @returns Void or Promise<void> based on the input type
   * @throws Error when function doesn't throw HttpError or status code doesn't
   *   match
   * @evidence contracts/common.md#principled-implementation The thrown value must expose a constructor named `HttpError` and one expected numeric status, matched by name because generated SDKs define their own classes. Missing or throwing properties make classification fail instead of escaping the expectation. The returned promise chain propagates rejection-handler failures without leaving a separately bridged promise pending.
   * @evidence contracts/common.md#clear-and-simple-design One predicate reads the thrown value once and is shared by the synchronous and asynchronous paths; asynchronous settlement uses the task's own promise chain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The check follows the documented error shape, not a specific SDK or status list.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the status argument, the two task kinds, and the thrown error, with examples.
   */
  export function httpError<T>(
    title: string,
    status: number | number[],
    task: () => T,
  ): T extends Promise<any> ? Promise<void> : void {
    if (typeof status === "number") status = [status];
    const message = (actual?: number) =>
      typeof actual === "number"
        ? `Bug on ${title}: status code must be ${status.join(
            " or ",
          )}, but ${actual}.`
        : `Bug on ${title}: status code must be ${status.join(
            " or ",
          )}, but succeeded.`;
    const predicate = (exp: any): Error | null => {
      let actual: number | undefined;
      try {
        if (
          typeof exp === "object" &&
          exp !== null &&
          exp.constructor?.name === "HttpError"
        ) {
          const value: unknown = exp.status;
          if (typeof value === "number") actual = value;
        }
      } catch {
        // A thrown value with unreadable properties cannot establish an
        // HTTP status; it fails the same expectation as any other value.
      }
      return actual !== undefined && status.some((val) => val === actual)
        ? null
        : new Error(message(actual));
    };
    try {
      const output: T = task();
      if (is_promise(output))
        return output.then(
          () => {
            throw new Error(message());
          },
          (exp) => {
            const res: Error | null = predicate(exp);
            if (res) throw res;
          },
        ) as any;
      else throw new Error(message());
    } catch (exp) {
      const res: Error | null = predicate(exp);
      if (res) throw res;
      return undefined!;
    }
  }

  /**
   * Validates pagination index API results against expected entity order.
   *
   * Compares the order of entities returned by a pagination API with manually
   * sorted expected results. Validates that entity IDs appear in the correct
   * sequence. Commonly used for testing database queries, search results, and
   * any paginated data APIs.
   *
   * A page holds the first entities, so only the common prefix of the two lists
   * is compared. An empty result against expected entities, or the reverse,
   * fails.
   *
   * @example
   *   // Test article pagination
   *   const expectedArticles = await db.articles.findAll({
   *     order: "created_at DESC",
   *   });
   *   const actualArticles = await api.functional.getArticles({
   *     page: 1,
   *     limit: 10,
   *   });
   *
   *   TestValidator.index(
   *     "article pagination order",
   *     expectedArticles,
   *     actualArticles,
   *     true, // enable trace logging
   *   );
   *
   *   // Test user search results
   *   const manuallyFilteredUsers = allUsers.filter((u) =>
   *     u.name.includes("John"),
   *   );
   *   const apiSearchResults = await api.functional.searchUsers({
   *     query: "John",
   *   });
   *
   *   TestValidator.index(
   *     "user search results",
   *     manuallyFilteredUsers,
   *     apiSearchResults,
   *   );
   *
   * @param title - Descriptive title used in error messages when order differs
   * @param expected - The expected entities in correct order
   * @param gotten - The actual entities returned by the API
   * @param trace - Optional flag to enable debug logging (default: false)
   * @throws Error when entity order differs between expected and actual results
   *   over their common prefix, or when exactly one of them is empty
   * @evidence contracts/common.md#principled-implementation A page holds the first entities of the expected list, so the two id lists are compared over their common prefix, and one side being empty while the other is not is a difference because there is no prefix to compare; ids are compared as strings.
   * @evidence contracts/common.md#clear-and-simple-design One function over the id lists produced by a private helper, with an optional trace flag.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only ids are compared, with no entity type or field named in the function.
   * @evidence contracts/common.md#meaningful-documentation The comment states the prefix rule, the empty rule, the trace flag, and the thrown error, with examples.
   */
  export const index = <X extends IEntity<any>, Y extends X = X>(
    title: string,
    expected: X[],
    gotten: Y[],
    trace: boolean = false,
  ): void => {
    // a page holds the first entities, so only the common prefix is compared,
    // but an empty side against a non-empty one has no prefix to prove
    if ((expected.length === 0) !== (gotten.length === 0)) {
      if (trace === true)
        console.log({
          expected: get_ids(expected),
          gotten: get_ids(gotten),
        });
      throw new Error(
        `Bug on ${title}: result of the index is different with manual aggregation.`,
      );
    }
    const length: number = Math.min(expected.length, gotten.length);
    expected = expected.slice(0, length);
    gotten = gotten.slice(0, length);

    const xIds: string[] = get_ids(expected).slice(0, length);
    const yIds: string[] = get_ids(gotten).slice(0, length);

    const equals: boolean = xIds.every((x, i) => x === yIds[i]);
    if (equals === true) return;
    else if (trace === true)
      console.log({
        expected: xIds,
        gotten: yIds,
      });
    throw new Error(
      `Bug on ${title}: result of the index is different with manual aggregation.`,
    );
  };

  /**
   * Validates search functionality by testing API results against manual
   * filtering.
   *
   * Comprehensive search validation that samples entities from a complete
   * dataset, extracts search values, applies manual filtering, calls the search
   * API, and compares results. Validates that search APIs return the correct
   * subset of data matching the search criteria.
   *
   * @example
   *   // Test article search functionality with exact matching
   *   const allArticles = await db.articles.findAll();
   *   const searchValidator = TestValidator.search(
   *     "article search API",
   *     (req) => api.searchArticles(req),
   *     allArticles,
   *     5, // test with 5 random samples
   *   );
   *
   *   // Test exact match search
   *   await searchValidator({
   *     fields: ["title"],
   *     values: (article) => [article.title], // full title for exact match
   *     filter: (article, [title]) => article.title === title, // exact match
   *     request: ([title]) => ({ search: { title } }),
   *   });
   *
   *   // Test partial match search with includes
   *   await searchValidator({
   *     fields: ["content"],
   *     values: (article) => [article.content.substring(0, 20)], // partial content
   *     filter: (article, [keyword]) => article.content.includes(keyword),
   *     request: ([keyword]) => ({ q: keyword }),
   *   });
   *
   *   // Test multi-field search with exact matching
   *   await searchValidator({
   *     fields: ["writer", "title"],
   *     values: (article) => [article.writer, article.title],
   *     filter: (article, [writer, title]) =>
   *       article.writer === writer && article.title === title,
   *     request: ([writer, title]) => ({ search: { writer, title } }),
   *   });
   *
   * @param title - Descriptive title used in error messages when search fails
   * @param getter - API function that performs the search
   * @param total - Complete dataset to sample from for testing
   * @param sampleCount - Number of random samples to test (default: 1)
   * @returns A function that accepts search configuration properties
   * @throws Error when API search results don't match manual filtering results
   * @evidence contracts/common.md#principled-implementation A sample of entities is drawn, the search values are read from each, the expected set is computed by a manual filter over the whole dataset, the API is called with the request built from the values, and `index` compares the two lists, so the API is checked against a filter the test author wrote independently.
   * @evidence contracts/common.md#clear-and-simple-design The function is curried so the dataset and the API are given once and each search configuration is run against them, and the comparison is delegated to `index`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The sample, values, filter, and request all come from the caller's configuration.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the steps, the parameters, and the thrown error, with examples.
   */
  export const search =
    <Entity extends IEntity<any>, Request>(
      title: string,
      getter: (input: Request) => Promise<Entity[]>,
      total: Entity[],
      sampleCount: number = 1,
    ) =>
    async <Values extends any[]>(
      props: ISearchProps<Entity, Values, Request>,
    ) => {
      const samples: Entity[] = RandomGenerator.sample(total, sampleCount);
      for (const s of samples) {
        const values: Values = props.values(s);
        const filtered: Entity[] = total.filter((entity) =>
          props.filter(entity, values),
        );
        const gotten: Entity[] = await getter(props.request(values));
        TestValidator.index(
          `${title} (${props.fields.join(", ")})`,
          filtered,
          gotten,
        );
      }
    };

  /**
   * Configuration interface for search validation functionality.
   *
   * Defines the structure needed to validate search operations by specifying
   * how to extract search values from entities, filter the dataset manually,
   * and construct API requests.
   *
   * @template Entity - Type of entities being searched, must have an ID field
   * @template Values - Tuple type representing the search values extracted from
   *   entities
   * @template Request - Type of the API request object
   * @evidence contracts/common.md#principled-implementation The record supplies what the check needs from a test author: the field names for the message and the three functions that extract values, filter, and build the request.
   * @evidence contracts/common.md#clear-and-simple-design A four-member record with the functions as methods.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the role of the record and each member documents itself.
   */
  export interface ISearchProps<
    Entity extends IEntity<any>,
    Values extends any[],
    Request,
  > {
    /** Field names being searched, used in error messages for identification */
    fields: string[];

    /**
     * Extracts search values from a sample entity
     *
     * @param entity - The entity to extract search values from
     * @returns Tuple of values used for searching
     * @evidence contracts/common.md#principled-implementation The search values are read from a sampled entity, so the search is exercised with values that occur in the dataset.
     * @evidence contracts/common.md#clear-and-simple-design One method with one entity argument.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is caller code.
     * @evidence contracts/common.md#meaningful-documentation The comment documents the parameter and the return value.
     */
    values(entity: Entity): Values;

    /**
     * Manual filter function to determine if an entity matches search criteria
     *
     * @param entity - Entity to test against criteria
     * @param values - Search values to match against
     * @returns True if entity matches the search criteria
     * @evidence contracts/common.md#principled-implementation The predicate decides whether an entity matches the values, which is the manual reference against which the API is compared.
     * @evidence contracts/common.md#clear-and-simple-design One predicate over an entity and the values.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is caller code.
     * @evidence contracts/common.md#meaningful-documentation The comment documents the parameters and the return value.
     */
    filter(entity: Entity, values: Values): boolean;

    /**
     * Constructs API request object from search values
     *
     * @param values - Search values to include in request
     * @returns Request object for the search API
     * @evidence contracts/common.md#principled-implementation The function builds the API request from the values, so the same values drive the manual filter and the call.
     * @evidence contracts/common.md#clear-and-simple-design One method from values to the request.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is caller code.
     * @evidence contracts/common.md#meaningful-documentation The comment documents the parameter and the return value.
     */
    request(values: Values): Request;
  }

  /**
   * Validates sorting functionality of pagination APIs.
   *
   * Tests sorting operations by calling the API with sort parameters and
   * validating that results are correctly ordered. Supports multiple fields,
   * ascending/descending order, and optional filtering. Provides detailed error
   * reporting for sorting failures.
   *
   * @example
   *   // Test single field sorting with GaffComparator
   *   const sortValidator = TestValidator.sort(
   *     "article sorting",
   *     (sortable) => api.getArticles({ sort: sortable }),
   *   )("created_at")(GaffComparator.dates((a) => a.created_at));
   *
   *   await sortValidator("+"); // ascending
   *   await sortValidator("-"); // descending
   *
   *   // Test multi-field sorting with GaffComparator
   *   const userSortValidator = TestValidator.sort(
   *     "user sorting",
   *     (sortable) => api.getUsers({ sort: sortable }),
   *   )("lastName", "firstName")(
   *     GaffComparator.strings((user) => [user.lastName, user.firstName]),
   *     (user) => user.isActive, // only test active users
   *   );
   *
   *   await userSortValidator("+", true); // ascending with trace logging
   *
   *   // Custom comparator for complex logic
   *   const customSortValidator = TestValidator.sort(
   *     "custom sorting",
   *     (sortable) => api.getProducts({ sort: sortable }),
   *   )(
   *     "price",
   *     "rating",
   *   )((a, b) => {
   *     const priceDiff = a.price - b.price;
   *     return priceDiff !== 0 ? priceDiff : b.rating - a.rating; // price asc, rating desc
   *   });
   *
   * @param title - Descriptive title used in error messages when sorting fails
   * @param getter - API function that fetches sorted data
   * @returns A currying function chain: field names, comparator, then direction
   * @throws Error when API results are not properly sorted according to
   *   specification
   * @evidence contracts/common.md#principled-implementation The API is called with the signed field names, its result is optionally filtered, and the comparator (reversed for the descending direction) is applied to adjacent pairs, so any adjacent pair out of order fails; checking adjacent pairs suffices for a total preorder.
   * @evidence contracts/common.md#clear-and-simple-design The function is curried in three steps so the request, the comparator, and the direction can be given at the moments each is known.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The order is judged by the caller's comparator, with no field or direction special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment documents each stage, the parameters, and the thrown error, with examples.
   */
  export const sort =
    <
      T extends object,
      Fields extends string,
      Sortable extends Array<`-${Fields}` | `+${Fields}`> = Array<
        `-${Fields}` | `+${Fields}`
      >,
    >(
      title: string,
      getter: (sortable: Sortable) => Promise<T[]>,
    ) =>
    (...fields: Fields[]) =>
    (comp: (x: T, y: T) => number, filter?: (elem: T) => boolean) =>
    async (direction: "+" | "-", trace: boolean = false) => {
      let data: T[] = await getter(
        fields.map((field) => `${direction}${field}` as const) as Sortable,
      );
      if (filter) data = data.filter(filter);

      const reversed: typeof comp =
        direction === "+" ? comp : (x, y) => comp(y, x);
      if (is_sorted(data, reversed) === false) {
        if (
          fields.length === 1 &&
          data.length &&
          (data as any)[0][fields[0]] !== undefined &&
          trace
        )
          console.log(data.map((elem) => (elem as any)[fields[0]]));
        throw new Error(
          `Bug on ${title}: wrong sorting on ${direction}(${fields.join(
            ", ",
          )}).`,
        );
      }
    };

  /**
   * Type alias for sortable field specifications.
   *
   * Represents an array of sort field specifications where each field can be
   * prefixed with '+' for ascending order or '-' for descending order.
   *
   * @example
   *   type UserSortable = TestValidator.Sortable<
   *     "name" | "email" | "created_at"
   *   >;
   *   // Results in: Array<"-name" | "+name" | "-email" | "+email" | "-created_at" | "+created_at">
   *
   *   const userSort: UserSortable = ["+name", "-created_at"];
   *
   * @template Literal - String literal type representing available field names
   * @evidence contracts/common.md#principled-implementation A sortable is an array of field names with a leading `+` or `-`, the notation the API under test receives.
   * @evidence contracts/common.md#clear-and-simple-design A single template-literal type.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states the notation.
   */
  export type Sortable<Literal extends string> = Array<
    `-${Literal}` | `+${Literal}`
  >;
}

interface IEntity<Type extends string | number | bigint> {
  id: Type;
}

/** @internal */
function get_ids<Entity extends IEntity<any>>(entities: Entity[]): string[] {
  return entities.map((entity) => entity.id.toString());
}

/** @internal */
function is_promise(input: any): input is Promise<any> {
  return (
    typeof input === "object" &&
    input !== null &&
    typeof (input as any).then === "function" &&
    typeof (input as any).catch === "function"
  );
}

/** @internal */
function is_sorted<T>(data: T[], comp: (x: T, y: T) => number): boolean {
  for (let i: number = 1; i < data.length; ++i)
    if (comp(data[i - 1]!, data[i]!) > 0) return false;
  return true;
}
