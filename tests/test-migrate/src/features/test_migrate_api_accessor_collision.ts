import {
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";

import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "../../../../packages/migrate/lib";

type SwaggerDocument =
  | SwaggerV2.IDocument
  | OpenApiV3.IDocument
  | OpenApiV3_1.IDocument
  | OpenApiV3_2.IDocument;

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
 * 1. Build a migrate application from two independently authored routes.
 * 2. Force two route accessors into a prefix collision.
 * 3. Assert the generated SDK keeps the shorter function and escapes the child
 *    namespace in functional files and e2e calls.
 *
 * @evidence contracts/testing.md#behavioral-verification sdk writes a shorter function and nested namespace from deliberately colliding route accessors; assertions require the public item function, escaped _item namespace and matching generated e2e call, and reject the unescaped namespace.
 * @evidence contracts/testing.md#independent-expectations JavaScript cannot export both a function and a namespace under item. The shorter accessor remains public while its child must escape; the authored two-route document supplies both independently of Swagger generation.
 * @evidence contracts/testing.md#distinguishing-cases The prefix collision is the positive escape case and the unchanged shorter function is its negative control; the generated e2e call must follow the changed namespace rather than the former spelling.
 * @evidence contracts/testing.md#execution-ownership The unit entry discovers this matching export and uses its authored default document against built migrate operations. The retained integration entry also supplies the real fixture document without adding any preparation to this unit.
 */
export const test_migrate_api_accessor_collision = (
  document: SwaggerDocument = {
    openapi: "3.1.0",
    info: { title: "Accessor collision", version: "1.0.0" },
    paths: {
      "/first": { get: { responses: { "204": { description: "empty" } } } },
      "/second": { get: { responses: { "204": { description: "empty" } } } },
    },
  },
): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(document);
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
