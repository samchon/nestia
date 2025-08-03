/**
 * Utility namespace for string manipulation and validation operations.
 * 
 * Provides functions for string transformation, normalization, and validation
 * commonly needed during code generation and migration processes.
 */
export namespace StringUtil {
  /**
   * Capitalizes the first character of a string and lowercases the rest.
   * 
   * @param str - The string to capitalize
   * @returns The capitalized string
   * 
   * @example
   * ```typescript
   * StringUtil.capitalize("helloWorld"); // "Helloworld"
   * StringUtil.capitalize("API"); // "Api"
   * ```
   */
  export const capitalize = (str: string) =>
    str[0].toUpperCase() + str.slice(1).toLowerCase();

  /**
   * Splits a path string and normalizes each segment.
   * 
   * Takes a path-like string, splits it by forward slashes, normalizes each
   * segment to be a valid identifier, and filters out empty segments.
   * 
   * @param path - The path string to split and normalize
   * @returns Array of normalized path segments
   * 
   * @example
   * ```typescript
   * StringUtil.splitWithNormalization("/api/v1/users-list/"); 
   * // ["api", "v1", "users_list"]
   * ```
   */
  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  /**
   * Creates a function that escapes duplicate names by adding underscores.
   * 
   * Returns a function that takes a name and modifies it if it conflicts
   * with names in the provided keep array by prefixing underscores.
   * 
   * @param keep - Array of names to avoid duplicating
   * @returns Function that escapes duplicate names
   * 
   * @example
   * ```typescript
   * const escaper = StringUtil.escapeDuplicate(["user", "admin"]);
   * escaper("user"); // "_user"
   * escaper("guest"); // "guest"
   * ```
   */
  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;

  /**
   * Converts a string to a valid TypeScript/JavaScript variable name.
   * 
   * Handles reserved keywords, numeric prefixes, and special characters
   * by replacing or escaping them appropriately.
   * 
   * @param str - The string to convert to a valid variable name
   * @returns A valid TypeScript/JavaScript identifier
   * 
   * @example
   * ```typescript
   * StringUtil.escapeNonVariable("class"); // "_class"
   * StringUtil.escapeNonVariable("123name"); // "_123name"
   * StringUtil.escapeNonVariable("user-name"); // "user_name"
   * StringUtil.escapeNonVariable(""); // "_empty_"
   * ```
   */
  export const escapeNonVariable = (str: string): string => {
    str = escape(str);
    for (const [before, after] of VARIABLE_REPLACERS)
      str = str.split(before).join(after);
    for (let i: number = 0; i <= 9; ++i)
      if (str[0] === i.toString()) {
        str = "_" + str;
        break;
      }
    if (str === "") return "_empty_";
    return str;
  };
}

/**
 * Escapes reserved keywords and numeric prefixes.
 * 
 * @param str - The string to escape
 * @returns The escaped string
 * @internal
 */

const escape = (str: string): string => {
  str = str.trim();
  if (RESERVED.has(str)) return `_${str}`;
  else if (str.length !== 0 && "0" <= str[0] && str[0] <= "9") str = `_${str}`;
  return str;
};

/**
 * Normalizes a string by replacing dots and dashes with underscores.
 * 
 * @param str - The string to normalize
 * @returns The normalized string
 * @internal
 */
const normalize = (str: string): string =>
  escape(str.split(".").join("_").split("-").join("_"));

/**
 * Set of TypeScript/JavaScript reserved keywords that need escaping.
 * @internal
 */
const RESERVED: Set<string> = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "module",
  "new",
  "null",
  "package",
  "public",
  "private",
  "protected",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
]);

/**
 * Array of character replacements for converting special characters to valid identifier parts.
 * @internal
 */
const VARIABLE_REPLACERS: [string, string][] = [
  ["`", "_backquote_"],
  ["!", "_exclamation_"],
  ["@", "_at_"],
  ["#", "_hash_"],
  ["$", "_dollar_"],
  ["%", "_percent_"],
  ["^", "_caret_"],
  ["&", "_and_"],
  ["*", "_star_"],
  ["(", "_lparen_"],
  [")", "_rparen_"],
  ["-", "_"],
  ["+", "_plus_"],
  ["|", "_or_"],
  ["{", "_blt_"],
  ["}", "_bgt_"],
  ["<", "_lt_"],
  [">", "_gt_"],
  ["[", "_alt_"],
  ["]", "_agt_"],
  [",", "_comma_"],
  ["'", "_singlequote_"],
  ['"', "_doublequote_"],
  [" ", "_space_"],
  ["?", "_question_"],
  [":", "_colon_"],
  [";", "_semicolon_"],
  ["...", "_rest_"],
];
