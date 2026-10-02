/**
 * Type-safe comparator functions for Array.sort() operations with advanced
 * field access.
 *
 * GaffComparator provides a collection of specialized comparator functions
 * designed to work seamlessly with Array.sort() and testing frameworks like
 * TestValidator.sort(). Each comparator supports both single values and arrays
 * of values, enabling complex multi-field sorting scenarios with lexicographic
 * ordering.
 *
 * Key features:
 *
 * - Generic type safety for any object structure
 * - Support for single values or arrays of values per field
 * - Lexicographic comparison for multi-value scenarios
 * - Locale-aware string comparison
 * - Automatic type conversion for dates and numbers
 *
 * The comparators follow the standard JavaScript sort contract:
 *
 * - Return < 0 if first element should come before second
 * - Return > 0 if first element should come after second
 * - Return 0 if elements are equal
 *
 * Processing cost: Each comparison extracts both key lists and visits their
 * common prefix until the first difference; date keys additionally parse all
 * supplied strings once per comparison. No sort or repeated scan is performed
 * inside a comparison.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   // Basic usage with single fields
 *   users.sort(GaffComparator.strings((user) => user.name));
 *   posts.sort(GaffComparator.dates((post) => post.createdAt));
 *   products.sort(GaffComparator.numbers((product) => product.price));
 *
 *   // Multi-field sorting with arrays
 *   users.sort(
 *     GaffComparator.strings((user) => [user.lastName, user.firstName]),
 *   );
 *   events.sort(
 *     GaffComparator.dates((event) => [event.startDate, event.endDate]),
 *   );
 *
 *   // Integration with TestValidator's currying pattern
 *   const validator = TestValidator.sort("user sorting", (sortable) =>
 *     api.getUsers({ sort: sortable }),
 *   )(
 *     "name",
 *     "email",
 *   )(GaffComparator.strings((user) => [user.name, user.email]));
 *   await validator("+"); // ascending
 *   await validator("-"); // descending
 *
 * @evidence contracts/common.md#principled-implementation Each comparator maps both operands to arrays of comparable values and decides by the first position where they differ, then by array length, which is a lexicographic order that satisfies the sort contract for well-defined values; it is used to check server-side sorting from the client.
 * @evidence contracts/common.md#clear-and-simple-design Three comparators share scalar-to-array wrapping. Strings compare each key by collation; dates and numbers use a shared strict mismatch search over their numeric keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordering rule is generic in the getter, with no field, entity, or locale special case.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose lists the features and the sort contract with an example.
 */
