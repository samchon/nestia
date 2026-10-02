import { IHttpMigrateRoute } from "@typia/interface";

/**
 * Helpers about the success status of a route.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the status that the SDK should treat as success and the status that the generated NestJS controller answers.
 * @evidence contracts/common.md#clear-and-simple-design Two functions and one private priority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules follow HTTP conventions.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace SuccessStatus {
  /**
   * The route's success status code, or null when the document declares only a
   * range (`2XX`) or a `default` response.
   *
   * The success response is the one typia's route composer selects: 200, then
   * 201, then the lowest other 2xx. A bodiless one, such as a 204 No Content,
   * leaves `route.success` null, so its status is read from the responses.
   *
   * @evidence contracts/common.md#principled-implementation The candidates are the 2xx keys of the responses ordered by a fixed priority, and a value that is not a three-digit number is rejected.
   * @evidence contracts/common.md#clear-and-simple-design One function with one priority helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The order is the HTTP convention.
   * @evidence contracts/common.md#meaningful-documentation The comment states the selection.
   */
  export const of = (route: IHttpMigrateRoute): number | null => {
    const status: string | undefined =
      route.success?.status ??
      Object.keys(route.operation().responses ?? {})
        .filter((key) => /^2\d\d$/.test(key))
        .sort((x, y) => priority(x) - priority(y))[0];
    return status !== undefined && /^\d{3}$/.test(status)
      ? Number(status)
      : null;
  };

  /**
   * The status NestJS answers without `@HttpCode()`.
   *
   * @evidence contracts/common.md#principled-implementation NestJS answers 201 for POST and 200 for the other methods when no status is set, so a generated controller matches without an explicit one.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is NestJS's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the two statuses.
   */
  export const nest = (route: IHttpMigrateRoute): number =>
    route.method === "post" ? 201 : 200;

  const priority = (status: string): number =>
    status === "200" ? 0 : status === "201" ? 1 : Number(status);
}
