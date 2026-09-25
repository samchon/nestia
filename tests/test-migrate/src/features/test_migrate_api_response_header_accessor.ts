import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrate SDK generation reads a response key that is no identifier
 * and names the header by the accessor's last key when it is omitted.
 *
 * The accessor was written as raw identifier text, so `x-token` compiled as
 * `output.x - token`, and a `@setHeader` without a header name was dropped
 * (#1729).
 *
 * 1. Build an OpenAPI document with `@setHeader x-token x-token`, `@assignHeaders
 *    x-auth`, and `@setHeader access.token`.
 * 2. Generate the SDK.
 * 3. Assert each key is accessed on its own and the omitted header is `token`.
 */
export const test_migrate_api_response_header_accessor = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.sdk({
    simulate: false,
    e2e: false,
    package: "fixture",
  } satisfies INestiaMigrateConfig);
  const expect = (file: string, statement: string): void => {
    const content: string | undefined = files[`src/functional/${file}`];
    if (content === undefined) throw new Error(`Missing ${file}.`);
    if (content.includes(statement) === false)
      throw new Error(`${file} should include ${statement}`);
  };
  expect(
    "auth/hyphen/index.ts",
    `connection.headers["x-token"] = output["x-token"];`,
  );
  expect(
    "auth/assign/index.ts",
    `Object.assign(connection.headers, output["x-auth"]);`,
  );
  expect(
    "auth/dotted/index.ts",
    "connection.headers.token = output.access.token;",
  );
};

const route = (
  name: string,
  tag: string,
  schema: OpenApiV3_1.IJsonSchema,
): OpenApiV3_1.IPath => ({
  post: {
    operationId: `auth.${name}`,
    description: ["Authenticate.", "", tag].join("\n"),
    responses: {
      "200": {
        description: "OK",
        content: { "application/json": { schema } },
      },
    },
  },
});

const object = (
  properties: Record<string, OpenApiV3_1.IJsonSchema>,
): OpenApiV3_1.IJsonSchema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
});

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Header accessor fixture",
    version: "1.0.0",
  },
  paths: {
    "/auth/hyphen": route(
      "hyphen",
      "@setHeader x-token x-token",
      object({ "x-token": { type: "string" } }),
    ),
    "/auth/assign": route(
      "assign",
      "@assignHeaders x-auth",
      object({ "x-auth": object({ token: { type: "string" } }) }),
    ),
    "/auth/dotted": route(
      "dotted",
      "@setHeader access.token",
      object({ access: object({ token: { type: "string" } }) }),
    ),
  },
} satisfies OpenApiV3_1.IDocument;
