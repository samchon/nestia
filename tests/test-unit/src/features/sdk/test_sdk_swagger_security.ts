import type { INestiaConfig } from "@nestia/sdk";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import type { ITypedHttpRoute } from "../../../../../packages/sdk/lib/structures/ITypedHttpRoute";

/**
 * Checks security requirements through the actual Swagger composer.
 *
 * These rules depend on declared schemes, scopes and the OpenAPI version,
 * rather than native compilation or an HTTP application. One installed CLI
 * rejection retains the connection from decorated controllers to the report.
 *
 * @evidence contracts/testing.md#behavioral-verification SwaggerGenerator.generate processes authored routes and security configurations and writes successful documents. Exact error phrases and route identities distinguish missing schemes, forbidden non-OAuth scopes and undeclared OAuth scopes; successful documents must retain the authored requirements.
 * @evidence contracts/testing.md#independent-expectations OpenAPI 2.0 and 3.0 require empty non-OAuth/non-OpenID scopes; 3.1 and 3.2 permit role names. OAuth scopes must be declared by a configured flow. Literal valid requirements and diagnostic fragments come from those contracts, independently of the composer result.
 * @evidence contracts/testing.md#distinguishing-cases Missing schemes are rejected even with empty scopes. Non-OAuth empty scopes and OAuth declared scopes are positive controls. Version transitions, OpenID scope acceptance, missing OAuth flows and aggregation of independent route violations distinguish the remaining branches. The installed security-error-not-found fixture retains decorator/reflection/CLI error propagation.
 * @evidence contracts/testing.md#execution-ownership The unit runner discovers the matching export and awaits all direct built-generator calls in one process. Authored metadata is an empty void response; the owned filesystem output is removed in finally. No compiler, consumer installation or application host is needed.
 */
export const test_sdk_swagger_security = async (): Promise<void> => {
  const { SwaggerGenerator } = require(
    path.resolve(
      process.cwd(),
      "../../packages/sdk/lib/generates/SwaggerGenerator",
    ),
  ) as typeof import("../../../../../packages/sdk/lib/generates/SwaggerGenerator");
  class SecurityController {}
  const route = (
    key: string,
    security: Record<string, string[]>[],
  ): ITypedHttpRoute => ({
    protocol: "http",
    function: function endpoint() {},
    controller: {
      class: SecurityController,
      prefixes: [],
      paths: [],
      file: "security-fixture.ts",
      versions: undefined,
      operations: [],
      security: [],
      tags: [],
    },
    key,
    name: key,
    method: "GET",
    path: `/${key}`,
    accessor: [key],
    pathParameters: [],
    queryParameters: [],
    headerParameters: [],
    queryObject: null,
    headerObject: null,
    body: null,
    success: {
      type: { name: "void" },
      status: 204,
      contentType: "application/json",
      binary: false,
      encrypted: false,
      setHeaders: [],
      metadata: {
        any: false,
        required: false,
        optional: false,
        nullable: false,
        functions: [],
        atomics: [],
        constants: [],
        templates: [],
        escaped: null,
        rest: null,
        arrays: [],
        tuples: [],
        objects: [],
        aliases: [],
        natives: [],
        sets: [],
        maps: [],
      },
    },
    exceptions: {} as ITypedHttpRoute["exceptions"],
    security,
    tags: [],
    imports: [],
    description: null,
    jsDocTags: [],
    operationId: undefined,
  });
  const schemes: NonNullable<INestiaConfig.ISwaggerConfig["security"]> = {
    bearer: { type: "apiKey", in: "header", name: "Authorization" },
    openid: { type: "openIdConnect", openIdConnectUrl: "https://example.com" },
    oauth2: {
      type: "oauth2",
      flows: {
        implicit: {
          authorizationUrl: "https://example.com/oauth",
          scopes: { "write:pets": "Write pets" },
        },
        clientCredentials: {
          tokenUrl: "https://example.com/token",
          scopes: { "read:pets": "Read pets" },
        },
      },
    },
    noflows: { type: "oauth2", flows: {} },
  };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-security-"));
  let sequence = 0;
  const compose = async (
    openapi: INestiaConfig.ISwaggerConfig["openapi"],
    routes: ITypedHttpRoute[],
  ) => {
    const output = path.join(directory, `${sequence++}.json`);
    const config = { openapi, security: schemes, output };
    await SwaggerGenerator.generate({
      project: {
        config: { input: [], swagger: config },
        input: { controllers: [] },
        errors: [],
        warnings: [],
      },
      collection: {
        objects: new Map(),
        aliases: new Map(),
        arrays: new Map(),
        tuples: new Map(),
      },
      routes,
    });
    return JSON.parse(fs.readFileSync(output, "utf8"));
  };
  try {
    for (const openapi of ["2.0", "3.0", "3.1", "3.2"] as const) {
      const valid = [route("empty", [{ bearer: [] }])];
      if (openapi !== "2.0")
        valid.push(
          route("openid", [{ openid: ["profile"] }]),
          route("declared", [{ oauth2: ["write:pets", "read:pets"] }]),
        );
      if (openapi === "3.1" || openapi === "3.2")
        valid.push(route("roles", [{ bearer: ["x1", "x2"] }]));
      const document = await compose(openapi, valid);
      for (const item of valid)
        assert.deepEqual(
          document.paths[item.path]?.get?.security,
          item.security,
          `${openapi} ${item.key}: valid requirement changed`,
        );
      if (openapi === "2.0" || openapi === "3.0")
        await assert.rejects(
          compose(openapi, [route("bearer", [{ bearer: ["x1", "x2"] }])]),
          (error: Error) => {
            assert.ok(
              error.message.includes(`OpenAPI ${openapi} requires to be empty`),
            );
            assert.ok(
              error.message.includes(
                'SecurityController.bearer() at "GET /bearer"',
              ),
            );
            return true;
          },
        );
    }
    await assert.rejects(
      compose("3.2", [
        route("undeclared", [{ undeclared: [] }]),
        route("oauth2", [{ oauth2: ["unknown"] }]),
        route("noflows", [{ noflows: ["read:pets"] }]),
      ]),
      (error: Error) => {
        for (const fragment of [
          'target security scheme "undeclared" does not exist.',
          'target security scheme "oauth2" does not have a specific scope "unknown".',
          'target security scheme "noflows" does not have a specific scope "read:pets".',
          'SecurityController.undeclared() at "GET /undeclared"',
          'SecurityController.oauth2() at "GET /oauth2"',
          'SecurityController.noflows() at "GET /noflows"',
        ])
          assert.ok(
            error.message.includes(fragment),
            `Missing violation: ${fragment}`,
          );
        assert.equal(error.message.split("  - ").length - 1, 3);
        return true;
      },
    );
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    assert.ok(path.basename(directory).startsWith("nestia-security-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
