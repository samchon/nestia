import { IHttpMigrateRoute } from "@typia/interface";

export namespace PathTemplate {
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
