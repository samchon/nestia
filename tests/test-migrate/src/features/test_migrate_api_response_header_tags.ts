import {
  INestiaMigrateConfig,
  NestiaMigrateApplication,
} from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrate SDK generation honors response header assignment tags.
 *
 * Locks the description-tag contract used by migrated SDK functions. The source
 * OpenAPI operation can carry `@setHeader`, `@setHeaders`, or `@assignHeaders`
 * tags in its description; the generated SDK must turn the fetched response
 * into a local `output` value, copy the selected response fields into
 * `connection.headers`, and then return that output.
 *
 * 1. Build a synthetic OpenAPI document with `@setHeader`, `@setHeaders`, and
 *    `@assignHeaders` operation descriptions.
 * 2. Generate a keyword SDK from the migrate application.
 * 3. Assert the generated functions write the expected connection headers.
 */
export const test_migrate_api_response_header_tags = (): void => {
  const app: NestiaMigrateApplication =
    NestiaMigrateApplication.assert(DOCUMENT);
  const files: Record<string, string> = app.sdk({
    keyword: true,
    simulate: true,
    e2e: false,
    package: "fixture",
  } satisfies INestiaMigrateConfig);

  const join: string | undefined = files["src/functional/auth/join/index.ts"];
  const refresh: string | undefined =
    files["src/functional/auth/refresh/index.ts"];
  const login: string | undefined = files["src/functional/auth/login/index.ts"];
  if (join === undefined) throw new Error("Missing join API file.");
  if (refresh === undefined) throw new Error("Missing refresh API file.");
  if (login === undefined) throw new Error("Missing login API file.");

  assertSetHeaderRoute(join, "setHeaders");
  assertSetHeaderRoute(refresh, "setHeader");

  if (login.includes("const output: post.Response =") === false)
    throw new Error("assignHeaders route should retain the response output.");
  if (login.includes("connection.headers ??= {};") === false)
    throw new Error(
      "assignHeaders route should initialize connection.headers.",
    );
  if (
    login.includes(
      "Object.assign(connection.headers, output.authorization);",
    ) === false
  )
    throw new Error("assignHeaders route should assign response headers.");
  if (login.includes("return output;") === false)
    throw new Error("assignHeaders route should return the captured output.");
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Header tag fixture",
    version: "1.0.0",
  },
  paths: {
    "/auth/join": {
      post: {
        operationId: "auth.join",
        description: [
          "Join as a seller.",
          "",
          "@setHeaders authorization.token Authorization",
        ].join("\n"),
        requestBody: requestBody(),
        responses: {
          "200": response(),
        },
      },
    },
    "/auth/login": {
      post: {
        operationId: "auth.login",
        description: [
          "Log-in as a seller.",
          "",
          "@assignHeaders authorization",
        ].join("\n"),
        requestBody: requestBody(),
        responses: {
          "200": response(),
        },
      },
    },
    "/auth/refresh": {
      post: {
        operationId: "auth.refresh",
        description: [
          "Refresh a seller token.",
          "",
          "@setHeader authorization.token Authorization",
        ].join("\n"),
        requestBody: requestBody(),
        responses: {
          "200": response(),
        },
      },
    },
  },
} satisfies OpenApiV3_1.IDocument;

function assertSetHeaderRoute(content: string, tag: string): void {
  if (content.includes("const output: post.Response =") === false)
    throw new Error(`${tag} route should retain the response output.`);
  if (content.includes("connection.headers ??= {};") === false)
    throw new Error(`${tag} route should initialize connection.headers.`);
  if (
    content.includes(
      "connection.headers.Authorization = output.authorization.token;",
    ) === false
  )
    throw new Error(`${tag} route should copy token to Authorization.`);
  if (content.includes("return output;") === false)
    throw new Error(`${tag} route should return the captured output.`);
}

function requestBody(): OpenApiV3_1.IOperation.IRequestBody {
  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
            },
          },
          required: ["email"],
        },
      },
    },
  };
}

function response(): OpenApiV3_1.IOperation.IResponse {
  return {
    description: "OK",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            authorization: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                },
              },
              required: ["token"],
            },
          },
          required: ["authorization"],
        },
      },
    },
  };
}
