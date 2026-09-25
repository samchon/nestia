import { Token, match, parse } from "path-to-regexp";

/**
 * A WebSocket route's path, matched as NestJS 11's Express router matches an
 * HTTP route: path-to-regexp 8's syntax, where `\:` is a literal colon, `*name`
 * a wildcard, and `{...}` an optional group; find-my-way's (Fastify) literal
 * colon `::` is read too, as `@nestia/sdk` reads it when it builds the SDK's
 * URL.
 *
 * @internal
 */
export class RoutePathMatcher {
  /** The names of the path's parameters and wildcards, in order. */
  public readonly params: string[];

  private readonly match_: (
    path: string,
  ) => false | { params: Partial<Record<string, string | string[]>> };

  public constructor(private readonly path: string) {
    const route: string = fromFastifyColons(path);
    this.params = names(parse(route).tokens);
    this.match_ = match(route, {
      decode: (value: string) => {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      },
    });
  }

  /**
   * The parameters of a matching request path, or `null`. A wildcard's segments
   * are joined by `/`, and an optional parameter absent is left out.
   */
  public test(path: string): Record<string, string> | null {
    const matched = this.match_(path);
    if (matched === false) return null;
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(matched.params))
      if (value !== undefined)
        output[key] = Array.isArray(value) ? value.join("/") : value;
    return output;
  }

  public toString(): string {
    return this.path;
  }
}

const names = (tokens: Token[]): string[] =>
  tokens.flatMap((token) =>
    token.type === "param" || token.type === "wildcard"
      ? [token.name]
      : token.type === "group"
        ? names(token.tokens)
        : [],
  );

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
