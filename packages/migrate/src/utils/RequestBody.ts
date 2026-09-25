import { IHttpMigrateRoute } from "@typia/interface";

export namespace RequestBody {
  /**
   * Whether the route's body may be omitted: a JSON or text body the document
   * does not require. The SDK's positional and keyword functions and the Nest
   * controller all read this one rule.
   */
  export const optional = (route: IHttpMigrateRoute): boolean =>
    route.body !== null &&
    (route.body.type === "application/json" ||
      route.body.type === "text/plain") &&
    route.operation().requestBody?.required === false;
}
