/**
 * Comprehensive random data generation utilities for testing and development.
 *
 * RandomGenerator provides a collection of functions for generating random data
 * including strings, names, content, dates, and array sampling. All functions
 * are designed to be deterministic within a single execution but produce varied
 * output across different runs, making them ideal for testing scenarios.
 *
 * The namespace includes specialized generators for:
 *
 * - Text content (alphabets, alphanumeric, names, paragraphs)
 * - Phone numbers and contact information
 * - Date ranges and time-based data
 * - Array sampling and element selection
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   ```typescript
 *   // Generate test user data
 *   const testUser = {
 *     id: RandomGenerator.alphaNumeric(8),
 *     name: RandomGenerator.name(),
 *     bio: RandomGenerator.paragraph(3)(5, 10),
 *     phone: RandomGenerator.mobile(),
 *     createdAt: RandomGenerator.date(new Date())(1000 * 60 * 60 * 24 * 30) // 30 days
 *   };
 *
 *   // Sample data for testing
 *   const testSample = RandomGenerator.sample(allUsers)(5);
 *   ```;
 */
export namespace RandomGenerator {
  /* ----------------------------------------------------------------
        IDENTIFICATIONS
    ---------------------------------------------------------------- */

  /** Character set containing lowercase alphabetical characters a-z */
  const CHARACTERS = "abcdefghijklmnopqrstuvwxyz";

  /**
   * Character set containing digits (0-9) and lowercase alphabetical characters
   * (a-z)
   */
  const LETTERS: string = "0123456789" + CHARACTERS;

  /**
   * Generates a random string containing only lowercase alphabetical
   * characters.
   *
   * Creates a string of specified length using only characters a-z. Each
   * character is independently randomly selected, so the same character may
   * appear multiple times. Useful for generating random identifiers, test
   * names, or placeholder text.
   *
   * @example
   *   ```typescript
   *   RandomGenerator.alphabets(5);  // "hello"
   *   RandomGenerator.alphabets(3);  // "abc"
   *   RandomGenerator.alphabets(10); // "randomtext"
   *
   *   // Generate random CSS class names
   *   const className = `test-${RandomGenerator.alphabets(6)}`;
   *
   *   // Create random variable names for testing
   *   const varName = RandomGenerator.alphabets(8);
   *   ```
   *
   * @param length - The desired length of the generated alphabetic string
   * @returns A string containing only lowercase letters of the specified length
   */
  export const alphabets = (length: number): string =>
    new Array(length)
      .fill("")
      .map(() => CHARACTERS[randint(0, CHARACTERS.length - 1)])
      .join("");

  /**
   * Generates a random alphanumeric string containing digits and lowercase
   * letters.
   *
   * Creates a string of specified length using characters from 0-9 and a-z.
   * Each position is independently randomly selected from the combined
   * character set. Ideal for generating random IDs, tokens, passwords, or
   * unique identifiers that need both numeric and alphabetic characters.
   *
   * @example
   *   ```typescript
   *   RandomGenerator.alphaNumeric(8);  // "a1b2c3d4"
   *   RandomGenerator.alphaNumeric(12); // "x9y8z7w6v5u4"
   *
   *   // Generate random API keys
   *   const apiKey = RandomGenerator.alphaNumeric(32);
   *
   *   // Create session tokens
   *   const sessionId = `sess_${RandomGenerator.alphaNumeric(16)}`;
   *
   *   // Generate test database IDs
   *   const testId = RandomGenerator.alphaNumeric(10);
   *   ```
   *
   * @param length - The desired length of the generated alphanumeric string
   * @returns A string containing digits and lowercase letters of the specified
   *   length
   */
  export const alphaNumeric = (length: number): string =>
    new Array(length)
      .fill("")
      .map(() => LETTERS[randint(0, LETTERS.length - 1)])
      .join("");

