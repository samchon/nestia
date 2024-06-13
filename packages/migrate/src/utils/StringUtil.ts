import { NamingConvention } from "typia/lib/utils/NamingConvention";

export namespace StringUtil {
  export const capitalize = (str: string) =>
    str[0].toUpperCase() + str.slice(1).toLowerCase();

  export const pascal = (path: string) =>
    splitWithNormalization(path)
      .filter((str) => str[0] !== "{")
      .map(NamingConvention.pascal)
      .join("");

  export const camel = (path: string) =>
    splitWithNormalization(path)
      .map((str, i) =>
        i === 0 ? NamingConvention.camel(str) : NamingConvention.pascal(str),
      )
      .join("");

  export const splitWithNormalization = (path: string) =>
    path
      .split("/")
      .map((str) => normalize(str.trim()))
      .filter((str) => !!str.length);

  export const reJoinWithDecimalParameters = (path: string) =>
    path
      .split("/")
      .filter((str) => !!str.length)
      .map((str) =>
        str[0] === "{" && str[str.length - 1] === "}"
          ? `:${str.substring(1, str.length - 1)}`
          : str,
      )
      .join("/");

  export const normalize = (str: string) =>
    str.split(".").join("_").split("-").join("_");

  export const commonPrefix = (strs: string[]): string => {
    if (strs.length === 0) return "";

    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (strs[i].indexOf(prefix) !== 0) {
        prefix = prefix.substring(0, prefix.length - 1);
        if (prefix === "") return "";
      }
    }
    return prefix
      .split("/")
      .filter((str) => str[0] !== "{" || str[str.length - 1] === "}")
      .join("/");
  };

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
