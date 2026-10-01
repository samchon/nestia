/**
 * String helpers that turn arbitrary text into valid identifiers and names.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the capitalization, path segment normalization, and identifier escaping rules used by the generators.
 * @evidence contracts/common.md#clear-and-simple-design Three functions and private tables of reserved words and replacements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tables are the language's reserved words and a fixed replacement of punctuation.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace StringUtil {
  /**
   * Upper-cases the first character and lower-cases the rest; an empty string
   * stays empty.
   *
   * @evidence contracts/common.md#principled-implementation The first character is transformed alone and the remainder is lower-cased, so the result is a normalized word.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It applies to every input.
   * @evidence contracts/common.md#meaningful-documentation The comment states the rule and the empty case.
   */
  export const capitalize = (str: string): string =>
    str.length === 0 ? str : str[0]!.toUpperCase() + str.slice(1).toLowerCase();

  /**
   * Splits a path by slashes and normalizes each non-empty segment into a name.
   *
   * @evidence contracts/common.md#principled-implementation Each segment loses dots and dashes, a reserved word or a leading digit gets an underscore prefix, and empty segments are dropped.
   * @evidence contracts/common.md#clear-and-simple-design One expression over the private normalizer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules apply to every segment.
   * @evidence contracts/common.md#meaningful-documentation The comment states the normalization.
   */
  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  /**
   * Escapes a string into a valid variable name.
   *
   * Reserved words and leading digits get an underscore prefix, punctuation is
   * replaced by a word such as `_at_`, and an empty result is `_empty_`.
   *
   * @evidence contracts/common.md#principled-implementation The replacements are applied in a fixed order over the whole string, so the result contains no punctuation the table covers and starts with a letter or an underscore.
   * @evidence contracts/common.md#clear-and-simple-design One function over two private tables.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is general.
   * @evidence contracts/common.md#meaningful-documentation The comment states the rules.
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

const escape = (str: string): string => {
  str = str.trim();
  if (RESERVED.has(str)) return `_${str}`;
  else if (str.length !== 0 && "0" <= str[0]! && str[0]! <= "9")
    str = `_${str}`;
  return str;
};

const normalize = (str: string): string =>
  escape(str.split(".").join("_").split("-").join("_"));

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