  /**
   * Generates a random name-like string with realistic length variation.
   *
   * Creates a name by generating a paragraph with 2-3 words (randomly chosen).
   * The resulting string resembles typical human names in structure and length.
   * Each word is between 3-7 characters by default, creating realistic-looking
   * names.
   *
   * @example
   *   ```typescript
   *   RandomGenerator.name();    // "john doe"
   *   RandomGenerator.name(1);   // "alice"
   *   RandomGenerator.name(3);   // "jane mary smith"
   *
   *   // Generate test user names
   *   const users = Array.from({ length: 10 }, () => ({
   *   id: RandomGenerator.alphaNumeric(8),
   *   name: RandomGenerator.name(),
   *   email: `${RandomGenerator.name(1)}@test.com`
   *   }));
   *
   *   // Create random author names for blog posts
   *   const authorName = RandomGenerator.name();
   *   ```
   *
   * @param length - Number of words in the name (default: random between 2-3)
   * @returns A space-separated string resembling a human name
   */
  export const name = (length: number = randint(2, 3)): string =>
    paragraph(length)();

  /**
   * Generates a random paragraph with configurable sentence structure.
   *
   * Creates a paragraph consisting of a specified number of "sentences"
   * (words). Each sentence is a random alphabetic string, and sentences are
   * joined with spaces. Returns a currying function to allow configuration of
   * word length ranges.
   *
   * @example
   *   ```typescript
   *   // Generate with default word lengths (3-7 characters)
   *   RandomGenerator.paragraph(3)();           // "hello world test"
   *   RandomGenerator.paragraph(5)();           // "lorem ipsum dolor sit amet"
   *
   *   // Custom word length ranges
   *   RandomGenerator.paragraph(4)(2, 5);       // "ab cd ef gh"
   *   RandomGenerator.paragraph(6)(8, 12);      // "verylongword anotherlongword..."
   *
   *   // Generate product descriptions
   *   const description = RandomGenerator.paragraph(8)(4, 8);
   *
   *   // Create test content for forms
   *   const placeholder = RandomGenerator.paragraph(3)(5, 10);
   *
   *   // Generate variable-length test data
   *   const testTexts = Array.from({ length: 5 }, (_, i) =>
   *     RandomGenerator.paragraph(i + 2)(3, 6)
   *   );
   *   ```;
   *
   * @param sentences - Number of sentences (words) in the paragraph (default:
   *   random 2-5)
   * @returns A currying function that accepts word length parameters
   */
  export const paragraph =
    (sentences: number = randint(2, 5)) =>
    (wordMin: number = 3, wordMax: number = 7): string =>
      new Array(sentences)
        .fill("")
        .map(() => alphabets(randint(wordMin, wordMax)))
        .join(" ");

  /**
   * Generates random multi-paragraph content with customizable structure.
   *
   * Creates content consisting of multiple paragraphs separated by double
   * newlines. Uses a triple-currying pattern to allow fine-grained control over
   * content structure: paragraphs count → sentences per paragraph → word
   * character lengths. Ideal for generating realistic-looking text content for
   * testing.
   *
   * @example
   *   ```typescript
   *   // Generate with all defaults
   *   const article = RandomGenerator.content()()();
   *
   *   // Specific structure: 5 paragraphs, 15-25 sentences each, 4-8 char words
   *   const longContent = RandomGenerator.content(5)(15, 25)(4, 8);
   *
   *   // Short content with brief sentences
   *   const shortContent = RandomGenerator.content(2)(5, 8)(2, 4);
   *
   *   // Generate blog post content
   *   const blogPost = {
   *     title: RandomGenerator.name(3),
   *     content: RandomGenerator.content(4)(10, 20)(3, 7),
   *     summary: RandomGenerator.paragraph(2)(5, 10)
   *   };
   *
   *   // Create test data for CMS
   *   const pages = Array.from({ length: 10 }, () => ({
   *     id: RandomGenerator.alphaNumeric(8),
   *     content: RandomGenerator.content(randint(2, 6))(8, 15)(4, 9)
   *   }));
   *
   *   // Generate email content for testing
   *   const emailBody = RandomGenerator.content(3)(5, 12)(3, 8);
   *   ```;
   *
   * @param paragraphs - Number of paragraphs to generate (default: random 3-8)
   * @returns A currying function that accepts sentence count parameters
   */
  export const content =
    (paragraphs: number = randint(3, 8)) =>
    (sentenceMin: number = 10, sentenceMax: number = 40) =>
    (wordMin: number = 1, wordMax: number = 7): string =>
      new Array(paragraphs)
        .fill("")
        .map(() =>
          paragraph(randint(sentenceMin, sentenceMax))(wordMin, wordMax),
        )
        .join("\n\n");

