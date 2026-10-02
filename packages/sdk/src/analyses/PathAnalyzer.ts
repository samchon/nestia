import { RequestMethod } from "@nestjs/common";
import { Token, parse } from "path-to-regexp";

/**
 * Helpers for route paths: joining, prefixing, and reading their parameters the
 * way the router does.
 *
 * @evidence contracts/common.md#principled-implementation Paths are parsed by `path-to-regexp` after Fastify colon escapes are converted, so the parameters and literals are those the server reads.
 * @evidence contracts/common.md#clear-and-simple-design Several small functions over one tokenizer and one parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The router's own grammar decides, and no path is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace PathAnalyzer {
  /**
   * The route paths joined as the router joins them: one `/` between them, and
   * none doubled. A route path is router syntax, never a file path, so a
   * backslash stays the escape of the character after it (`items\\:batchGet`).
   *
   * @evidence contracts/common.md#principled-implementation The parts are joined, split on slashes, and empty segments are dropped, so any number of slashes at the boundaries collapses.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It applies to every input.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result form.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.join interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const join = (...args: string[]) =>
    "/" +
    args
      .join("/")
      .split("/")
      .filter((str) => str.length !== 0)
      .join("/");

  /**
   * Joins a path with the global prefix, unless the route is excluded from the
   * prefix.
   *
   * @evidence contracts/common.md#principled-implementation The exclusion list is matched by method and by exact path or pattern, as NestJS does, and an excluded route is joined with an empty prefix.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating the exclusion test to a private helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exclusion rule is NestJS's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the exclusion.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.joinWithGlobalPrefix interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Whether a route path holds a wildcard: a `*` not escaped as the literal
   * character (`\\*`), which a route path may hold since #1713.
   *
   * @evidence contracts/common.md#principled-implementation A star preceded by a backslash is a literal, so the test looks for a star at the start or after a non-backslash character.
   * @evidence contracts/common.md#clear-and-simple-design One regular expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the router's escaping rule.
   * @evidence contracts/common.md#meaningful-documentation The comment states the escaped case.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.wildcard interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const wildcard = (str: string): boolean => /(^|[^\\])\*/.test(str);

  /**
   * The literal text and parameters of a path, in order, as path-to-regexp
   * reads it: `/files/:id.json` is `/files/`, the parameter `id`, then `.json`,
   * and `/range/:from-:to` holds two parameters parted by `-`. Every generator
   * that writes a path with its parameters filled in reads it from here, never
   * by splitting the text at `:` or `/`. `null` for a path it cannot parse.
   *
   * @evidence contracts/common.md#principled-implementation Tokens come from `path-to-regexp`, so text next to a parameter in one segment, such as `/files/:id.json`, is kept in place, adjacent literals merge, and an unnamed parameter makes the path unreadable.
   * @evidence contracts/common.md#clear-and-simple-design One function over the tokenizer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The grammar is the router's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result and why generators use it.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.segments interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
   *
   * @evidence contracts/common.md#principled-implementation The segments are joined with literals verbatim and parameters in braces.
   * @evidence contracts/common.md#clear-and-simple-design One expression over `segments`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the same segmenter as the SDK generator.
   * @evidence contracts/common.md#meaningful-documentation The comment states the fallback.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.toOpenApi interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const toOpenApi = (str: string): string => {
    const list: ISegment[] | null = segments(str);
    return list === null
      ? str
      : list
          .map((s) => (s.type === "literal" ? s.value : `{${s.name}}`))
          .join("");
  };

  /**
   * A segment of a path: literal text or a named parameter.
   *
   * @evidence contracts/common.md#principled-implementation The union is discriminated by `type`, so a consumer handles each case once.
   * @evidence contracts/common.md#clear-and-simple-design A two-member union.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the two cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.ISegment interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export type ISegment =
    | { type: "literal"; value: string }
    | { type: "param"; name: string };

  /**
   * Returns the names of the parameters of a path, or `null` when the path
   * cannot be parsed.
   *
   * @evidence contracts/common.md#principled-implementation The parsed arguments are filtered to the parameters, and an empty parameter name makes the path unreadable.
   * @evidence contracts/common.md#clear-and-simple-design One filter over the private parser.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The grammar is the router's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation PathAnalyzer.parameters interprets router protocol paths; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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
