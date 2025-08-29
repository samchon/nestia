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
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   ```typescript
 *   // Basic usage with single fields
 *   users.sort(GaffComparator.strings(user => user.name));
 *   posts.sort(GaffComparator.dates(post => post.createdAt));
 *   products.sort(GaffComparator.numbers(product => product.price));
 *
 *   // Multi-field sorting with arrays
 *   users.sort(GaffComparator.strings(user => [user.lastName, user.firstName]));
 *   events.sort(GaffComparator.dates(event => [event.startDate, event.endDate]));
 *
 *   // Integration with TestValidator's currying pattern
 *   const validator = TestValidator.sort("user sorting",
 *     (sortable) => api.getUsers({ sort: sortable })
 *   )("name", "email")(
 *     GaffComparator.strings(user => [user.name, user.email])
 *   );
 *   await validator("+"); // ascending
 *   await validator("-"); // descending
 *   ```;
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
   * enables complex sorting like "sort by last name, then by first name".
   *
   * @example
   *   ```typescript
   *   interface User {
   *     id: string;
   *     firstName: string;
   *     lastName: string;
   *     email: string;
   *     status: 'active' | 'inactive';
   *   }
   *
   *   const users: User[] = [
   *     { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' },
   *     { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', status: 'inactive' },
   *     { id: '3', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', status: 'active' }
   *   ];
   *
   *   // Single field sorting
   *   users.sort(GaffComparator.strings(user => user.lastName));
   *   // Result: Doe, Doe, Smith
   *
   *   // Multi-field sorting: last name, then first name
   *   users.sort(GaffComparator.strings(user => [user.lastName, user.firstName]));
   *   // Result: Doe Jane, Doe John, Smith Bob
   *
   *   // Status-based sorting
   *   users.sort(GaffComparator.strings(user => user.status));
   *   // Result: active users first, then inactive
   *
   *   // Complex multi-field: status, then last name, then first name
   *   users.sort(GaffComparator.strings(user => [user.status, user.lastName, user.firstName]));
   *
   *   // Integration with TestValidator sorting validation
   *   const sortValidator = TestValidator.sort("user name sorting",
   *     (sortFields) => userApi.getUsers({ sort: sortFields })
   *   )("lastName", "firstName")(
   *     GaffComparator.strings(user => [user.lastName, user.firstName])
   *   );
   *   await sortValidator("+"); // test ascending order
   *   await sortValidator("-"); // test descending order
   *   ```;
   *
   * @template T - The type of objects being compared
   * @param getter - Function that extracts string value(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   */
  export const strings =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T): number => {
      const a: string[] = wrap(getter(x));
      const b: string[] = wrap(getter(y));

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? compare(a[idx], b[idx]) : 0;
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
   * @example
   *   ```typescript
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
   *       id: '1',
   *       title: 'Conference',
   *       startDate: '2024-03-15T09:00:00Z',
   *       endDate: '2024-03-15T17:00:00Z',
   *       createdAt: '2024-01-10T10:00:00Z',
   *       updatedAt: '2024-02-01T15:30:00Z'
   *     },
   *     {
   *       id: '2',
   *       title: 'Workshop',
   *       startDate: '2024-03-10T14:00:00Z',
   *       endDate: '2024-03-10T16:00:00Z',
   *       createdAt: '2024-01-15T11:00:00Z',
   *       updatedAt: '2024-01-20T09:15:00Z'
   *     }
   *   ];
   *
   *   // Sort by start date (chronological order)
   *   events.sort(GaffComparator.dates(event => event.startDate));
   *
   *   // Sort by creation date (oldest first)
   *   events.sort(GaffComparator.dates(event => event.createdAt));
   *
   *   // Multi-field: start date, then end date
   *   events.sort(GaffComparator.dates(event => [event.startDate, event.endDate]));
   *
   *   // Sort by modification history: created date, then updated date
   *   events.sort(GaffComparator.dates(event => [event.createdAt, event.updatedAt]));
   *
   *   // Validate API date sorting with TestValidator
   *   const dateValidator = TestValidator.sort("event chronological sorting",
   *     (sortFields) => eventApi.getEvents({ sort: sortFields })
   *   )("startDate")(
   *     GaffComparator.dates(event => event.startDate)
   *   );
   *   await dateValidator("+", true); // ascending with trace logging
   *
   *   // Test complex date-based sorting
   *   const sortByEventSchedule = GaffComparator.dates(event => [
   *     event.startDate,
   *     event.endDate
   *   ]);
   *   ```;
   *
   * @template T - The type of objects being compared
   * @param getter - Function that extracts date string(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   */
  export const dates =
    <T>(getter: (input: T) => string | string[]) =>
    (x: T, y: T): number => {
      const take = (v: T) =>
        wrap(getter(v)).map((str) => new Date(str).getTime());
      const a: number[] = take(x);
      const b: number[] = take(y);

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? a[idx] - b[idx] : 0;
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
   * @example
   *   ```typescript
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
   *     { id: '1', name: 'Laptop', price: 999.99, rating: 4.5, stock: 15, categoryId: 1, salesCount: 150 },
   *     { id: '2', name: 'Mouse', price: 29.99, rating: 4.2, stock: 50, categoryId: 1, salesCount: 300 },
   *     { id: '3', name: 'Keyboard', price: 79.99, rating: 4.8, stock: 25, categoryId: 1, salesCount: 200 }
   *   ];
   *
   *   // Sort by price (ascending)
   *   products.sort(GaffComparator.numbers(product => product.price));
   *   // Result: Mouse ($29.99), Keyboard ($79.99), Laptop ($999.99)
   *
   *   // Sort by rating (descending requires negation)
   *   products.sort(GaffComparator.numbers(product => -product.rating));
   *   // Result: Keyboard (4.8), Laptop (4.5), Mouse (4.2)
   *
   *   // Multi-field: category, then price
   *   products.sort(GaffComparator.numbers(product => [product.categoryId, product.price]));
   *
   *   // Complex business logic: popularity (sales) then rating
   *   products.sort(GaffComparator.numbers(product => [-product.salesCount, -product.rating]));
   *   // Negative values for descending order
   *
   *   // Sort by inventory priority: low stock first, then by sales
   *   products.sort(GaffComparator.numbers(product => [product.stock, -product.salesCount]));
   *
   *   // Validate API numerical sorting with TestValidator
   *   const priceValidator = TestValidator.sort("product price sorting",
   *     (sortFields) => productApi.getProducts({ sort: sortFields })
   *   )("price")(
   *     GaffComparator.numbers(product => product.price)
   *   );
   *   await priceValidator("+"); // test ascending order
   *   await priceValidator("-"); // test descending order
   *
   *   // Test multi-criteria sorting
   *   const sortByBusinessValue = GaffComparator.numbers(product => [
   *     -product.salesCount,  // High sales first
   *     -product.rating,      // High rating first
   *     product.price         // Low price first (for tie-breaking)
   *   ]);
   *   ```;
   *
   * @template T - The type of objects being compared
   * @param closure - Function that extracts number value(s) from input objects
   * @returns A comparator function suitable for Array.sort()
   */
  export const numbers =
    <T>(closure: (input: T) => number | number[]) =>
    (x: T, y: T): number => {
      const a: number[] = wrap(closure(x));
      const b: number[] = wrap(closure(y));

      const idx: number = a.findIndex((v, i) => v !== b[i]);
      return idx !== -1 ? a[idx] - b[idx] : 0;
    };

  const compare = (x: string, y: string) => x.localeCompare(y);

  const wrap = <T>(elem: T | T[]): T[] => (Array.isArray(elem) ? elem : [elem]);
}
