import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import { INestiaConfig } from "../../../../packages/sdk/lib/INestiaConfig";
import { SwaggerGenerator } from "../../../../packages/sdk/lib/generates/SwaggerGenerator";
import { SwaggerUnitRoute } from "../internal/SwaggerUnitRoute";

/**
 * Verifies security alternatives, scope validation and absent authentication.
 *
 * These decisions depend on authored route documentation and configured
 * schemes, not product compilation. Empty anonymous alternatives must survive
 * while an absent requirement remains undefined; treating either as an empty
 * array changes OpenAPI inheritance or authentication semantics.
 *
 * OpenAPI security requirement rules:
 * https://spec.openapis.org/oas/v3.0.3.html#security-requirement-object and
 * https://spec.openapis.org/oas/v3.1.2.html#security-requirement-object.
 *
 * 1. Compose decorated-equivalent and JSDoc basic, bearer and OAuth2 requirements.
 * 2. Compare exact scope alternatives, anonymous access and absent security.
 * 3. Reject invalid schemes/scopes and distinguish older HTTP scopes from roles.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SwaggerGenerator.generate selects and validates authored security requirements, writes a fresh owned document and retains configured scheme definitions. Exact basic/bearer and OAuth2 pairs, anonymous alternative and undefined absence distinguish requirement representation; three invalid configuration twins must throw their specific reasons and write no document.
 * @evidence contracts/testing.md#independent-expectations OpenAPI treats security list members as alternatives and an empty object as anonymous access. Swagger 2/OpenAPI 3.0 require HTTP-auth scopes to be empty; 3.1/3.2 permit role names. OAuth2 scopes must be declared. Authored scheme records and literal requirements establish outputs independently of the composer.
 * @evidence contracts/testing.md#distinguishing-cases Reflected-list and JSDoc forms cover basic, bearer and exact two-scope OAuth2. Anonymous plus bearer contrasts with no requirements; undeclared scheme, older-version HTTP scope and unknown OAuth2 scope each change one valid premise. HTTP roles succeed in 3.1/3.2 and reject in 3.0/2.0. Configuration definitions must remain equal to authored input.
 * @evidence contracts/testing.md#execution-ownership The matching SDK unit export runs against built generator artifacts with plugins off. It supplies complete authored route records and explicit info/server configuration, owns a unique temporary output directory removed in finally, and creates no consumer, compiler, application or child process.
 */
export const test_sdk_swagger_security_requirements =
  async (): Promise<void> => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-security-unit-"),
    );
    try {
      const security: NonNullable<INestiaConfig.ISwaggerConfig["security"]> = {
        basic: { type: "http", scheme: "basic" },
        bearer: { type: "http", scheme: "bearer" },
        oauth2: {
          type: "oauth2",
          flows: {
            implicit: {
              authorizationUrl: "https://example.com/api/oauth/dialog",
              refreshUrl: "https://example.com/api/oauth/refresh",
              scopes: {
                "write:pets": "modify pets in your account",
                "read:pets": "read your pets",
              },
            },
          },
        },
        security: {
          type: "oauth2",
          flows: {
            clientCredentials: {
              tokenUrl: "https://example.com/api/oauth/dialog",
              refreshUrl: "https://example.com/api/oauth/refresh",
              scopes: { x1: "x1", x2: "x2" },
            },
          },
        },
      };
      const config = {
        info: { title: "Security", version: "1" },
        servers: [],
        security,
      };
      let serial = 0;
      const compose = async (
        route: ReturnType<typeof SwaggerUnitRoute>,
        openapi?: INestiaConfig.ISwaggerConfig["openapi"],
      ) => {
        const output = path.join(directory, `${++serial}.json`);
        try {
          await SwaggerGenerator.generate({
            project: {
              config: { input: [], swagger: { ...config, output, openapi } },
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
            routes: [route],
          });
        } catch (error) {
          assert.equal(
            fs.existsSync(output),
            false,
            "Invalid security wrote a document.",
          );
          throw error;
        }
        return JSON.parse(fs.readFileSync(output, "utf8"));
      };
      for (const [scheme, scopes] of [
        ["basic", []],
        ["bearer", []],
        ["oauth2", ["write:pets", "read:pets"]],
      ] as const) {
        for (const form of ["reflected", "comment"] as const) {
          const route = SwaggerUnitRoute();
          if (form === "reflected")
            route.security = [{ [scheme]: [...scopes] }];
          else
            route.jsDocTags = [
              {
                name: "security",
                text: [{ kind: "text", text: [scheme, ...scopes].join(" ") }],
              },
            ];
          const document = await compose(route);
          assert.deepEqual(document.paths!["/unit"]!.get!.security, [
            { [scheme]: [...scopes] },
          ]);
          assert.deepEqual(document.components.securitySchemes, security);
        }
      }
      const optional = SwaggerUnitRoute();
      optional.jsDocTags = [
        { name: "security" },
        { name: "security", text: [{ kind: "text", text: "bearer" }] },
      ];
      assert.deepEqual(
        (await compose(optional)).paths!["/unit"]!.get!.security,
        [{}, { bearer: [] }],
      );
      assert.equal(
        (await compose(SwaggerUnitRoute())).paths!["/unit"]!.get!.security,
        undefined,
      );
      for (const [requirement, reason] of [
        [
          { undeclared: [] },
          'target security scheme "undeclared" does not exist.',
        ],
        [
          { oauth2: ["unknown"] },
          'target security scheme "oauth2" does not have a specific scope "unknown".',
        ],
      ] as const) {
        const route = SwaggerUnitRoute();
        route.security = [
          Object.fromEntries(
            Object.entries(requirement).map(([scheme, scopes]) => [
              scheme,
              [...scopes],
            ]),
          ),
        ];
        await assert.rejects(compose(route), (error: Error) =>
          error.message.includes(reason),
        );
      }
      const roles = SwaggerUnitRoute();
      roles.security = [{ bearer: ["admin"] }];
      for (const version of ["3.1", "3.2"] as const)
        assert.deepEqual(
          (await compose(roles, version)).paths["/unit"].get.security,
          [{ bearer: ["admin"] }],
        );
      for (const version of ["3.0", "2.0"] as const)
        await assert.rejects(
          compose(roles, version),
          (error: Error) =>
            error.message.includes(
              'target security scheme "bearer" is neither "oauth2" nor "openIdConnect" type',
            ) && error.message.includes(`OpenAPI ${version}`),
        );
    } finally {
      assert.equal(path.dirname(directory), os.tmpdir());
      assert(path.basename(directory).startsWith("nestia-security-unit-"));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  };
