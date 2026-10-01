import { IHttpMigrateRoute } from "@typia/interface";

/**
 * Splits a route path template into literal and parameter segments.
 *
 * @evidence contracts/common.md#principled-implementation The namespace scans the template for `{name}` placeholders and matches each with the route's parameter of that name.
 * @evidence contracts/common.md#clear-and-simple-design One type and one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The scan is by the template syntax.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace PathTemplate {
  /**
   * A segment of a path: a literal text or a parameter.
   *
   * @evidence contracts/common.md#principled-implementation The union is discriminated by `type`, so a consumer handles each case once.
   * @evidence contracts/common.md#clear-and-simple-design A two-member union.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the two cases.
   */
  export type ISegment =
    | { type: "literal"; value: string }
    | { type: "param"; parameter: IHttpMigrateRoute.IParameter };

  /**
   * The route's path as literal text and path parameters, in order, read from
   * the document's own template (`/files/{id}.json`), whose braces delimit each
   * parameter name. The emended path (`/files/:id.json`) cannot be split back:
   * its `:id.json` could name `id` or `id.json`, and a name such as `item-id`
   * would read as `item` followed by `-id`. It always starts with `/`, as the
   * emended path does.
   *
   * @evidence contracts/common.md#principled-implementation The scan uses a regular expression over the placeholders and joins the text between them, and merging adjacent literals keeps the segment list minimal.
   * @evidence contracts/common.md#clear-and-simple-design One function with one helper for merging.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It never drops text of the template.
   * @evidence contracts/common.md#meaningful-documentation The comment states the merging and the unmatched placeholder rule.
   */
  export const segments = (route: IHttpMigrateRoute): ISegment[] => {
    const path: string = route.path.startsWith("/")
      ? route.path
      : `/${route.path}`;
    const output: ISegment[] = [];
    const literal = (value: string): void => {
      if (value.length === 0) return;
      const last: ISegment | undefined = output[output.length - 1];
      if (last?.type === "literal") last.value += value;
      else output.push({ type: "literal", value });
    };
    let cursor: number = 0;
    for (const match of path.matchAll(/\{([^{}]+)\}/g)) {
      literal(path.slice(cursor, match.index));
      cursor = match.index! + match[0].length;
      const parameter: IHttpMigrateRoute.IParameter | undefined =
        route.parameters.find((p) => p.name === match[1]);
      if (parameter === undefined) literal(match[0]);
      else output.push({ type: "param", parameter });
    }
    literal(path.slice(cursor));
    return output;
  };
}
