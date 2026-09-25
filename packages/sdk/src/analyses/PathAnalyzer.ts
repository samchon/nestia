import { RequestMethod } from "@nestjs/common";
import { Token, parse } from "path-to-regexp";

export namespace PathAnalyzer {
  /**
   * The route paths joined as the router joins them: one `/` between them, and
   * none doubled. A route path is router syntax, never a file path, so a
   * backslash stays the escape of the character after it (`items\\:batchGet`).
   */
  export const join = (...args: string[]) =>
    "/" +
    args
      .join("/")
      .split("/")
      .filter((str) => str.length !== 0)
      .join("/");

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

  /**
   * Why a route path cannot be composed, or `null` when it can.
   *
   * A wildcard (`*`, NestJS 11's `files/*path`) spans any number of segments,
   * and an optional segment (NestJS 11's `users{/:id}`, or `:id?` of earlier
   * versions) or a repeated parameter (`:id+`) may be absent or several; none
   * of them is one OpenAPI path parameter or one argument of an SDK function.
   */
  export const unsupported = (
    str: string,
  ): "wildcard" | "optional segment" | null => {
    // an escaped `\\*` is the literal character
    if (/(^|[^\\])\*/.test(str)) return "wildcard";
    // path-to-regexp 8 (Express 5) writes an optional segment in braces
    if (/(^|[^\\])[{}]/.test(str)) return "optional segment";
    const tokens: Token[] | null = _Tokenize(str);
    return tokens !== null &&
      tokens.some((token) => typeof token !== "string" && !!token.modifier)
      ? "optional segment"
      : null;
  };

  /**
   * The literal text and parameters of a path, in order, as path-to-regexp
   * reads it: `/files/:id.json` is `/files/`, the parameter `id`, then `.json`,
   * and `/range/:from-:to` holds two parameters parted by `-`. Every generator
   * that writes a path with its parameters filled in reads it from here, never
   * by splitting the text at `:` or `/`. `null` for a path it cannot parse.
   */
  export const segments = (str: string): ISegment[] | null => {
    const tokens: Token[] | null = _Tokenize(str);
    if (tokens === null) return null;
    const output: ISegment[] = [];
    const literal = (value: string): void => {
      if (value.length === 0) return;
      const last: ISegment | undefined = output[output.length - 1];
      if (last?.type === "literal") last.value += value;
      else output.push({ type: "literal", value });
    };
    for (const token of tokens)
      if (typeof token === "string") literal(token);
      else if (typeof token.name === "number") return null;
      else {
        literal(token.prefix);
        output.push({ type: "param", name: token.name });
        literal(token.suffix);
      }
    return output;
  };

  /**
   * The path in OpenAPI's template syntax, each parameter written `{name}`:
   * `/files/:id.json` is `/files/{id}.json`.
   */
  export const toOpenApi = (str: string): string => {
    const list: ISegment[] | null = segments(str);
    return list === null
      ? str
      : list
          .map((s) => (s.type === "literal" ? s.value : `{${s.name}}`))
          .join("");
  };

  export type ISegment =
    | { type: "literal"; value: string }
    | { type: "param"; name: string };

  export const parameters = (str: string): string[] | null => {
    const args = _Parse(str);
    if (args === null) return null;
    return args.filter((arg) => arg.type === "param").map((arg) => arg.value);
  };

  /**
   * The route's tokens, its literal text unescaped. Both routers' spellings of
   * a literal colon are read: path-to-regexp's (Express) `\\:`, and
   * find-my-way's (Fastify) `::`, which path-to-regexp would reject.
   */
  function _Tokenize(str: string): Token[] | null {
    try {
      return parse(fromFastifyColons(join(str)));
    } catch {
      return null;
    }
  }

  function _Parse(str: string): IArgument[] | null {
    const tokens: Token[] | null = _Tokenize(str);
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

/**
 * A route with find-my-way's (Fastify) literal colon `::` spelled as
 * path-to-regexp's `\:`. find-my-way reads `::` as a colon in static text
 * alone: after a parameter it is part of the parameter's name, so it is left as
 * is there, and path-to-regexp then rejects the route, as no parameter of that
 * name is what the handler reads.
 *
 * @internal
 */
const fromFastifyColons = (route: string): string => {
  let output: string = "";
  for (let i: number = 0; i < route.length; ) {
    if (route[i] === "\\") {
      output += route.slice(i, i + 2);
      i += 2;
    } else if (route.startsWith("::", i)) {
      output += "\\:";
      i += 2;
    } else if (route[i] === ":") {
      const name: string = /^:[A-Za-z0-9_$]*/.exec(route.slice(i))![0];
      output += name;
      i += name.length;
      if (route.startsWith("::", i)) {
        output += "::";
        i += 2;
      }
    } else output += route[i++];
  }
  return output;
};
