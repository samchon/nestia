export namespace StringUtil {
  export const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;

  export const isImplicit = (str: string) =>
    str === "object" ||
    str === "__type" ||
    str === "__object" ||
    str.startsWith("__type.") ||
    str.startsWith("__object.") ||
    str.includes("readonly [");
}
