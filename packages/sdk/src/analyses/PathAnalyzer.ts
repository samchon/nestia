import { RequestMethod } from "@nestjs/common";
import path from "path";
import { Token, parse } from "path-to-regexp";

export namespace PathAnalyzer {
  export const join = (...args: string[]) =>
    "/" +
    _Trim(
      path
        .join(...args.filter((s) => !!s.length))
        .split("\\")
        .join("/"),
    );

  export const joinWithGlobalPrefix = (props: {
    globalPrefix: string;
    exclude: IGlobalPrefixExclude[] | undefined;
    excludePath?: string;
    method: string;
    path: string;
  }): string =>
    join(
      isGlobalPrefixExcluded(
        props.exclude,
        props.excludePath ?? props.path,
        props.method,
      )
        ? ""
        : props.globalPrefix,
      props.path,
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

  function isGlobalPrefixExcluded(
    exclude: IGlobalPrefixExclude[] | undefined,
    path: string,
    method: string,
  ): boolean {
    if (exclude === undefined) return false;
    const requestMethod: RequestMethod | undefined = REQUEST_METHODS[method];
    if (requestMethod === undefined) return false;

    const location: string = join(path);
    return exclude.some((route) => {
      const routeMethod: RequestMethod | undefined =
        route.requestMethod ?? route.method;
      if (
        routeMethod !== undefined &&
        routeMethod !== RequestMethod.ALL &&
        routeMethod !== requestMethod
      )
        return false;
      if (route.pathRegex instanceof RegExp)
        return route.pathRegex.test(join(location));
      return join(route.path) === location;
    });
  }

  interface IArgument {
    type: "param" | "path";
    value: string;
  }

  interface IGlobalPrefixExclude {
    path: string;
    method?: RequestMethod;
    requestMethod?: RequestMethod;
    pathRegex?: RegExp;
  }
}

const REQUEST_METHODS: Record<string, RequestMethod> = {
  DELETE: RequestMethod.DELETE,
  GET: RequestMethod.GET,
  HEAD: RequestMethod.HEAD,
  OPTIONS: RequestMethod.OPTIONS,
  PATCH: RequestMethod.PATCH,
  POST: RequestMethod.POST,
  PUT: RequestMethod.PUT,
};