export namespace GaffComparator {
  /**
   * Creates a comparator function for string-based sorting with locale-aware
   * comparison.
   *
   * Generates a comparator that extracts string values from objects and
   * performs lexicographic comparison using locale-sensitive string comparison.
   * Supports both single strings and arrays of strings for multi-field sorting
   * scenarios.
   *
   * When comparing arrays, performs lexicographic ordering: compares the first
   * elements, then the second elements if the first are equal, and so on. This
   * enables complex sorting like "sort by last name, then by first name". Keys
   * that compare equal under the runtime's collation, including different
   * canonically equivalent Unicode spellings, continue to the next key. If the
   * whole common prefix compares equal, the shorter key list sorts first.
   *
   * Processing cost: Both getters run once and a bounded loop visits only
   * common keys until the first collation difference. Work depends on examined
   * keys and string comparison cost; scalar wrapping adds constant space.
   *
   * @example
   *   interface User {
   *     id: string;
   *     firstName: string;
   *     lastName: string;
   *     email: string;
   *     status: "active" | "inactive";
   *   }
   *
   *   const users: User[] = [
   *     {
   *       id: "1",
   *       firstName: "John",
   *       lastName: "Doe",
   *       email: "john@example.com",
   *       status: "active",
   *     },
   *     {
   *       id: "2",
   *       firstName: "Jane",
   *       lastName: "Doe",
   *       email: "jane@example.com",
   *       status: "inactive",
   *     },
   *     {
   *       id: "3",
   *       firstName: "Bob",
   *       lastName: "Smith",
   *       email: "bob@example.com",
   *       status: "active",
   *     },
   *   ];
   *
   *   // Single field sorting
   *   users.sort(GaffComparator.strings((user) => user.lastName));
   *   // Result: Doe, Doe, Smith
   *
   *   // Multi-field sorting: last name, then first name
   *   users.sort(
   *     GaffComparator.strings((user) => [user.lastName, user.firstName]),
   *   );
   *   // Result: Doe Jane, Doe John, Smith Bob
   *
   *   // Status-based sorting
   *   users.sort(GaffComparator.strings((user) => user.status));
   *   // Result: active users first, then inactive
   *
   *   // Complex multi-field: status, then last name, then first name
   *   users.sort(
   *     GaffComparator.strings((user) => [
   *       user.status,
   *       user.lastName,
   *       user.firstName,
   *     ]),
   *   );
   *
   *   // Integration with TestValidator sorting validation
   *   const sortValidator = TestValidator.sort(
   *     "user name sorting",
   *     (sortFields) => userApi.getUsers({ sort: sortFields }),
   *   )(
   *     "lastName",
   *     "firstName",
   *   )(GaffComparator.strings((user) => [user.lastName, user.firstName]));
   *   await sortValidator("+"); // test ascending order
   *   await sortValidator("-"); // test descending order
   *
   * @template T - The type of objects being compared
   * @param getter - Function that extracts string value(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   * @evidence contracts/common.md#principled-implementation Each common key position is compared once with localeCompare; a nonzero result decides the order, while collation-equal spellings continue to later keys. Only an entirely equal common prefix falls through to array length, establishing lexicographic order under the runtime's actual collation without assuming strict string equality.
   * @evidence contracts/common.md#clear-and-simple-design Shared wrapping accepts scalar or array keys; one bounded loop returns the first nonzero collation result or the length difference.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The comparison is the platform's locale collation, not a hand-written ordering.
   * @evidence contracts/common.md#meaningful-documentation The comment states the locale sensitivity, the multi-value rule, and the arguments, with examples.
   */
  export const strings =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T): number => {
      const a: string[] = wrap(getter(x));
      const b: string[] = wrap(getter(y));

      for (let index = 0; index < Math.min(a.length, b.length); ++index) {
        const result: number = compare(a[index]!, b[index]!);
        if (result !== 0) return result;
      }
      return a.length - b.length;
    };

  /**
   * Creates a comparator function for date-based sorting with automatic string
   * parsing.
   *
   * Generates a comparator that extracts date values from objects,
   * automatically converting string representations to Date objects for
   * numerical comparison. Supports both single dates and arrays of dates for
   * complex temporal sorting.
   *
   * Date strings are parsed using the standard Date constructor, which supports
   * ISO 8601 format, RFC 2822 format, and other common date representations.
   * The comparison is performed on millisecond timestamps for precise
   * ordering.
   *
   * Processing cost: Both getters run once, each returned string is parsed
   * once, and the bounded mismatch search visits at most the common key count.
   * Numeric key arrays require space proportional to the two lists.
   *
   * @example
   *   interface Event {
   *     id: string;
   *     title: string;
   *     startDate: string;
   *     endDate: string;
   *     createdAt: string;
   *     updatedAt: string;
   *   }
   *
   *   const events: Event[] = [
   *     {
   *       id: "1",
   *       title: "Conference",
   *       startDate: "2024-03-15T09:00:00Z",
   *       endDate: "2024-03-15T17:00:00Z",
   *       createdAt: "2024-01-10T10:00:00Z",
   *       updatedAt: "2024-02-01T15:30:00Z",
   *     },
   *     {
   *       id: "2",
   *       title: "Workshop",
   *       startDate: "2024-03-10T14:00:00Z",
   *       endDate: "2024-03-10T16:00:00Z",
   *       createdAt: "2024-01-15T11:00:00Z",
   *       updatedAt: "2024-01-20T09:15:00Z",
   *     },
   *   ];
   *
   *   // Sort by start date (chronological order)
   *   events.sort(GaffComparator.dates((event) => event.startDate));
   *
   *   // Sort by creation date (oldest first)
   *   events.sort(GaffComparator.dates((event) => event.createdAt));
   *
   *   // Multi-field: start date, then end date
   *   events.sort(
   *     GaffComparator.dates((event) => [event.startDate, event.endDate]),
   *   );
   *
   *   // Sort by modification history: created date, then updated date
   *   events.sort(
   *     GaffComparator.dates((event) => [event.createdAt, event.updatedAt]),
   *   );
   *
   *   // Validate API date sorting with TestValidator
   *   const dateValidator = TestValidator.sort(
   *     "event chronological sorting",
   *     (sortFields) => eventApi.getEvents({ sort: sortFields }),
   *   )("startDate")(GaffComparator.dates((event) => event.startDate));
   *   await dateValidator("+", true); // ascending with trace logging
   *
   *   // Test complex date-based sorting
   *   const sortByEventSchedule = GaffComparator.dates((event) => [
   *     event.startDate,
   *     event.endDate,
   *   ]);
   *
   * @template T - The type of objects being compared
   * @param getter - Function that extracts date string(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   * @evidence contracts/common.md#principled-implementation Each value is parsed by the `Date` constructor and compared by its millisecond timestamp, so ISO 8601 and the other formats the constructor accepts order correctly; a string the constructor cannot parse yields NaN, and the comparator then returns NaN, which a sort treats as equality, a limit the caller must respect by giving valid dates.
   * @evidence contracts/common.md#clear-and-simple-design It uses the shared `wrap` and `mismatch`, and adds only the parsing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsing is the standard constructor with no format special cases.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted formats and the millisecond comparison, with examples.
   */
  export const dates =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T): number => {
      const take = (v: T) =>
        wrap(getter(v)).map((str) => new Date(str).getTime());
      const a: number[] = take(x);
      const b: number[] = take(y);

      const idx: number = mismatch(a, b);
      return idx !== -1 ? a[idx]! - b[idx]! : a.length - b.length;
    };

  /**
   * Creates a comparator function for numerical sorting with multi-value
   * support.
   *
   * Generates a comparator that extracts numerical values from objects and
   * performs mathematical comparison. Supports both single numbers and arrays
   * of numbers for complex numerical sorting scenarios like sorting by price
   * then by rating.
   *
   * When comparing arrays, performs lexicographic numerical ordering: compares
   * the first numbers, then the second numbers if the first are equal, and so
   * on. This enables sophisticated sorting like "sort by price ascending, then
   * by rating descending".
   *
   * Processing cost: Both getters run once and mismatch visits only the common
   * prefix until the first unequal key. Existing key arrays are reused, and
   * scalar wrapping takes constant auxiliary space.
   *
   * @example
   *   interface Product {
   *     id: string;
   *     name: string;
   *     price: number;
   *     rating: number;
   *     stock: number;
   *     categoryId: number;
   *     salesCount: number;
   *   }
   *
   *   const products: Product[] = [
   *     {
   *       id: "1",
   *       name: "Laptop",
   *       price: 999.99,
   *       rating: 4.5,
   *       stock: 15,
   *       categoryId: 1,
   *       salesCount: 150,
   *     },
   *     {
   *       id: "2",
   *       name: "Mouse",
   *       price: 29.99,
   *       rating: 4.2,
   *       stock: 50,
   *       categoryId: 1,
   *       salesCount: 300,
   *     },
   *     {
   *       id: "3",
   *       name: "Keyboard",
   *       price: 79.99,
   *       rating: 4.8,
   *       stock: 25,
   *       categoryId: 1,
   *       salesCount: 200,
   *     },
   *   ];
   *
   *   // Sort by price (ascending)
   *   products.sort(GaffComparator.numbers((product) => product.price));
   *   // Result: Mouse ($29.99), Keyboard ($79.99), Laptop ($999.99)
   *
   *   // Sort by rating (descending requires negation)
   *   products.sort(GaffComparator.numbers((product) => -product.rating));
   *   // Result: Keyboard (4.8), Laptop (4.5), Mouse (4.2)
   *
   *   // Multi-field: category, then price
   *   products.sort(
   *     GaffComparator.numbers((product) => [
   *       product.categoryId,
   *       product.price,
   *     ]),
   *   );
   *
   *   // Complex business logic: popularity (sales) then rating
   *   products.sort(
   *     GaffComparator.numbers((product) => [
   *       -product.salesCount,
   *       -product.rating,
   *     ]),
   *   );
   *   // Negative values for descending order
   *
   *   // Sort by inventory priority: low stock first, then by sales
   *   products.sort(
   *     GaffComparator.numbers((product) => [
   *       product.stock,
   *       -product.salesCount,
   *     ]),
   *   );
   *
   *   // Validate API numerical sorting with TestValidator
   *   const priceValidator = TestValidator.sort(
   *     "product price sorting",
   *     (sortFields) => productApi.getProducts({ sort: sortFields }),
   *   )("price")(GaffComparator.numbers((product) => product.price));
   *   await priceValidator("+"); // test ascending order
   *   await priceValidator("-"); // test descending order
   *
   *   // Test multi-criteria sorting
   *   const sortByBusinessValue = GaffComparator.numbers((product) => [
   *     -product.salesCount, // High sales first
   *     -product.rating, // High rating first
   *     product.price, // Low price first (for tie-breaking)
   *   ]);
   *
   * @template T - The type of objects being compared
   * @param closure - Function that extracts number value(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   * @evidence contracts/common.md#principled-implementation The sign of subtraction at the first differing position orders finite numeric values, and a shorter equal prefix sorts first. Subtraction can round or overflow, so the result's magnitude is not an exact-distance guarantee; callers must supply ordered numeric values rather than NaN.
   * @evidence contracts/common.md#clear-and-simple-design It uses the shared `wrap` and `mismatch`, and adds only the subtraction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The comparison is the arithmetic difference, with no rounding or thresholds.
   * @evidence contracts/common.md#meaningful-documentation The comment states the multi-value rule and the arguments, with examples.
   */
  export const numbers =
    <T>(closure: (input: T) => number | number[]) =>
    (x: T, y: T): number => {
      const a: number[] = wrap(closure(x));
      const b: number[] = wrap(closure(y));

      const idx: number = mismatch(a, b);
      return idx !== -1 ? a[idx]! - b[idx]! : a.length - b.length;
    };

  const compare = (x: string, y: string) => x.localeCompare(y);

  /**
   * The first index where the two key lists differ within their common length,
   * or -1; beyond it a proper prefix orders before its extension, in both
   * argument orders.
   */
  const mismatch = <K>(a: K[], b: K[]): number => {
    const length: number = Math.min(a.length, b.length);
    for (let index: number = 0; index < length; ++index)
      if (a[index] !== b[index]) return index;
    return -1;
  };

  const wrap = <T>(elem: T | T[]): T[] => (Array.isArray(elem) ? elem : [elem]);
}
