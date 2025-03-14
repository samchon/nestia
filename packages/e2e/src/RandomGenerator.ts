/**
 * Random data generator.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace RandomGenerator {
  /* ----------------------------------------------------------------
        IDENTIFICATIONS
    ---------------------------------------------------------------- */
  const CHARACTERS = "abcdefghijklmnopqrstuvwxyz";
  const LETTERS: string = "0123456789" + CHARACTERS;

  /**
   * Generate random alphabets
   *
   * @param length Length of alphabets
   * @returns Generated alphabets
   */
  export const alphabets = (length: number): string =>
    new Array(length)
      .fill("")
      .map(() => CHARACTERS[randint(0, CHARACTERS.length - 1)])
      .join("");

  /**
   * Generate random alpha-numeric characters.
   *
   * Generate random string constructed with only alphabets and numbers.
   *
   * @param length Length of characters
   * @returns Generated string
   */
  export const alphaNumeric = (length: number): string =>
    new Array(length)
      .fill("")
      .map(() => LETTERS[randint(0, LETTERS.length - 1)])
      .join("");

  /**
   * Generate random name.
   *
   * @param length Length of paragraph, default is 2 or 3
   * @returns Generated name
   */
  export const name = (length: number = randint(2, 3)): string =>
    paragraph(length)();

  /**
   * Generate random paragraph.
   *
   * @param sentences Number of sentences
   * @returns Paragraph generator
   */
  export const paragraph =
    (sentences: number = randint(2, 5)) =>
    /**
     * @param wordMin Minimum number of characters in a sentence
     * @param wordMax Maximum number of characters in a sentence
     * @returns Generated paragraph
     */
    (wordMin: number = 3, wordMax: number = 7): string =>
      new Array(sentences)
        .fill("")
        .map(() => alphabets(randint(wordMin, wordMax)))
        .join(" ");

  /**
   * Generate random content.
   *
   * @param paragraphs Number of paragraphs
   * @returns Currying function
   */
  export const content =
    (paragraphs: number = randint(3, 8)) =>
    /**
     * @param sentenceMin Minimum number of sentences in a paragraph
     * @param sentenceMax Maximum number of sentences in a paragraph
     * @returns Currying function
     */
    (sentenceMin: number = 10, sentenceMax: number = 40) =>
    /**
     * @param wordMin Minimum number of characters in a sentence
     * @param wordMax Maximum number of characters in a sentence
     * @returns Content generator
     */
    (wordMin: number = 1, wordMax: number = 7): string =>
      new Array(paragraphs)
        .fill("")
        .map(() =>
          paragraph(randint(sentenceMin, sentenceMax))(wordMin, wordMax),
        )
        .join("\n\n");

  /**
   * Generate random substring.
   *
   * @param content Target content
   * @returns Random substring
   */
  export const substring = (content: string): string => {
    const first: number = randint(0, content.length - 1);
    const last: number = randint(first + 1, content.length);

    return content.substring(first, last).trim();
  };

  /**
   * Generate random mobile number.
   *
   * @param prefix Prefix string, default is "010"
   * @returns Random mobile number
   * @example 0103340067
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
   * Generate random date.
   *
   * @param from Start date
   * @param range Range of random milliseconds
   * @returns Random date
   */
  export const date =
    (from: Date) =>
    (range: number): Date =>
      new Date(from.getTime() + randint(0, range));

  /**
   * Pick random elements from an array.
   *
   * @param array Target array
   * @param count Number of count to pick
   * @returns Sampled array
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
   * Pick random element from an array.
   *
   * @param array Target array
   * @returns picked element
   */
  export const pick = <T>(array: T[]): T => array[randint(0, array.length - 1)];
}

const randint = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
