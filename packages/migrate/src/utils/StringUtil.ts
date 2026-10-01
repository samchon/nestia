/**
 * String helpers that turn arbitrary text into valid identifiers and names.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the capitalization, path segment normalization, and identifier escaping rules used by the generators.
 * @evidence contracts/common.md#clear-and-simple-design Three functions and private tables of reserved words and replacements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tables are the language's reserved words and a fixed replacement of punctuation.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/performance.md#efficient-algorithms Identifier escaping traverses the input with a fixed punctuation table and Unicode-aware per-segment replacements; total work and intermediate storage scale with encoded output length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This operation owns only invocation-local values, with no retained cache, handle or background task.
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
   * @evidence contracts/performance.md#efficient-algorithms One leading-character conversion and one remainder conversion cost O(N) in the input length.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This operation owns only invocation-local values, with no retained cache, handle or background task.
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
   * @evidence contracts/performance.md#efficient-algorithms The path is split once and each segment normalized with a fixed number of transformations: O(N) total text work and output storage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This operation owns only invocation-local values, with no retained cache, handle or background task.
   */
  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  /**
   * Escapes a string into a valid, possibly qualified, name.
   *
   * A dot separates the segments of a qualified name, so each segment is
   * escaped as one identifier. Punctuation is replaced by a word such as
   * `_at_`, any other character an identifier cannot hold by its code point, a
   * reserved word or a segment that cannot start an identifier gets an
   * underscore prefix, and an empty segment is `_empty_`. The last segment
   * names a type, so it is also prefixed when it is a predefined type name.
   *
   * @evidence contracts/common.md#principled-implementation Whitespace at the edges is trimmed and the punctuation table is applied in its fixed order over the whole string; the string is then split at the dots, which stay as the namespace separators the DTO tree reads, and every segment is made an identifier by the ECMAScript rule: characters outside `ID_Continue` become their code point, and a reserved word, a predefined type name in the last segment or a segment not starting with `ID_Start`, `_` or `$` is prefixed with an underscore, so each segment is a valid identifier even where the punctuation table does not cover its characters.
   * @evidence contracts/common.md#clear-and-simple-design One function over one segment helper and three private tables of reserved words, predefined type names and replacements.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No schema name is special-cased; the fixed punctuation table and Unicode identifier rules apply to every segment.
   * @evidence contracts/common.md#meaningful-documentation The comment states the segment rule, the replacements, the prefixes and the empty case.
   * @evidence contracts/performance.md#efficient-algorithms A fixed punctuation table traverses the text before per-segment Unicode escaping. Work scales linearly with the encoded text length for the fixed table; expanded code-point spellings are retained only in the returned string.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This operation owns only invocation-local values, with no retained cache, handle or background task.
   */
  export const escapeNonVariable = (str: string): string => {
    str = str.trim();
    for (const [before, after] of VARIABLE_REPLACERS)
      str = str.split(before).join(after);
    if (str === "") return "_empty_";
    const segments: string[] = str.split(".");
    return segments
      .map((segment, index) =>
        escapeSegment(segment, index === segments.length - 1),
      )
      .join(".");
  };
}

const escape = (str: string): string => {
  str = str.trim();
  if (RESERVED.has(str)) return `_${str}`;
  else if (str.length !== 0 && "0" <= str[0]! && str[0]! <= "9")
    str = `_${str}`;
  return str;
};

// One identifier. The patterns are built at run time because the property
// escapes need a newer script target than the one this package compiles to.
const NON_IDENTIFIER_PART: RegExp = new RegExp("[^\\p{ID_Continue}]", "gu");
const IDENTIFIER_START: RegExp = new RegExp("^[\\p{ID_Start}_$]", "u");

const escapeSegment = (segment: string, type: boolean): string => {
  segment = segment.replace(
    NON_IDENTIFIER_PART,
    (char) => `_u${char.codePointAt(0)!.toString(16)}_`,
  );
  if (segment.length === 0) return "_empty_";
  return RESERVED.has(segment) ||
    (type && TYPE_NAMES.has(segment)) ||
    IDENTIFIER_START.test(segment) === false
    ? `_${segment}`
    : segment;
};

const normalize = (str: string): string =>
  escape(str.split(".").join("_").split("-").join("_"));

const TYPE_NAMES: Set<string> = new Set([
  "any",
  "bigint",
  "boolean",
  "never",
  "number",
  "object",
  "string",
  "symbol",
  "undefined",
  "unknown",
]);

const RESERVED: Set<string> = new Set([
  "await",
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
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "module",
  "new",
  "null",
  "package",
  "public",
  "private",
  "protected",
  "return",
  "static",
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
  "yield",
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
