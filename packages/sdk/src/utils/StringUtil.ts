export namespace StringUtil {
  export const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1);

  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;
}
