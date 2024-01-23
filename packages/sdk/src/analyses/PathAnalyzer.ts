import { RequestMethod } from "@nestjs/common";
import path from "path";
import { Token, parse } from "path-to-regexp";

import { INormalizedInput } from "../structures/INormalizedInput";

export namespace PathAnalyzer {
  export const combinate =
    (globalPrefix: INormalizedInput["globalPrefix"]) =>
    (versions: Array<string | null>) =>
    (props: { path: string; method: string }): string[] => {
      const out = (str: string) =>
        versions.map((v) => (v === null ? str : join(v, str)));
      if (!globalPrefix?.prefix.length) return out(props.path);
      else if (!globalPrefix.exclude?.length)
        return out(props.path).map((str) => join(globalPrefix.prefix, str));
      return globalPrefix.exclude.some((exclude) =>
        typeof exclude === "string"
          ? RegExp(exclude).test(props.path)
          : METHOD(exclude.method) === props.method &&
            RegExp(exclude.path).test(props.path),
      )
        ? out(props.path)
        : out(props.path).map((str) => join(globalPrefix.prefix, str));
    };

  export const join = (...args: string[]) =>
    "/" +
    _Trim(
      path
        .join(...args.filter((s) => !!s.length))
        .split("\\")
        .join("/"),
    );

  export const escape = (str: string): string | null => {
    const args = _Parse(str);
    if (args === null) return null;
    return (
      "/" +
      args
        .map((arg) => (arg.type === "param" ? `:${arg.value}` : arg.value))
        .join("/")
    );
  };

  export const parameters = (str: string): string[] | null => {
    const args = _Parse(str);
    if (args === null) return null;
    return args.filter((arg) => arg.type === "param").map((arg) => arg.value);
  };

  function _Parse(str: string): IArgument[] | null {
    const tokens: Token[] | null = (() => {
      try {
        return parse(path.join(str).split("\\").join("/"));
      } catch {
        return null;
      }
    })();
    if (tokens === null) return null;

    const output: IArgument[] = [];
    for (const key of tokens) {
      if (typeof key === "string")
        output.push({
          type: "path",
          value: _Trim(key),
        });
      else if (typeof key.name === "number" || _Trim(key.name) === "")
        return null;
      else
        output.push({
          type: "param",
          value: _Trim(key.name),
        });
    }
    return output;
  }

  function _Trim(str: string): string {
    if (str[0] === "/") str = str.substring(1);
    if (str[str.length - 1] === "/") str = str.substring(0, str.length - 1);
    return str;
  }

  interface IArgument {
    type: "param" | "path";
    value: string;
  }
}

const METHOD = (value: RequestMethod) =>
  value === RequestMethod.ALL
    ? "all"
    : value === RequestMethod.DELETE
      ? "delete"
      : value === RequestMethod.GET
        ? "get"
        : value === RequestMethod.HEAD
          ? "head"
          : value === RequestMethod.OPTIONS
            ? "options"
            : value === RequestMethod.PATCH
              ? "patch"
              : value === RequestMethod.POST
                ? "post"
                : value === RequestMethod.PUT
                  ? "put"
                  : "unknown";
