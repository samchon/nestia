import { OpenApiV3_1 } from "@typia/interface";

import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";

/**
 * Verifies migrated SDK functions and NestJS routes place each path parameter
 * where the document's template writes it, beside literal text in its segment
 * too.
 *
 * The SDK path template split the emended path at `:` and took each name up to
 * the next `/`, so `/files/{id}.json` read a parameter `id.json` that does not
 * exist, and both `sdk()` and `nest()` threw "Cannot read properties of
 * undefined (reading 'key')" (#1705). The document's braces delimit every name,
 * including a hyphenated one beside a literal.
 *
 * 1. Migrate a document holding `/files/{id}.json`, `/range/{from}-{to}`, and
 *    `/items/{item-id}.json` in SDK and NestJS modes.
 * 2. Assert each SDK path function fills its parameters in where they stand.
 * 3. Assert each NestJS route, controller and method paths joined, reads each
 *    parameter under the key its `@TypedParam()` uses.
 *
 * @evidence contracts/testing.md#behavioral-verification SDK and Nest text place parameters beside literal suffixes/separators and normalize hyphenated keys; Nest joined routes match all originals.
 * @evidence contracts/testing.md#independent-expectations Braces delimit the authored parameter names in three literal templates, independently of generated route parsing.
 * @evidence contracts/testing.md#distinguishing-cases Suffix .json, two parameters in one segment and hyphenated names exercise separate tokenization boundaries in both modes.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct migrate unit through test:unit. The caller-built migration operation consumes authored OpenAPI data and returns project text without consumer installation, native compilation or a backend.
 */
export const test_migrate_path_segments = (): void => {
  const expected: string[] = [
    '`/files/${PathParameter.encode("id", id)}.json`',
    '`/range/${PathParameter.encode("from", from)}-${PathParameter.encode("to", to)}`',
    '`/items/${PathParameter.encode("item_id", item_id)}.json`',
  ];
  for (const mode of ["sdk", "nest"] as const) {
    const files: Record<string, string> = NestiaMigrateApplication.assert(
      DOCUMENT,
    )[mode]({
      keyword: false,
      simulate: false,
      e2e: false,
      package: "fixture",
    });
    const functional: string = Object.entries(files)
      .filter(([key]) => key.includes("functional"))
      .map(([, content]) => normalize(content))
      .join("\n");
    for (const template of expected)
      if (functional.includes(normalize(template)) === false)
        throw new Error(
          `${mode}: no SDK path function writes ${template}:\n${functional}`,
        );
    if (mode === "nest") {
      const routes: string[] = Object.entries(files)
        .filter(([key]) => key.endsWith("Controller.ts"))
        .flatMap(([, content]) => collect(content));
      for (const route of [
        "GET /files/:id.json",
        "GET /range/:from-:to",
        "GET /items/:item_id.json",
      ])
        if (routes.includes(route) === false)
          throw new Error(
            `The migrated server does not route ${route}: ${JSON.stringify(routes)}`,
          );
    }
  }
};

/** The code without whitespace or the trailing commas a formatter adds. */
const normalize = (code: string): string =>
  code.replace(/\s+/g, "").replace(/,\)/g, ")");

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

const parameter = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
});

const ok = {
  200: {
    description: "ok",
    content: { "application/json": { schema: { type: "string" } } },
  },
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Path segments", version: "1.0.0" },
  paths: {
    "/files/{id}.json": {
      get: { parameters: [parameter("id")], responses: ok },
    },
    "/range/{from}-{to}": {
      get: { parameters: [parameter("from"), parameter("to")], responses: ok },
    },
    "/items/{item-id}.json": {
      get: { parameters: [parameter("item-id")], responses: ok },
    },
  },
  components: {},
} as unknown as OpenApiV3_1.IDocument;
