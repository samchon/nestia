import { Controller, Get } from "@nestjs/common";
import { ApiOAuth2, ApiSecurity } from "@nestjs/swagger";
import assert from "assert/strict";
import type { OpenApi } from "typia";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@ApiSecurity("bearer")
@Controller("secure")
class SecurityAlternativesController {
  @ApiSecurity({ bearer: [], key: [] })
  @Get("both")
  public both(): void {}

  @ApiOAuth2(["read"])
  @ApiOAuth2(["write"])
  @Get("either")
  public either(): void {}

  @Get("scoped")
  public scoped(): void {}

  @Get("optional")
  public optional(): void {}

  @ApiSecurity("bearer")
  @Get("repeated")
  public repeated(): void {}
}

@Controller("public")
class PublicSecurityController {
  @Get("absent")
  public absent(): void {}

  @Get("anonymous")
  public anonymous(): void {}
}

/**
 * Verifies Swagger preserves AND/OR security groups and anonymous versus absent
 * requirements through direct reflection and composition.
 *
 * Splitting schemes weakens an AND requirement; joining alternative OAuth
 * scopes strengthens an OR requirement. An absent operation requirement
 * inherits a document default, whereas an empty object permits anonymous
 * access. These portable decisions need no application or native producer.
 *
 * 1. Analyze real security decorators with independently authored void and JSDoc
 *    metadata, including a controller requirement repeated by a method.
 * 2. Compose the retained routes twice and compare each literal requirement group,
 *    anonymous control and absent property.
 * 3. Verify composition leaves the original route inputs unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Real reflection, typed-route analysis and SwaggerGenerator composition must preserve controller bearer, a combined bearer/key alternative, separate read/write alternatives, both scopes in one alternative, an anonymous alternative and deduplication. A separate undecorated controller distinguishes absence from anonymous access. Repeated composition also checks the retained input values are not mutated.
 * @evidence contracts/testing.md#independent-expectations OpenAPI security is a list of OR alternatives whose member schemes and scopes are required together. Literal authored requirements establish the oracle, and canonical object-key sorting only removes irrelevant scheme-key order; no expected value is computed by SecurityAnalyzer. Empty object and omitted security have different OpenAPI meanings.
 * @evidence contracts/testing.md#distinguishing-cases Both schemes versus separate alternatives, read or write versus both scopes, controller versus duplicate method requirement, anonymous versus absent, and two compositions over retained inputs distinguish grouping, deduplication, omission and mutation. Native JSDoc production and the installed compiler-to-generator connection remain separate owners in the native and shared E2E populations.
 * @evidence contracts/testing.md#execution-ownership The test-sdk DynamicExecutor discovers this matching export. It invokes caller-built reflection and composer operations with actual Nest security decorators and authored metadata, without consumer installation, product-fixture compilation, Nest application creation, HTTP host, worker or child process.
 */
export const test_sdk_swagger_security_alternatives =
  async (): Promise<void> => {
    for (const [controller, keys] of [
      [
        SecurityAlternativesController,
        ["both", "either", "scoped", "optional", "repeated"],
      ],
      [PublicSecurityController, ["absent", "anonymous"]],
    ] as const)
      for (const key of keys) {
        const metadata = HandWrittenMetadata.operation({
          baked: true,
          members: [],
        });
        Reflect.defineMetadata(
          "nestia/OperationMetadata",
          {
            ...metadata,
            parameters: [],
            jsDocTags:
              key === "scoped"
                ? [
                    {
                      name: "security",
                      text: [{ kind: "text", text: "oauth2 read write" }],
                    },
                  ]
                : key === "optional" || key === "anonymous"
                  ? [{ name: "security" }]
                  : [],
          },
          controller.prototype,
          key,
        );
      }
    const routes = [
      ...SwaggerCompositionHarness.routes(SecurityAlternativesController),
      ...SwaggerCompositionHarness.routes(PublicSecurityController),
    ];
    assert.equal(routes.length, 7);
    const original = SwaggerCompositionHarness.canonical(
      routes.map((route) => ({
        controller: route.controller.security,
        security: route.security,
        tags: route.jsDocTags,
      })),
    );
    const requirements = [
      ["/secure/both", [{ bearer: [] }, { bearer: [], key: [] }]],
      [
        "/secure/either",
        [{ bearer: [] }, { oauth2: ["write"] }, { oauth2: ["read"] }],
      ],
      ["/secure/scoped", [{ bearer: [] }, { oauth2: ["read", "write"] }]],
      ["/secure/optional", [{ bearer: [] }, {}]],
      ["/secure/repeated", [{ bearer: [] }]],
      ["/public/anonymous", [{}]],
    ] as const;
    for (let i = 0; i < 2; ++i) {
      const document = await SwaggerCompositionHarness.compose(routes, {
        security: {
          bearer: { type: "http", scheme: "bearer" },
          key: { type: "apiKey", in: "header", name: "X-API-Key" },
          oauth2: {
            type: "oauth2",
            flows: {
              implicit: {
                authorizationUrl: "https://example.invalid/oauth",
                scopes: { read: "Read", write: "Write" },
              },
            },
          },
        },
      });
      assert.ok(document.paths, "composed document must contain paths");
      for (const [path, expected] of requirements) {
        const operation: OpenApi.IOperation | undefined =
          document.paths[path]?.get;
        assert.ok(operation, path);
        assert.equal(
          SwaggerCompositionHarness.canonical(operation.security),
          SwaggerCompositionHarness.canonical(expected),
          `${path} security alternatives`,
        );
      }
      const absent: OpenApi.IOperation | undefined =
        document.paths["/public/absent"]?.get;
      assert.ok(absent);
      assert.equal(absent.security, undefined);
      assert.equal(
        SwaggerCompositionHarness.canonical(
          routes.map((route) => ({
            controller: route.controller.security,
            security: route.security,
            tags: route.jsDocTags,
          })),
        ),
        original,
        "composition must not mutate security inputs",
      );
    }
  };
