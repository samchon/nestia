import { IHttpMigrateRoute } from "@typia/interface";

export namespace SuccessStatus {
  /**
   * The route's success status code, or null when the document declares only a
   * range (`2XX`) or a `default` response.
   *
   * The success response is the one typia's route composer selects: 200, then
   * 201, then the lowest other 2xx. A bodiless one, such as a 204 No Content,
   * leaves `route.success` null, so its status is read from the responses.
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

  /** The status NestJS answers without `@HttpCode()`. */
  export const nest = (route: IHttpMigrateRoute): number =>
    route.method === "post" ? 201 : 200;

  const priority = (status: string): number =>
    status === "200" ? 0 : status === "201" ? 1 : Number(status);
}
