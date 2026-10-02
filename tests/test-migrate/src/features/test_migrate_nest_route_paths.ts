import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies a migrated NestJS server routes every operation at the document's
 * path, whatever its response type, method, or parameter spelling.
 *
 * JSON routes took their path relative to the controller, but text/plain
 * responses and HEAD operations wrote the document's full path in brace syntax,
 * so NestJS served them at the controller's path joined with it again; and a
 * path parameter such as `item-id` kept its name in the route while the handler
 * read `@TypedParam("item_id")` (#1685).
 *
 * 1. Migrate a document with a text/plain GET, a JSON POST, a HEAD, and a
 *    hyphenated path parameter.
 * 2. For every handler, join the controller path and the method decorator's path
 *    as NestJS's router does, and assert it is the document's path with each
 *    parameter under the key its `@TypedParam()` reads.
 */
export const test_migrate_nest_route_paths = (): void => {
  const files: Record<string, string> = NestiaMigrateApplication.assert(
    DOCUMENT,
  ).nest({
    keyword: false,
    simulate: false,
    e2e: false,
    package: "fixture",
  });
  const routes: string[] = Object.entries(files)
    .filter(([key]) => key.endsWith("Controller.ts"))
    .flatMap(([, content]) => collect(content));
  for (const route of [
    "GET /items/:id",
    "POST /items/:id",
    "HEAD /files/:id",
    "GET /items/:item_id/tags",
  ])
    if (routes.includes(route) === false)
      throw new Error(
        `The migrated server does not route ${route}: ${JSON.stringify(routes)}`,
      );
  if (
    Object.values(files).join("\n").includes(`TypedParam("item_id")`) === false
  )
    throw new Error("The hyphenated path parameter is not read by its key.");
};

/** `METHOD /path` of each handler, joined as NestJS's router joins them. */
const collect = (content: string): string[] => {
  const controller: RegExpMatchArray | null = content.match(
    /@Controller\(\s*"([^"]*)"\s*\)/,
  );
  if (controller === null) return [];
  const output: string[] = [];
  const decorator: RegExp =
    /@(?:[A-Za-z_$][\w$]*\.)*(Get|Post|Put|Patch|Delete|Head)\(\s*(?:"([^"]*)")?\s*\)/g;
  for (const match of content.matchAll(decorator)) {
    const path: string = [controller[1]!, match[2] ?? ""]
      .join("/")
      .split("/")
      .filter((segment) => segment.length !== 0)
      .join("/");
    output.push(`${match[1]!.toUpperCase()} /${path}`);
  }
  return output;
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Route paths", version: "1.0.0" },
  paths: {
    "/items/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      get: {
        responses: {
          200: {
            description: "text",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      },
      post: {
        responses: {
          201: {
            description: "json",
            content: {
              "application/json": {
                schema: { type: "object", properties: {} },
              },
            },
          },
        },
      },
    },
    "/files/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      head: { responses: { 200: { description: "exists" } } },
    },
    "/items/{item-id}/tags": {
      parameters: [
        {
          name: "item-id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        responses: {
          200: {
            description: "tags",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
  components: {},
} as unknown as OpenApiV3_1.IDocument;
