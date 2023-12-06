export namespace StringUtil {
  export const capitalize = (str: string) =>
    str[0].toUpperCase() + str.slice(1).toLowerCase();

  export const pascal = (path: string) =>
    splitWithNormalization(path)
      .filter((str) => str[0] !== "{")
      .map(capitalize)
      .join("");

  export const camel = (path: string) =>
    splitWithNormalization(path)
      .map((str, i) => (i === 0 ? str : capitalize(str)))
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
}