  /**
   * Extracts a random substring from the provided content string.
   *
   * Selects two random positions within the content and returns the substring
   * between them. The starting position is always before the ending position.
   * Automatically trims whitespace from the beginning and end of the result.
   * Useful for creating excerpts, search terms, or partial content samples.
   *
   * @example
   *   ```typescript
   *   const text = "The quick brown fox jumps over the lazy dog";
   *
   *   RandomGenerator.substring(text);  // "quick brown fox"
   *   RandomGenerator.substring(text);  // "jumps over"
   *   RandomGenerator.substring(text);  // "fox jumps over the lazy"
   *
   *   // Generate search terms from content
   *   const searchQuery = RandomGenerator.substring(articleContent);
   *
   *   // Create excerpts for previews
   *   const excerpt = RandomGenerator.substring(fullBlogPost);
   *
   *   // Generate partial matches for testing search functionality
   *   const partialMatch = RandomGenerator.substring(productDescription);
   *
   *   // Create random selections for highlight testing
   *   const selectedText = RandomGenerator.substring(documentContent);
   *   ```;
   *
   * @param content - The source string to extract a substring from
   * @returns A trimmed substring of the original content
   */
  export const substring = (content: string): string => {
    const first: number = randint(0, content.length - 1);
    const last: number = randint(first + 1, content.length);

    return content.substring(first, last).trim();
  };

  /**
   * Generates a random mobile phone number with customizable prefix.
   *
   * Creates a mobile phone number in the format: [prefix][3-4 digits][4
   * digits]. The middle section is 3 digits if the random number is less than
   * 1000, otherwise 4 digits. The last section is always 4 digits, zero-padded
   * if necessary. Commonly used for generating Korean mobile phone numbers or
   * similar formats.
   *
   * @example
   *   ```typescript
   *   RandomGenerator.mobile();        // "0103341234"
   *   RandomGenerator.mobile("011");   // "0119876543"
   *   RandomGenerator.mobile("+82");   // "+8233412345"
   *
   *   // Generate test user phone numbers
   *   const testUsers = Array.from({ length: 100 }, () => ({
   *     name: RandomGenerator.name(),
   *     phone: RandomGenerator.mobile(),
   *     altPhone: RandomGenerator.mobile("011")
   *   }));
   *
   *   // Create international phone numbers
   *   const internationalPhone = RandomGenerator.mobile("+821");
   *
   *   // Generate contact list for testing
   *   const contacts = ["010", "011", "016", "017", "018", "019"].map(prefix => ({
   *     carrier: prefix,
   *     number: RandomGenerator.mobile(prefix)
   *   }));
   *   ```;
   *
   * @param prefix - The prefix string for the phone number (default: "010")
   * @returns A formatted mobile phone number string
   */
  export const mobile = (prefix: string = "010"): string =>
    [
      prefix,
      (() => {
        const value = randint(0, 9999);
        return value.toString().padStart(value < 1_000 ? 3 : 4, "0");
      })(),
      randint(0, 9999).toString().padStart(4, "0"),
    ].join("");

  /**
   * Generates a random date within a specified range from a starting point.
   *
   * Creates a currying function that accepts a range in milliseconds and
   * returns a random date between the start date and start date + range. The
   * range represents the maximum number of milliseconds to add to the starting
   * date. Useful for generating timestamps, creation dates, or scheduling test
   * data.
   *
   * @example
   *   ```typescript
   *   const now = new Date();
   *   const oneDay = 24 * 60 * 60 * 1000;
   *   const oneMonth = 30 * oneDay;
   *
   *   // Random date within the next 30 days
   *   const futureDate = RandomGenerator.date(now)(oneMonth);
   *
   *   // Random date within the past week
   *   const pastWeek = new Date(now.getTime() - 7 * oneDay);
   *   const recentDate = RandomGenerator.date(pastWeek)(7 * oneDay);
   *
   *   // Generate random creation dates for test data
   *   const startOfYear = new Date(2024, 0, 1);
   *   const endOfYear = new Date(2024, 11, 31).getTime() - startOfYear.getTime();
   *   const randomCreationDate = RandomGenerator.date(startOfYear)(endOfYear);
   *
   *   // Create test events with random timestamps
   *   const events = Array.from({ length: 50 }, () => ({
   *     id: RandomGenerator.alphaNumeric(8),
   *     title: RandomGenerator.name(2),
   *     createdAt: RandomGenerator.date(new Date())(oneMonth),
   *     scheduledFor: RandomGenerator.date(new Date())(oneMonth * 3)
   *   }));
   *   ```;
   *
   * @param from - The starting date for the random range
   * @returns A currying function that accepts a range in milliseconds
   */
  export const date =
    (from: Date) =>
    (range: number): Date =>
      new Date(from.getTime() + randint(0, range));

