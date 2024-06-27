export namespace StringUtil {
  export const capitalize = (str: string) =>
    str[0].toUpperCase() + str.slice(1).toLowerCase();

  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  export const normalize = (str: string) =>
    str.split(".").join("_").split("-").join("_");

  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;

  export const escapeNonVariableSymbols = (str: string): string => {
    for (const [before, after] of VARIABLE_REPLACERS)
      str = str.split(before).join(after);
    for (let i: number = 0; i <= 9; ++i)
      if (str[0] === i.toString()) {
        str = "_" + str;
        break;
      }
    str = str.trim();
    if (str === "") return "_empty_";
    return str;
  };
}

const VARIABLE_REPLACERS: [string, string][] = [
  ["`", "_backquote_"],
  ["!", "_exclamation_"],
  ["#", "_hash_"],
  ["$", "_dollar_"],
  ["%", "_percent_"],
  ["^", "_caret_"],
  ["&", "_and_"],
  ["*", "_star_"],
  ["(", "_lparen_"],
  [")", "_rparen_"],
  ["-", "_minus_"],
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
