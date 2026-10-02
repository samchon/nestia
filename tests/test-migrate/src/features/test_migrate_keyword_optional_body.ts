import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies keyword mode makes a request body optional exactly where positional
 * mode does.
 *
 * Keyword mode's `Props` listed every body as required, so a caller could not
 * omit a body whose `requestBody.required` is `false`, which positional mode
 * already declares `body?:` (#1737).
 *
 * 1. Migrate a document with an optional and a required JSON body.
 * 2. Assert keyword `Props` marks only the optional body `?`.
 * 3. Assert positional mode marks the same body `?`.
 */
export const test_migrate_keyword_optional_body = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const read = (keyword: boolean, name: string): string => {
    const files: Record<string, string> = app.sdk({
      keyword,
      simulate: false,
      e2e: false,
      package: "fixture",
    });
    const content: string | undefined =
      files[`src/functional/${name}/index.ts`];
    if (content === undefined) throw new Error(`Missing ${name}.`);
    return content.replace(/\s+/g, " ");
  };
  const expect = (content: string, needle: string): void => {
    if (content.includes(needle) === false)
      throw new Error(`Expected ${needle} in:\n${content}`);
  };
  expect(read(true, "optional"), "export type Props = { body?:");
  expect(read(true, "required"), "export type Props = { body:");
  expect(read(false, "optional"), "body?: post.Body");
  expect(read(false, "required"), "body: post.Body");
};

const body = (required: boolean): OpenApiV3_1.IOperation.IRequestBody => ({
  required,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
});

const created = (): Record<string, OpenApiV3_1.IOperation.IResponse> => ({
  "201": {
    description: "Created",
    content: { "application/json": { schema: { type: "string" } } },
  },
});

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Optional body fixture", version: "1.0.0" },
  paths: {
    "/optional": {
      post: { requestBody: body(false), responses: created() },
    },
    "/required": {
      post: { requestBody: body(true), responses: created() },
    },
  },
} satisfies OpenApiV3_1.IDocument;
