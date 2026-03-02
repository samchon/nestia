export namespace StringUtil {
  export const capitalize = (str: string) =>
    str[0]!.toUpperCase() + str.slice(1).toLowerCase();

  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;

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
