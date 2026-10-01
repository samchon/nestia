import { TestValidator } from "@nestia/e2e";
import { Controller, Get, Query } from "@nestjs/common";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness as SwaggerParameterReader } from "./internal/SwaggerCompositionHarness";

@Controller("fallback")
class FallbackController {
  @Get("baked")
  public baked(@Query() query: object): void {
    query;
  }

  @Get("unbaked")
  public unbaked(@Query() query: object): void {
    query;
  }
}

/**
 * Verifies a decomposed parameter takes the baked property schema, and that
 * only metadata without one falls back, still honoring typia's omissions.
 *
 * The SDK transform bakes `jsonSchema.properties` for every parameter object,
 * so the JS fallback that reads only the atomic kind is left for metadata the
 * transform did not bake. On that path no bake filters for typia, so the
 * composer itself skips what typia's object schema omits: `@hidden` and
 * `@ignore` members, and `@internal` ones, which typia's metadata normally
 * drops before the composer sees them. Hand registration explicitly supplies
 * both baked and unbaked inputs regardless of the native producer, and keeps
 * the `@hidden` control intact when the formatter rewrites that source tag.
 *
 * 1. Register one query object's metadata on two routes: one baked with a property
 *    schema that differs from the fallback's, one without the bake.
 * 2. Compose the document at runtime through the direct Swagger generator.
 * 3. Assert the baked route uses the baked schema, and the unbaked route falls
 *    back to the atomic schema, both omitting the `@internal`, `@hidden`, and
 *    `@ignore` members.
 *
 * @evidence contracts/testing.md#behavioral-verification Baked/unbaked generator routes must both retain only visible, with exact number/minimum1 versus bare number schemas.
 * @evidence contracts/testing.md#independent-expectations Explicit HandWrittenMetadata supplies baked number/minimum1 and unbaked atomic-number controls plus hidden/internal/ignored members; expectations are written independently of composer output.
 * @evidence contracts/testing.md#distinguishing-cases Presence/absence of baked property schema and three omission tags distinguish bake precedence from fallback. These inputs are deliberately registered by hand, not claimed as native extraction evidence.
 * @evidence contracts/testing.md#execution-ownership The test-sdk unit entry discovers this export and directly calls reflection, typed-route and Swagger composition owners over authored metadata. No Nest application, installation, native artifact, CLI or HTTP host is prepared.
 */
export const test_sdk_swagger_decomposed_fallback = async (): Promise<void> => {
  for (const [method, baked] of [
    ["baked", true],
    ["unbaked", false],
  ] as const)
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({
        baked,
        members: ["internal", "hidden", "ignored"],
      }),
      FallbackController.prototype,
      method,
    );

  const routes = SwaggerParameterReader.routes(FallbackController);
  {
    const document = (await SwaggerParameterReader.compose(
      routes,
      {},
    )) as OpenApi.IDocument;
    for (const [path, schema] of [
      ["/fallback/baked", { type: "number", minimum: 1 }],
      ["/fallback/unbaked", { type: "number" }],
    ] as const) {
      const parameters: SwaggerParameterReader.IParameter[] =
        SwaggerParameterReader.parameters(document, path, "get");
      TestValidator.equals(
        `${path} names`,
        parameters.map((p) => p.name),
        ["visible"],
      );
      TestValidator.equals(
        `${path} schema`,
        SwaggerParameterReader.canonical(parameters[0]?.schema),
        SwaggerParameterReader.canonical(schema),
      );
    }
  }
};
