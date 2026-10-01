import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module, Query } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "../internal/HandWrittenMetadata";
import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("fallback")
class FallbackController {
  @core.TypedRoute.Get("baked")
  public baked(@Query() query: object): void {
    query;
  }

  @core.TypedRoute.Get("unbaked")
  public unbaked(@Query() query: object): void {
    query;
  }
}

@Module({ controllers: [FallbackController] })
class FallbackModule {}

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
 * 2. Compose the document at runtime with `NestiaSwaggerComposer`.
 * 3. Assert the baked route uses the baked schema, and the unbaked route falls
 *    back to the atomic schema, both omitting the `@internal`, `@hidden`, and
 *    `@ignore` members.
 *
 * @evidence contracts/testing.md#behavioral-verification Baked/unbaked public composer routes must both retain only visible, with exact number/minimum1 versus bare number schemas.
 * @evidence contracts/testing.md#independent-expectations Explicit HandWrittenMetadata supplies baked number/minimum1 and unbaked atomic-number controls plus hidden/internal/ignored members; expectations are written independently of composer output.
 * @evidence contracts/testing.md#distinguishing-cases Presence/absence of baked property schema and three omission tags distinguish bake precedence from fallback. These inputs are deliberately registered by hand, not claimed as native extraction evidence.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_fallback export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The public NestiaSwaggerComposer must consume explicitly registered metadata and actual Nest/decorator/configuration state. This probes its runtime composition boundary, not the native extraction of the handwritten metadata; generated siblings retain native-connection coverage.
 * @evidence contracts/e2e.md#shared-execution Packed dependencies and emitted runtime are shared with the feature. One local real Nest application is necessary for this distinct metadata-registration/composition probe and reused by every repeated composition in the case; no compiler is launched per compose.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Metadata is defined on this case’s distinct private controller prototype and the case owns a local application closed in finally. Config/snapshots/documents are local; deliberate caller/customizer mutation is consumed serially and never handed to a sibling.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_fallback documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_decomposed_fallback = async (): Promise<void> => {
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

  const app: INestApplication = await NestFactory.create(FallbackModule, {
    logger: false,
  });
  try {
    const document = (await NestiaSwaggerComposer.document(
      app,
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
  } finally {
    await app.close();
  }
};
