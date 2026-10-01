import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrate SDK generation escapes function names that collide with
 * child namespaces.
 *
 * Locks the final generator guard after the OpenAPI route accessor phase.
 * Upstream accessors normally avoid prefix collisions, but custom accessors or
 * future composer changes can still hand the migrate generator a shorter route
 * whose function name matches a longer route's child namespace. Emitting both
 * in the same index file creates duplicate exported bindings.
 *
 * 1. Build a migrate application from a document of two routes.
 * 2. Force two route accessors into a prefix collision.
 * 3. Assert the generated SDK keeps the shorter function and escapes the child
 *    namespace in functional files and e2e calls.
 *
 * @evidence contracts/testing.md#behavioral-verification It forces two route accessors into a prefix collision in a two-route document and asserts the SDK keeps the shorter function, escapes the child namespace, and that the e2e call follows the escaped accessor.
 * @evidence contracts/testing.md#independent-expectations Two bindings of one name in one module are invalid TypeScript, so the expected exports are the shorter function and an underscore-escaped namespace, written literally.
 * @evidence contracts/testing.md#distinguishing-cases The collision itself, the kept function, the escaped namespace, the absence of the colliding export, and the e2e call are separate assertions.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-migrate` process discovered by `DynamicExecutor`, generating files in memory from a synthetic OpenAPI document with the built `@nestia/migrate` and inspecting the returned strings; compiling generated projects is owned by the shared `test-e2e` migration batch boundary.
 */
export const test_migrate_api_accessor_collision = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const routes = app
    .getData()
    .routes.filter((route) => route.method !== "query");
  if (routes.length < 2)
    throw new Error("Fixture must provide at least two migrate routes.");

  routes[0]!.accessor = ["collision", "item"];
  routes[1]!.accessor = ["collision", "item", "detail"];

  const files: Record<string, string> = app.sdk({
    keyword: true,
    simulate: true,
    e2e: true,
    package: "fixture",
  } satisfies INestiaMigrateConfig);
  const root: string | undefined = files["src/functional/collision/index.ts"];
  const child: string | undefined =
    files["src/functional/collision/_item/index.ts"];
  const nestedTest: string | undefined =
    files["test/features/api/test_api_collision__item_detail.ts"];

  if (root === undefined) throw new Error("Missing collision root API file.");
  if (root.includes(`export async function item`) === false)
    throw new Error("The shorter route function should keep its public name.");
  if (root.includes(`export * as _item from "./_item/index";`) === false)
    throw new Error(
      "The child namespace should be escaped to avoid collision.",
    );
  if (root.includes(`export * as item from "./item/index";`))
    throw new Error(
      "The child namespace still collides with the route function.",
    );
  if (child === undefined) throw new Error("Missing escaped child API file.");
  if (nestedTest?.includes("api.functional.collision._item.detail") !== true)
    throw new Error("Generated e2e call did not follow the escaped accessor.");
};

const DOCUMENT: OpenApiV3_1.IDocument = {
  openapi: "3.1.0",
  info: { title: "Accessor collision", version: "1.0.0" },
  paths: {
    "/first": {
      get: {
        operationId: "first",
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/second": {
      get: {
        operationId: "second",
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
};
