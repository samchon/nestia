import { IHttpMigrateRoute } from "@typia/interface";

/**
 * Helpers about the request body of a route.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the optional-body predicate.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain helper.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace RequestBody {
  /**
   * Whether the route's body may be omitted: a JSON or text body the document
   * does not require. The SDK's positional and keyword functions and the Nest
   * controller all read this one rule.
   *
   * @evidence contracts/common.md#principled-implementation The requirement flag is read from the operation and only an explicit `false` makes the body optional.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the document.
   * @evidence contracts/common.md#meaningful-documentation The comment states the condition.
   */
  export const optional = (route: IHttpMigrateRoute): boolean =>
    route.body !== null &&
    (route.body.type === "application/json" ||
      route.body.type === "text/plain") &&
    route.operation().requestBody?.required === false;
}
