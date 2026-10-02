import { OpenApiV3_1 } from "@typia/interface";

import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";

/**
 * Verifies migration keeps the success status an operation declares, in the
 * SDK's fetch route and as the Nest controller's `@HttpCode()`.
 *
 * Every SDK function passed `status: null`, and the fetcher reads only 200,
 * 201, and that status as success, so a 204 No Content threw `HttpError` on
 * success; the controller answered NestJS's default, 200 for a `DELETE` and 201
 * for a `POST`, whatever the document declared (#1736).
 *
 * 1. Migrate a document with a bodiless 204 `DELETE`, a 200 `POST`, a 202 `PUT`, a
 *    plain 200 `GET`, and a `2XX` `PATCH`.
 * 2. Assert each SDK function passes its status, and `null` for the range.
 * 3. Assert the controller writes `@HttpCode()` exactly where the status is not
 *    NestJS's default.
 */
export const test_migrate_success_status = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files = app.sdk({ simulate: false, e2e: false, package: "fixture" });
  const expected: Record<string, string> = {
    delete: "204",
    post: "200",
    put: "202",
    get: "200",
    patch: "null",
  };
  for (const route of app.getData().routes) {
    const name: string = route.accessor.at(-1)!;
    const file: string = `src/functional/${[...route.accessor.slice(0, -1), "index.ts"].join("/")}`;
    const source: string | undefined = files[file];
    const body: string | undefined = source
      ?.split("export async function ")
      .find((part) => part.startsWith(`${name}(`));
    if (body?.includes(`status: ${expected[route.method]},`) !== true)
      throw new Error(
        `The ${route.method} SDK function passes an incorrect status:\n${body}`,
      );
  }

  const nest: string = Object.entries(
    app.nest({ simulate: false, e2e: false, package: "fixture" }),
  )
    .filter(([key]) => key.endsWith("Controller.ts"))
    .map(([, value]) => value)
    .join("\n");
  const codes: string[] = [...nest.matchAll(/@HttpCode\((\d+)\)/g)]
    .map((match) => match[1]!)
    .sort();
  if (JSON.stringify(codes) !== JSON.stringify(["200", "202", "204"]))
    throw new Error(`The controller writes @HttpCode ${codes}:\n${nest}`);
};

const json = (): OpenApiV3_1.IOperation.IResponse => ({
  description: "OK",
  content: { "application/json": { schema: { type: "string" } } },
});

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Success status fixture", version: "1.0.0" },
  paths: {
    "/items/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      delete: {
        operationId: "items.erase",
        responses: { "204": { description: "No Content" } },
      },
      post: {
        operationId: "items.create",
        responses: { "200": json() },
      },
      put: {
        operationId: "items.update",
        responses: { "202": json() },
      },
      get: {
        operationId: "items.at",
        responses: { "200": json() },
      },
      patch: {
        operationId: "items.patch",
        responses: { "2XX": json() },
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;