  /**
   * Randomly samples a specified number of unique elements from an array.
   *
   * Selects random elements from the input array without replacement, ensuring
   * all returned elements are unique. The sample size is automatically capped
   * at the array length to prevent errors. Uses a Set-based approach to
   * guarantee uniqueness of selected indices. Ideal for creating test datasets
   * or selecting random subsets for validation.
   *
   * @example
   *   ```typescript
   *   const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   *
   *   RandomGenerator.sample(numbers)(3);  // [2, 7, 9]
   *   RandomGenerator.sample(numbers)(5);  // [1, 4, 6, 8, 10]
   *   RandomGenerator.sample(numbers)(15); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] (capped at array length)
   *
   *   // Sample users for testing
   *   const allUsers = await getUsersFromDatabase();
   *   const testUsers = RandomGenerator.sample(allUsers)(10);
   *
   *   // Create random product selections
   *   const featuredProducts = RandomGenerator.sample(allProducts)(5);
   *
   *   // Generate test data subsets
   *   const validationSet = RandomGenerator.sample(trainingData)(100);
   *
   *   // Random A/B testing groups
   *   const groupA = RandomGenerator.sample(allParticipants)(50);
   *   const remaining = allParticipants.filter(p => !groupA.includes(p));
   *   const groupB = RandomGenerator.sample(remaining)(50);
   *   ```;
   *
   * @param array - The source array to sample from
   * @returns A currying function that accepts the desired sample count
   */
  export const sample =
    <T>(array: T[]) =>
    (count: number): T[] => {
      count = Math.min(count, array.length);
      const indexes: Set<number> = new Set();
      while (indexes.size < count) indexes.add(randint(0, array.length - 1));
      return Array.from(indexes).map((index) => array[index]);
    };

  /**
   * Randomly selects a single element from an array.
   *
   * Chooses one element at random from the provided array using uniform
   * distribution. Each element has an equal probability of being selected. This
   * is a convenience function equivalent to sampling with a count of 1, but
   * returns the element directly rather than an array containing one element.
   *
   * @example
   *   ```typescript
   *   const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
   *   const fruits = ['apple', 'banana', 'orange', 'grape', 'kiwi'];
   *
   *   RandomGenerator.pick(colors);  // "blue"
   *   RandomGenerator.pick(fruits);  // "apple"
   *
   *   // Select random configuration options
   *   const randomTheme = RandomGenerator.pick(['light', 'dark', 'auto']);
   *   const randomLocale = RandomGenerator.pick(['en', 'ko', 'ja', 'zh']);
   *
   *   // Choose random test scenarios
   *   const testScenario = RandomGenerator.pick([
   *     'happy_path',
   *     'edge_case',
   *     'error_condition',
   *     'boundary_test'
   *   ]);
   *
   *   // Random user role assignment
   *   const userRole = RandomGenerator.pick(['admin', 'user', 'moderator']);
   *
   *   // Select random API endpoints for testing
   *   const endpoints = ['/users', '/posts', '/comments', '/categories'];
   *   const randomEndpoint = RandomGenerator.pick(endpoints);
   *   ```;
   *
   * @param array - The source array to pick an element from
   * @returns A randomly selected element from the array
   */
  export const pick = <T>(array: T[]): T => array[randint(0, array.length - 1)];
}

const randint = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
